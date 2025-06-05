const express = require('express');
const router = express.Router();
const db = require("../config/db");
const jwt = require('jsonwebtoken');


function authenticateJWT(req, res, next) {
    const token = req.header('Authorization')?.split(' ')[1];
    if (!token) {
        return res.status(401).json({ message: 'Access Denied: No token provided' });
    }

    jwt.verify(token, "your-secret-key", (err, user) => {
        if (err) return res.status(403).json({ message: 'Access Denied: Invalid token' });
        req.user = user;
        next();
    });
}

router.get("/fetch-registration",(req,res) => {
    let {patientId} = req.query;
    console.log(patientId);
    db.query(
        `SELECT * from registration where patient_id = ? and reg_status != "D" ORDER BY created_at DESC limit 1`,[patientId],(err,result) => {
            if(err) return res.json({ message : "Error fetching Registration "});
            res.json(result);
        }
    )
})

router.post("/registration", authenticateJWT, (req, res) => {
    let { regCharges, patientType, docId, patientId, regId, regStatus, referredBy } = req.body;
    let userId = req.user.id;

    if (!regCharges || !patientType || !docId) {
        return res.status(400).json({ message: "Mandatory fields missing" });
    }

    if (regCharges <= 0) {
        return res.status(400).json({ message: "Fees must be positive" });
    }

    const now = new Date();

if (regId) {
    db.query(
        `SELECT * FROM registration WHERE reg_id = ?`,
        [regId],
        (selectErr, oldRows) => {
            if (selectErr || oldRows.length === 0) {
                return res.status(400).json({ message: "Error fetching old registration data", error: selectErr });
            }

            const oldRecord = oldRows[0];
            const newRecord = {
                doc_id: docId,
                reg_charges: regCharges,
                patient_type: patientType,
                updated_at: now,
                user_id: userId,
                reg_status: regStatus || 'R',
                referred_by: referredBy || null
            };

            const oldData = {};
            const newData = {};

            for (const key in newRecord) {
                if (newRecord[key] !== oldRecord[key]) {
                    oldData[key] = oldRecord[key];
                    newData[key] = newRecord[key];
                }
            }

            db.query(
                `UPDATE registration SET doc_id = ?, reg_charges = ?, patient_type = ?, updated_at = ?, user_id = ?, reg_status = ?, referred_by = ? WHERE reg_id = ?`,
                [docId, regCharges, patientType, now, userId, regStatus || 'R', referredBy || null, regId],
                (err, result) => {
                    if (err) {
                        return res.status(400).json({ message: "Error updating registration", error: err });
                    }

                    db.query(
                        `INSERT INTO audit_log (user_id, action, table_name, record_id, old_data, new_data)
                         VALUES (?, ?, ?, ?, ?, ?)`,
                        [userId, 'UPDATE', 'registration', regId, JSON.stringify(oldData), JSON.stringify(newData)],
                        (auditErr, auditResult) => {
                            if (auditErr) {
                                console.error(auditErr);
                                return res.status(500).json({ message: "Updated but audit log failed", auditError: auditErr });
                            }
                            return res.json({ message: "Updated and audit logged successfully", result });
                        }
                    );
                }
            );
        }
    );
}
else {
    db.query(
        `INSERT INTO registration (patient_id, doc_id, reg_date, patient_type, reg_charges, created_at, user_id, reg_status, referred_by)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [patientId, docId, now, patientType, regCharges, now, userId, regStatus || 'R', referredBy || null],
        (err, result) => {
            if (err) {
                return res.status(400).json({ message: "Error inserting registration", error: err });
            }

            const insertedId = result.reg_id;
            const newData = {
                patient_id: patientId,
                doc_id: docId,
                reg_date: now,
                patient_type: patientType,
                reg_charges: regCharges,
                created_at: now,
                user_id: userId,
                reg_status: regStatus || 'R',
                referred_by: referredBy || null
            };

            db.query(
                `INSERT INTO audit_log (user_id, action, table_name, record_id, new_data)
                 VALUES (?, ?, ?, ?, ?)`,
                [userId, 'INSERT', 'registration', insertedId, JSON.stringify(newData)],
                (auditErr, auditResult) => {
                    if (auditErr) {
                        return res.status(500).json({ message: "Inserted but audit log failed", auditError: auditErr });
                    }
                    return res.json({ message: "Inserted and audit logged successfully", result });
                }
            );
        }
    );
}});

module.exports = router;