const express = require('express')
const router = express.Router()
const db = require('../config/db')
const jwt = require('jsonwebtoken')
const { insertIntoAuditLog } = require('./auditLog');

function authenticateJWT(req, res, next) {
  const token = req.header('Authorization')?.split(' ')[1]
  if (!token) return res.status(401).json({ message: 'You are not logged in yet' })

  jwt.verify(token, "your-secret-key", (err, user) => {
    if (err) return res.status(403).json({ message: 'Access Denied: Invalid token' })
    req.user = user
    next()
  })
}

router.get("/beds", (req, res) => {
  db.query(
    `select b.bed_id, concat(w.ward_name, ?, r.room_number, ?, b.bed_number) as bed
     from ward w, ward_room r, ward_room_bed b
     where w.ward_id = r.ward_id
       and r.ward_room_id = b.ward_room_id
       and b.bed_status = ?`,
    ['-', '-', 'A'],
    (err, results) => {
      if (err) return res.json({ message: "DB Error" })
      res.json(results)
    }
  )
})

router.get("/fetchAdmission", (req, res) => {
  const { regId } = req.query
  db.query(
    `SELECT d.name, DATE_FORMAT(a.admission_date, '%Y-%m-%d') AS admission_date,
            DATE_FORMAT(a.discharge_date, '%Y-%m-%d') AS discharge_date, a.ward_charges, a.admit_reason,
            a.bed_id, a.admission_charges, d.doc_id,
            concat(w.ward_name, ?, r.room_number, ?, b.bed_number) as bed
     FROM admission a, doctor d, ward w, ward_room r, ward_room_bed b
     WHERE a.doc_id = d.doc_id
       AND a.reg_id = ?
       AND a.bed_id = b.bed_id
       AND b.ward_room_id = r.ward_room_id
       AND r.ward_id = w.ward_id`,
    ['-', '-', regId],
    (err, result) => {
      if (err) return res.json({ message: "Error in fetching admission" })
      res.json(result)
    }
  )
})

router.post("/admission", authenticateJWT, (req, res) => {
  const {
    doctor,
    admissionDate,
    admitReason,
    selectedBed,
    wardCharges,
    dischargeDate,
    regId,
    admissionCharges
  } = req.body

  const userId = req.user.id

  db.query(`SELECT * FROM admission WHERE reg_id = ?`, [regId], (err, rows) => {
    if (err) return res.status(500).json({ message: "Fetch old admission failed", error: err })

    const isUpdate = rows.length > 0
    const oldDataRaw = isUpdate ? rows[0] : null

    const oldData = {}
    if (oldDataRaw) {
      for (const key in oldDataRaw) {
        oldData[key.toLowerCase()] = oldDataRaw[key]
      }
    }

    const newDataFull = {
      doc_id: doctor,
      admission_date: admissionDate,
      admit_reason: admitReason,
      bed_id: selectedBed,
      ward_charges: wardCharges || null,
      discharge_date: dischargeDate || null,
      reg_id: regId,
      user_id: userId,
      admission_charges: admissionCharges
    }

    const admissionData = [
      doctor,
      admissionDate,
      admitReason,
      selectedBed,
      wardCharges || null,
      dischargeDate || null,
      regId,
      userId,
      admissionCharges
    ]

    const query = `
      INSERT INTO admission
      (doc_id, admission_date, admit_reason, bed_id, ward_charges, discharge_date, reg_id, user_id, admission_charges)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        doc_id = VALUES(doc_id),
        admission_date = VALUES(admission_date),
        admit_reason = VALUES(admit_reason),
        ward_charges = VALUES(ward_charges),
        discharge_date = VALUES(discharge_date),
        user_id = VALUES(user_id),
        admission_charges = VALUES(admission_charges)
    `

    db.query(query, admissionData, (err, result) => {
      if (err) return res.status(500).json({ message: "Insert/Update failed", error: err })

      let newDataChanged = {}
      if (oldDataRaw) {
      const normalize = (val) => {
        if (val === null || val === undefined) return '';
        if (typeof val === 'string') return val.trim().toLowerCase();

        if (val instanceof Date) {
          return new Intl.DateTimeFormat('en-CA').format(val);
        }

        if (!isNaN(Date.parse(val))) {
          return new Intl.DateTimeFormat('en-CA').format(new Date(Date.parse(val)));
        }

        return JSON.stringify(val).toLowerCase();
      }

        for (const key in newDataFull) {
          const oldVal = oldData[key.toLowerCase()]
          const newVal = newDataFull[key]
          console.log(oldVal + "  " + newVal);
          if (normalize(oldVal) !== normalize(newVal)) {
            console.log(normalize(oldVal) + "  " + normalize(newVal));
            newDataChanged[key] = newVal
          }
        }
      } else {
        newDataChanged = newDataFull
      }

      const action = isUpdate ? "UPDATE_ADMISSION" : "CREATE_ADMISSION"

      insertIntoAuditLog(db, {
        user_id: userId,
        action,
        table_name: "admission",
        record_id: regId,
        old_data: isUpdate ? oldDataRaw : null,
        new_data: newDataChanged
      }, err => {
        if (err) {
          console.error(err)
          return res.status(500).json({ message: "Audit log failed", error: err })
        }

        db.query(`UPDATE ward_room_bed SET bed_status = "O" WHERE bed_id = ?`, [selectedBed], err => {
          if (err) return res.status(500).json({ message: "Bed update failed", error: err })

          db.query(`UPDATE registration SET reg_status = "A" WHERE reg_id = ?`, [regId], err => {
            if (err) return res.status(500).json({ message: "Registration update failed", error: err })

            res.json({ message: "Admission Inserted/Updated with audit log" })
          })
        })
      })
    })
  })
})

module.exports = router