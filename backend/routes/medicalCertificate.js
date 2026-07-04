'use strict';

const express = require('express');
const router  = express.Router();
const db      = require('../config/db');
const { authenticateJWT } = require('./authenticateJWT');
const { generateCertificatePdf } = require('../utils/certificatePdf');

/* ── Certificate number generator: MC-YYYYMM-NNNN ───────────────────────── */
function newCertNo(cb) {
  const prefix = `MC-${new Date().toISOString().slice(0,7).replace('-','')}-`;
  db.query(
    `SELECT CERTIFICATE_NO FROM MEDICAL_CERTIFICATE
     WHERE CERTIFICATE_NO LIKE ? ORDER BY CERTIFICATE_ID DESC LIMIT 1`,
    [`${prefix}%`],
    (err, rows) => {
      if (err) return cb(err);
      let seq = 1;
      if (rows.length) {
        const last = rows[0].CERTIFICATE_NO.split('-').pop();
        seq = parseInt(last, 10) + 1;
      }
      cb(null, `${prefix}${String(seq).padStart(4, '0')}`);
    }
  );
}

/* ── Fetch full doctor row (for PDF) ─────────────────────────────────────── */
function fetchDoctor(doctorId, cb) {
  db.query(
    `SELECT d.doc_id, d.name, d.qualification, d.medical_license_number,
            ds.specialization
     FROM doctor d
     LEFT JOIN doctor_specialization ds ON d.doc_spe_id = ds.doc_spe_id
     WHERE d.doc_id = ?`,
    [doctorId],
    cb
  );
}

/* ── Fetch full patient row (for PDF) ────────────────────────────────────── */
function fetchPatient(patientId, cb) {
  db.query(
    'SELECT patient_id, name, date_of_birth, age, sex, phone FROM patient WHERE patient_id = ?',
    [patientId],
    cb
  );
}

/* ── Fetch certificate + patient + doctor (for PDF) ──────────────────────── */
function fetchCertFull(certId, cb) {
  db.query(
    'SELECT * FROM MEDICAL_CERTIFICATE WHERE CERTIFICATE_ID = ?',
    [certId],
    (err, rows) => {
      if (err) return cb(err);
      if (!rows.length) return cb(null, null, null, null);
      const cert = rows[0];

      fetchPatient(cert.PATIENT_ID, (pErr, pRows) => {
        if (pErr) return cb(pErr);
        const patient = pRows[0] || {};

        fetchDoctor(cert.DOCTOR_ID, (dErr, dRows) => {
          if (dErr) return cb(dErr);
          cb(null, cert, patient, dRows[0] || {});
        });
      });
    }
  );
}

/* ══════════════════════════════════════════════════════════════════════════
   GET /api/medical-certificates
   Query: patientId?, doctorId?, type?, from?, to?, status?
   ══════════════════════════════════════════════════════════════════════════ */
router.get('/api/medical-certificates', authenticateJWT, (req, res) => {
  const { patientId, doctorId, type, from, to, status = 'ACTIVE', search } = req.query;

  let sql = `
    SELECT mc.*,
           p.name            AS patient_name,
           p.age             AS patient_age,
           p.sex             AS patient_sex,
           d.name            AS doctor_name,
           ds.specialization AS doctor_dept
    FROM MEDICAL_CERTIFICATE mc
    JOIN patient p ON mc.PATIENT_ID = p.patient_id
    JOIN doctor  d ON mc.DOCTOR_ID  = d.doc_id
    LEFT JOIN doctor_specialization ds ON d.doc_spe_id = ds.doc_spe_id
    WHERE 1=1
  `;
  const params = [];

  if (patientId) { sql += ' AND mc.PATIENT_ID = ?';         params.push(patientId); }
  if (doctorId)  { sql += ' AND mc.DOCTOR_ID  = ?';         params.push(doctorId);  }
  if (type)      { sql += ' AND mc.CERTIFICATE_TYPE = ?';   params.push(type);      }
  if (status)    { sql += ' AND mc.STATUS = ?';             params.push(status);    }
  if (from)      { sql += ' AND mc.CERTIFICATE_DATE >= ?';  params.push(from);      }
  if (to)        { sql += ' AND mc.CERTIFICATE_DATE <= ?';  params.push(to);        }
  if (search) {
    sql += ' AND (p.name LIKE ? OR mc.CERTIFICATE_NO LIKE ? OR mc.DIAGNOSIS LIKE ?)';
    const like = `%${search}%`;
    params.push(like, like, like);
  }

  sql += ' ORDER BY mc.GENERATED_DATE DESC LIMIT 500';

  db.query(sql, params, (err, rows) => {
    if (err) {
      console.error('List certificates:', err);
      return res.status(500).json({ error: 'Failed to fetch certificates.' });
    }
    res.json(rows);
  });
});

/* ══════════════════════════════════════════════════════════════════════════
   GET /api/medical-certificates/:id
   ══════════════════════════════════════════════════════════════════════════ */
router.get('/api/medical-certificates/:id', authenticateJWT, (req, res) => {
  fetchCertFull(req.params.id, (err, cert, patient, doctor) => {
    if (err) { console.error('Get cert:', err); return res.status(500).json({ error: 'Server error.' }); }
    if (!cert) return res.status(404).json({ error: 'Certificate not found.' });
    res.json({ cert, patient, doctor });
  });
});

/* ══════════════════════════════════════════════════════════════════════════
   POST /api/medical-certificates
   Body: { patientId, regId?, admissionId?, appointmentId?,
           doctorId, certificateType, certificateDate,
           fromDate?, toDate?, totalDays?, diagnosis,
           remarks?, fitToJoinDate? }
   ══════════════════════════════════════════════════════════════════════════ */
router.post('/api/medical-certificates', authenticateJWT, (req, res) => {
  const {
    patientId, regId, admissionId, appointmentId,
    doctorId, certificateType, certificateDate,
    fromDate, toDate, totalDays, diagnosis, remarks, fitToJoinDate,
  } = req.body;

  if (!patientId || !doctorId || !certificateType || !certificateDate || !diagnosis) {
    return res.status(400).json({ error: 'patientId, doctorId, certificateType, certificateDate, diagnosis are required.' });
  }
  if (!['SICK_LEAVE','FITNESS'].includes(certificateType)) {
    return res.status(400).json({ error: 'Invalid certificateType.' });
  }

  newCertNo((genErr, certNo) => {
    if (genErr) { console.error('newCertNo:', genErr); return res.status(500).json({ error: 'Failed to generate certificate number.' }); }

    db.query(
      `INSERT INTO MEDICAL_CERTIFICATE
       (CERTIFICATE_NO, PATIENT_ID, REG_ID, ADMISSION_ID, APPOINTMENT_ID,
        DOCTOR_ID, CERTIFICATE_TYPE, CERTIFICATE_DATE, FROM_DATE, TO_DATE,
        TOTAL_DAYS, DIAGNOSIS, REMARKS, FIT_TO_JOIN_DATE,
        GENERATED_BY, GENERATED_DATE, STATUS)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,NOW(),'ACTIVE')`,
      [
        certNo,
        patientId, regId || null, admissionId || null, appointmentId || null,
        doctorId, certificateType, certificateDate,
        fromDate || null, toDate || null,
        totalDays || null, diagnosis, remarks || null, fitToJoinDate || null,
        req.user.id,
      ],
      (insErr, result) => {
        if (insErr) { console.error('Insert cert:', insErr); return res.status(500).json({ error: 'Failed to create certificate.' }); }
        res.status(201).json({ certificateId: result.insertId, certificateNo: certNo, message: 'Certificate created successfully.' });
      }
    );
  });
});

/* ══════════════════════════════════════════════════════════════════════════
   PUT /api/medical-certificates/:id/cancel
   Body: { cancelReason }
   ══════════════════════════════════════════════════════════════════════════ */
router.put('/api/medical-certificates/:id/cancel', authenticateJWT, (req, res) => {
  const { cancelReason } = req.body;
  if (!cancelReason) return res.status(400).json({ error: 'cancelReason is required.' });

  db.query(
    `UPDATE MEDICAL_CERTIFICATE
     SET STATUS='CANCELLED', CANCEL_REASON=?, CANCELLED_BY=?, CANCELLED_DATE=NOW()
     WHERE CERTIFICATE_ID=? AND STATUS='ACTIVE'`,
    [cancelReason, req.user.id, req.params.id],
    (err, result) => {
      if (err) { console.error('Cancel cert:', err); return res.status(500).json({ error: 'Failed to cancel.' }); }
      if (result.affectedRows === 0) return res.status(404).json({ error: 'Certificate not found or already cancelled.' });
      res.json({ message: 'Certificate cancelled.' });
    }
  );
});

/* ══════════════════════════════════════════════════════════════════════════
   GET /api/medical-certificates/:id/preview   (inline PDF)
   GET /api/medical-certificates/:id/download  (attachment PDF)
   ══════════════════════════════════════════════════════════════════════════ */
router.get('/api/medical-certificates/:id/preview', authenticateJWT, (req, res) => {
  fetchCertFull(req.params.id, (err, cert, patient, doctor) => {
    if (err) { console.error('Preview cert:', err); return res.status(500).json({ error: 'Server error.' }); }
    if (!cert) return res.status(404).json({ error: 'Certificate not found.' });
    generateCertificatePdf(cert, patient, doctor, res, true).catch(pErr => {
      console.error('PDF gen:', pErr);
      if (!res.headersSent) res.status(500).json({ error: 'PDF generation failed.' });
    });
  });
});

router.get('/api/medical-certificates/:id/download', authenticateJWT, (req, res) => {
  fetchCertFull(req.params.id, (err, cert, patient, doctor) => {
    if (err) { console.error('Download cert:', err); return res.status(500).json({ error: 'Server error.' }); }
    if (!cert) return res.status(404).json({ error: 'Certificate not found.' });
    generateCertificatePdf(cert, patient, doctor, res, false).catch(pErr => {
      console.error('PDF gen:', pErr);
      if (!res.headersSent) res.status(500).json({ error: 'PDF generation failed.' });
    });
  });
});

/* ── GET /api/medical-certificates/lookup/patient/:patientId/registrations ─
   Returns registrations for patient (to auto-populate form)               */
router.get('/api/medical-certificates/lookup/patient/:patientId/registrations', authenticateJWT, (req, res) => {
  db.query(
    `SELECT r.reg_id, r.reg_date, r.patient_type,
            d.name AS doctor_name, d.doc_id
     FROM registration r
     LEFT JOIN doctor d ON r.doc_id = d.doc_id
     WHERE r.patient_id = ? ORDER BY r.reg_date DESC LIMIT 20`,
    [req.params.patientId],
    (err, rows) => {
      if (err) return res.status(500).json({ error: 'Failed to fetch registrations.' });
      res.json(rows);
    }
  );
});

/* ── GET /api/medical-certificates/lookup/patient/:patientId/admissions ────
   Returns admissions for patient (to auto-populate form)                  */
router.get('/api/medical-certificates/lookup/patient/:patientId/admissions', authenticateJWT, (req, res) => {
  db.query(
    `SELECT adm.reg_id AS admission_id, adm.admission_date, adm.discharge_date,
            adm.admit_reason, d.name AS doctor_name, d.doc_id,
            w.ward_name
     FROM admission adm
     JOIN registration r ON adm.reg_id = r.reg_id
     LEFT JOIN doctor d ON adm.doc_id = d.doc_id
     LEFT JOIN ward_room_bed wrb ON adm.bed_id = wrb.bed_id
     LEFT JOIN ward_room wr ON wrb.ward_room_id = wr.ward_room_id
     LEFT JOIN ward w ON wr.ward_id = w.ward_id
     WHERE r.patient_id = ? ORDER BY adm.admission_date DESC LIMIT 20`,
    [req.params.patientId],
    (err, rows) => {
      if (err) return res.status(500).json({ error: 'Failed to fetch admissions.' });
      res.json(rows);
    }
  );
});

module.exports = router;
