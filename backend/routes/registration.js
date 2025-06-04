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
    db.query(
        `SELECT * from registration where patient_id = ? ORDER BY created_at DESC`,[patientId],(err,result) => {
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
            `UPDATE registration SET doc_id = ?, reg_charges = ?, patient_type = ?, updated_at = ?, user_id = ?, reg_status = ?, referred_by = ? WHERE reg_id = ?`,
            [docId, regCharges, patientType, now, userId, regStatus || 'R', referredBy || null, regId],
            (err, result) => {
                if (err) {
                    return res.status(400).json({ message: "Error updating registration", error: err });
                }
                return res.json({ message: "Updated successfully", result });
            }
        );
    } else {
        // INSERT new registration
        db.query(
            `INSERT INTO registration (patient_id, doc_id, reg_date, patient_type, reg_charges, created_at, user_id, reg_status, referred_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [patientId, docId, now, patientType, regCharges, now, userId, regStatus || 'R', referredBy || null],
            (err, result) => {
                if (err) {
                    return res.status(400).json({ message: "Error inserting registration", error: err });
                }
                return res.json({ message: "Inserted successfully", result });
            }
        );
    }
});

module.exports = router;