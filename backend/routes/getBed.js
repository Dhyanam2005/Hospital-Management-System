const express = require('express')
const router = express.Router();
const db = require('../config/db');
const { route } = require('./retrievePatientCharge');
const jwt = require('jsonwebtoken');

const getter = {
    1 : "Super Delux",
    2 : "Delux",
    3 : "Semi Delux",
    4 : "General"
}

function authenticateJWT(req, res, next) {
    const token = req.header('Authorization')?.split(' ')[1];
    if (!token) {
        return res.status(401).json({ message: 'You are not logged in yet' });
    }

    jwt.verify(token, "your-secret-key", (err, user) => {
        if (err) return res.status(403).json({ message: 'Access Denied: Invalid token' });
        req.user = user;
        next();
    });
}

router.get("/beds",(req,res) => {

    db.query(`select b.bed_id, concat( w.ward_name , ?, r.room_number , ?, b.bed_number) as bed
            from ward w, ward_room r, ward_room_bed b
            where w.ward_id = r.ward_id
            and r.ward_room_id = b.ward_room_id
            and b.bed_status = ?`,['-','-','A'],(err,results) => {
        if(err){
            return res.json({ message : "DB Error "});
        }
        res.json(results);
    })
})

router.get("/fetchAdmission", (req, res) => {
    let { regId } = req.query;
    console.log("Fetch admission called")
    const getter = {
        1: "Super Delux",
        2: "Delux",
        3: "Semi Delux",
        4: "General"
    };

    db.query(
        `SELECT d.name, DATE_FORMAT(a.admission_date, '%Y-%m-%d') AS admission_date,DATE_FORMAT(a.discharge_date, '%Y-%m-%d') AS discharge_date, a.ward_charges, a.admit_reason, 
                a.bed_id,a.admission_charges,d.doc_id
         FROM admission a
         JOIN doctor d ON a.doc_id = d.doc_id
         WHERE a.reg_id = ?`,
        [regId],
        (err, result) => {
            if (err) {
                return res.json({ message: "Error in fetching db" });
            }
            if (result.length === 0) {
                return res.json({ message: "No admission found for this regId" });
            }

            const admissionData = result[0];
            db.query(
                `SELECT bed_number FROM ward_room_bed WHERE bed_id = ?`,
                [admissionData.bed_id],
                (err2, bedResult) => {
                    if (err2) {
                        return res.json({ message: "Error fetching bed details" });
                    }
                    if (bedResult.length > 0) {
                        const bedNumber = bedResult[0].bed_number;
                        const typeCode = parseInt(bedNumber.toString()[0]);
                        const bedType = getter[typeCode] || "Unknown";
                        const bedDisplay = `${bedType}-${bedNumber}`;
                        return res.json({ ...admissionData, bed: bedDisplay });
                    } else {
                        return res.json({ ...admissionData, bed: "Unknown" });
                    }
                }
            );
        }
    );
});


router.post("/admission", authenticateJWT, (req, res) => {
    let {
        doctor,
        admissionDate,
        admitReason,
        selectedBed,
        wardCharges,
        dischargeDate,
        regId,
        admissionCharges
    } = req.body;
    console.log(doctor , admissionDate , admitReason , selectedBed , wardCharges , dischargeDate , admissionCharges);
    const userId = req.user.id;

    db.query(
        `INSERT INTO admission
        (doc_id, admission_date, admit_reason, bed_id, ward_charges, discharge_date, reg_id, user_id, admission_charges)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
            doc_id = VALUES(doc_id),
            admission_date = VALUES(admission_date),
            admit_reason = VALUES(admit_reason),
            bed_id = VALUES(bed_id),
            ward_charges = VALUES(ward_charges),
            discharge_date = VALUES(discharge_date),
            user_id = VALUES(user_id),
            admission_charges = VALUES(admission_charges);
            
            UPDATE ward_room_bed set bed_status = "O" where bed_id = ?;

            UPDATE registration set reg_status = "A" where reg_id = ?;
        `,
        [
            doctor,
            admissionDate,
            admitReason,
            selectedBed,
            wardCharges,
            dischargeDate,
            regId,
            userId,
            admissionCharges,
            selectedBed,
            regId
        ],
        (err, result) => {
            if (err) return res.json({ message: "Insert/Update failed", error: err });
            return res.json({ message: "Insert/Update successful", result });
        }
    );
});


module.exports = router;