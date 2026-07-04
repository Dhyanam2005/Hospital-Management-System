'use strict';

const express = require('express');
const router  = express.Router();
const db      = require('../config/db');
const { authenticateJWT } = require('./authenticateJWT');

/* helper macro — ensures every table-sourced string uses utf8mb4 so the
   UNION ALL branches never produce a "Illegal mix of collations" error    */
const cv = col => `CONVERT(${col} USING utf8mb4)`;

/* ── UNION ALL: all patient events ────────────────────────────────────────── */
const EVENTS_SQL = `
SELECT * FROM (

  /* 1 — Registration */
  SELECT
    DATE_FORMAT(r.reg_date, '%Y-%m-%dT%H:%i:%s') AS event_date,
    'REGISTRATION' AS event_type,
    'Patient Registration' AS event_title,
    CONVERT(CONCAT(
      'Registered as ', IF(r.patient_type='I','Inpatient','Outpatient'),
      IF(r.referred_by IS NOT NULL AND r.referred_by != '',
         CONCAT('. Referred by: ', r.referred_by), '')
    ) USING utf8mb4) AS description,
    'Registration' AS module,
    CONCAT('REG-', r.reg_id) AS reference_id,
    CONVERT(CASE r.reg_status
      WHEN 'R' THEN 'Active'
      WHEN 'A' THEN 'Admitted'
      WHEN 'D' THEN 'Discharged'
      ELSE COALESCE(r.reg_status,'Active')
    END USING utf8mb4) AS status,
    CONVERT(d.name USING utf8mb4) AS doctor_name,
    CONVERT(ds.specialization USING utf8mb4) AS department,
    'registration' AS icon_type,
    '#22c55e' AS color
  FROM registration r
  LEFT JOIN doctor d               ON r.doc_id      = d.doc_id
  LEFT JOIN doctor_specialization ds ON d.doc_spe_id = ds.doc_spe_id
  WHERE r.patient_id = ?

  UNION ALL

  /* 2 — Appointment (non-cancelled) */
  SELECT
    CONCAT(DATE_FORMAT(a.APPOINTMENT_DATE,'%Y-%m-%d'),'T',
           TIME_FORMAT(a.APPOINTMENT_TIME,'%H:%i:%s')) AS event_date,
    'APPOINTMENT' AS event_type,
    'Appointment Scheduled' AS event_title,
    CONVERT(CONCAT('Scheduled at ', TIME_FORMAT(a.APPOINTMENT_TIME,'%h:%i %p')) USING utf8mb4) AS description,
    'Appointment' AS module,
    CONCAT('APT-', a.APPOINTMENT_ID) AS reference_id,
    CONVERT(COALESCE(a.status,'BOOKED') USING utf8mb4) AS status,
    CONVERT(d.name USING utf8mb4) AS doctor_name,
    CONVERT(ds.specialization USING utf8mb4) AS department,
    'appointment' AS icon_type,
    '#3b82f6' AS color
  FROM appointment a
  LEFT JOIN doctor d               ON a.DOCTOR_ID   = d.doc_id
  LEFT JOIN doctor_specialization ds ON d.doc_spe_id = ds.doc_spe_id
  WHERE a.PATIENT_ID = ?
    AND COALESCE(a.status,'BOOKED') != 'CANCELLED'

  UNION ALL

  /* 3 — Admission */
  SELECT
    DATE_FORMAT(adm.admission_date,'%Y-%m-%dT%H:%i:%s') AS event_date,
    'ADMISSION' AS event_type,
    'Patient Admitted' AS event_title,
    CONVERT(CONCAT(
      'Reason: ', COALESCE(adm.admit_reason,'N/A'),
      ' | Ward: ', COALESCE(w.ward_name,'N/A'),
      ', Bed: ',   COALESCE(wrb.bed_number,'N/A')
    ) USING utf8mb4) AS description,
    'Admission' AS module,
    CONCAT('ADM-', adm.reg_id) AS reference_id,
    CONVERT(IF(adm.discharge_date IS NOT NULL,'Discharged','Admitted') USING utf8mb4) AS status,
    CONVERT(d.name USING utf8mb4) AS doctor_name,
    CONVERT(ds.specialization USING utf8mb4) AS department,
    'admission' AS icon_type,
    '#a855f7' AS color
  FROM admission adm
  JOIN  registration r             ON adm.reg_id    = r.reg_id
  LEFT JOIN doctor d               ON adm.doc_id    = d.doc_id
  LEFT JOIN doctor_specialization ds ON d.doc_spe_id = ds.doc_spe_id
  LEFT JOIN ward_room_bed wrb      ON adm.bed_id    = wrb.bed_id
  LEFT JOIN ward_room wr           ON wrb.ward_room_id = wr.ward_room_id
  LEFT JOIN ward w                 ON wr.ward_id    = w.ward_id
  WHERE r.patient_id = ?

  UNION ALL

  /* 4 — Discharge */
  SELECT
    DATE_FORMAT(adm.discharge_date,'%Y-%m-%dT%H:%i:%s') AS event_date,
    'DISCHARGE' AS event_type,
    'Patient Discharged' AS event_title,
    CONVERT(CONCAT(
      'Discharged from ', COALESCE(w.ward_name,'Ward'),
      '. Stay: ', DATEDIFF(adm.discharge_date, adm.admission_date), ' day(s)'
    ) USING utf8mb4) AS description,
    'Admission' AS module,
    CONCAT('DIS-', adm.reg_id) AS reference_id,
    'Discharged' AS status,
    CONVERT(d.name USING utf8mb4) AS doctor_name,
    CONVERT(ds.specialization USING utf8mb4) AS department,
    'discharge' AS icon_type,
    '#06b6d4' AS color
  FROM admission adm
  JOIN  registration r             ON adm.reg_id    = r.reg_id
  LEFT JOIN doctor d               ON adm.doc_id    = d.doc_id
  LEFT JOIN doctor_specialization ds ON d.doc_spe_id = ds.doc_spe_id
  LEFT JOIN ward_room_bed wrb      ON adm.bed_id    = wrb.bed_id
  LEFT JOIN ward_room wr           ON wrb.ward_room_id = wr.ward_room_id
  LEFT JOIN ward w                 ON wr.ward_id    = w.ward_id
  WHERE r.patient_id = ? AND adm.discharge_date IS NOT NULL

  UNION ALL

  /* 5 — Doctor Consultation */
  SELECT
    DATE_FORMAT(dc.consultation_date,'%Y-%m-%dT%H:%i:%s') AS event_date,
    'CONSULTATION' AS event_type,
    'Doctor Consultation' AS event_title,
    CONVERT(CONCAT('Consultation fee: ₹', FORMAT(dc.doc_fee,2)) USING utf8mb4) AS description,
    'Consultation' AS module,
    CONCAT('CON-', dc.doc_consultation_id) AS reference_id,
    'Completed' AS status,
    CONVERT(d.name USING utf8mb4) AS doctor_name,
    CONVERT(ds.specialization USING utf8mb4) AS department,
    'consultation' AS icon_type,
    '#f59e0b' AS color
  FROM doc_consultation dc
  JOIN  registration r             ON dc.reg_id     = r.reg_id
  LEFT JOIN doctor d               ON dc.doc_id     = d.doc_id
  LEFT JOIN doctor_specialization ds ON d.doc_spe_id = ds.doc_spe_id
  WHERE r.patient_id = ?

  UNION ALL

  /* 6 — Lab Test */
  SELECT
    DATE_FORMAT(td.test_date,'%Y-%m-%dT%H:%i:%s') AS event_date,
    'LAB_TEST' AS event_type,
    CONVERT(CONCAT('Lab Test: ', t.test_name) USING utf8mb4) AS event_title,
    CONVERT(CONCAT(
      'Category: ', COALESCE(tc.test_category_name,'N/A'),
      ' | Result: ',
      COALESCE(
        td.result_char,
        IF(td.result_num IS NOT NULL,
           CONCAT(CAST(td.result_num AS CHAR), COALESCE(CONCAT(' ',t.test_unit),'')),
           'Pending')
      )
    ) USING utf8mb4) AS description,
    'Laboratory' AS module,
    CONCAT('TST-', td.test_detail_id) AS reference_id,
    CONVERT(IF(td.result_char IS NOT NULL OR td.result_num IS NOT NULL,
       'Result Available','Pending') USING utf8mb4) AS status,
    CONVERT(d.name USING utf8mb4) AS doctor_name,
    CONVERT(COALESCE(tc.test_category_name,'Laboratory') USING utf8mb4) AS department,
    'lab_test' AS icon_type,
    '#f97316' AS color
  FROM test_detail td
  JOIN  registration r             ON td.reg_id     = r.reg_id
  JOIN  test t                     ON td.test_id    = t.test_id
  LEFT JOIN test_category tc       ON t.test_category_id = tc.test_category_id
  LEFT JOIN doctor d               ON td.doc_id     = d.doc_id
  WHERE r.patient_id = ?

  UNION ALL

  /* 7 — Prescription */
  SELECT
    DATE_FORMAT(p.prescription_date,'%Y-%m-%dT%H:%i:%s') AS event_date,
    'PRESCRIPTION' AS event_type,
    'Prescription Issued' AS event_title,
    CONVERT(CONCAT(COUNT(pd.prescription_detail_id),' medication(s) prescribed') USING utf8mb4) AS description,
    'Prescription' AS module,
    CONCAT('RX-', p.prescription_id) AS reference_id,
    'Issued' AS status,
    CONVERT(d.name USING utf8mb4) AS doctor_name,
    CONVERT(ds.specialization USING utf8mb4) AS department,
    'prescription' AS icon_type,
    '#ec4899' AS color
  FROM prescription p
  JOIN  registration r             ON p.reg_id      = r.reg_id
  LEFT JOIN doctor d               ON p.doc_id      = d.doc_id
  LEFT JOIN doctor_specialization ds ON d.doc_spe_id = ds.doc_spe_id
  LEFT JOIN prescription_detail pd ON p.prescription_id = pd.prescription_id
  WHERE r.patient_id = ?
  GROUP BY p.prescription_id, p.prescription_date, d.name, ds.specialization

  UNION ALL

  /* 8 — Pharmacy Items */
  SELECT
    DATE_FORMAT(mi.issue_date,'%Y-%m-%dT%H:%i:%s') AS event_date,
    'PHARMACY' AS event_type,
    CONVERT(CONCAT('Pharmacy: ', COALESCE(dm.drug_name,'Unknown Drug')) USING utf8mb4) AS event_title,
    CONVERT(CONCAT(
      'Qty: ', mi.item_qty,
      ' | Price: ₹', mi.item_price,
      ' | Total: ₹', mi.item_value
    ) USING utf8mb4) AS description,
    'Pharmacy' AS module,
    CONCAT('MED-', mi.medical_item_id) AS reference_id,
    'Dispensed' AS status,
    NULL AS doctor_name,
    'Pharmacy' AS department,
    'pharmacy' AS icon_type,
    '#8b5cf6' AS color
  FROM medical_item mi
  JOIN  registration r             ON mi.reg_id     = r.reg_id
  LEFT JOIN drug_master dm         ON mi.drug_id    = dm.drug_id
  WHERE r.patient_id = ?

  UNION ALL

  /* 9 — Patient Charges / Services */
  SELECT
    DATE_FORMAT(pc.service_date,'%Y-%m-%dT%H:%i:%s') AS event_date,
    'SERVICE' AS event_type,
    CONVERT(CONCAT('Service: ', COALESCE(s.service_name,'Unknown Service')) USING utf8mb4) AS event_title,
    CONVERT(CONCAT('Amount: ₹', FORMAT(pc.service_amt,2)) USING utf8mb4) AS description,
    'Clinical Services' AS module,
    CONCAT('SVC-', pc.charge_id) AS reference_id,
    'Charged' AS status,
    CONVERT(d.name USING utf8mb4) AS doctor_name,
    CONVERT(ds.specialization USING utf8mb4) AS department,
    'service' AS icon_type,
    '#14b8a6' AS color
  FROM patient_charge pc
  JOIN  registration r             ON pc.reg_id     = r.reg_id
  LEFT JOIN service s              ON pc.service_id  = s.service_id
  LEFT JOIN doctor d               ON pc.doc_id     = d.doc_id
  LEFT JOIN doctor_specialization ds ON d.doc_spe_id = ds.doc_spe_id
  WHERE r.patient_id = ?

  UNION ALL

  /* 10 — Payment */
  SELECT
    DATE_FORMAT(pay.payment_date,'%Y-%m-%dT%H:%i:%s') AS event_date,
    'PAYMENT' AS event_type,
    'Payment Received' AS event_title,
    CONVERT(CONCAT(
      'Mode: ', pay.payment_mode,
      ' | Paid: ₹', FORMAT(pay.amt_to_pay,2),
      ' | Discount: ₹', FORMAT(COALESCE(pay.discount,0),2)
    ) USING utf8mb4) AS description,
    'Billing' AS module,
    CONCAT('PAY-', pay.reg_id) AS reference_id,
    'Paid' AS status,
    NULL AS doctor_name,
    'Billing' AS department,
    'payment' AS icon_type,
    '#10b981' AS color
  FROM payment pay
  JOIN registration r              ON pay.reg_id    = r.reg_id
  WHERE r.patient_id = ?

  UNION ALL

  /* 11 — Patient Documents */
  SELECT
    DATE_FORMAT(pd.UPLOADED_DATE,'%Y-%m-%dT%H:%i:%s') AS event_date,
    'DOCUMENT' AS event_type,
    CONVERT(CONCAT('Document: ', dm.DOCUMENT_NAME) USING utf8mb4) AS event_title,
    CONVERT(CONCAT(
      COALESCE(pd.DOCUMENT_TITLE, pd.FILE_NAME),
      ' | Size: ', ROUND(pd.FILE_SIZE/1024,1), ' KB'
    ) USING utf8mb4) AS description,
    'Documents' AS module,
    CONCAT('DOC-', pd.PATIENT_DOCUMENT_ID) AS reference_id,
    'Uploaded' AS status,
    NULL AS doctor_name,
    CONVERT(dm.DOCUMENT_NAME USING utf8mb4) AS department,
    'document' AS icon_type,
    '#6366f1' AS color
  FROM PATIENT_DOCUMENT pd
  JOIN DOCUMENT_MASTER dm          ON pd.DOCUMENT_ID = dm.DOCUMENT_ID
  WHERE pd.PATIENT_ID = ? AND pd.STATUS = 'ACTIVE'

) AS all_events
ORDER BY event_date ASC
`;

const SUMMARY_SQL = `
SELECT
  (SELECT COUNT(DISTINCT reg_id)  FROM registration           WHERE patient_id = ?)  AS total_visits,
  (SELECT MIN(reg_date)           FROM registration           WHERE patient_id = ?)  AS first_visit,
  (SELECT COUNT(*)                FROM appointment
   WHERE PATIENT_ID = ? AND COALESCE(status,'BOOKED') != 'CANCELLED')                AS total_appointments,
  (SELECT COUNT(*)                FROM admission adm
   JOIN registration r ON adm.reg_id = r.reg_id              WHERE r.patient_id = ?) AS total_admissions,
  (SELECT COUNT(*)                FROM test_detail td
   JOIN registration r ON td.reg_id = r.reg_id               WHERE r.patient_id = ?) AS total_lab_tests,
  (SELECT COUNT(*)                FROM prescription p
   JOIN registration r ON p.reg_id = r.reg_id                WHERE r.patient_id = ?) AS total_prescriptions,
  (SELECT COALESCE(SUM(pay.amt_to_pay),0) FROM payment pay
   JOIN registration r ON pay.reg_id = r.reg_id              WHERE r.patient_id = ?) AS total_paid,
  (SELECT COUNT(*)                FROM PATIENT_DOCUMENT
   WHERE PATIENT_ID = ? AND STATUS = 'ACTIVE')                                        AS total_documents
`;

/* ── GET /api/patient/:patientId/timeline ─────────────────────────────────── */
router.get('/api/patient/:patientId/timeline', authenticateJWT, (req, res) => {
  const patientId = parseInt(req.params.patientId, 10);
  if (!patientId || isNaN(patientId)) {
    return res.status(400).json({ error: 'Invalid patient ID.' });
  }

  db.query(
    'SELECT patient_id, name, date_of_birth, phone, sex, age FROM patient WHERE patient_id = ?',
    [patientId],
    (pErr, pRows) => {
      if (pErr) {
        console.error('Timeline patient query:', pErr);
        return res.status(500).json({ error: 'Failed to fetch patient.' });
      }
      if (!pRows.length) return res.status(404).json({ error: 'Patient not found.' });

      const patient = pRows[0];
      const eventParams = Array(11).fill(patientId);

      db.query(EVENTS_SQL, eventParams, (eErr, events) => {
        if (eErr) {
          console.error('Timeline events query:', eErr);
          return res.status(500).json({ error: 'Failed to fetch timeline events.', detail: eErr.message });
        }

        const summaryParams = Array(8).fill(patientId);

        db.query(SUMMARY_SQL, summaryParams, (sErr, sRows) => {
          if (sErr) {
            console.error('Timeline summary query:', sErr);
            return res.status(500).json({ error: 'Failed to fetch summary.' });
          }

          res.json({ patient, events, summary: sRows[0] });
        });
      });
    }
  );
});

module.exports = router;
