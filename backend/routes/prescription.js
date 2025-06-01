const express = require('express');
const router = express.Router();
const db = require("../config/db");

router.get("/fetchLatestRegPatient",(req,res) => {
    db.query(
        `select r.patient_id , MAX(r.reg_id) as reg_id , p.name
        from registration r,patient p
        where r.patient_id = p.patient_id
        GROUP BY r.patient_id,p.name`,(err,result) => {
            if(err) return res.json({ message : "Error fetching max reg_id for each patient "});
            res.json(result);
        }
    )
})

router.post("/prescription", (req, res) => {
    const { prescriptions, selectedDate, selectedDoctor, selectedPatientRegId } = req.body;

    const insertPrescriptionQuery = `
        INSERT INTO prescription (reg_id, doc_id, prescription_date)
        VALUES (?, ?, ?)
    `;

    db.query(insertPrescriptionQuery, [selectedPatientRegId, selectedDoctor, selectedDate], (err, result) => {
        if (err) {
            return res.status(500).json({ message: "Error inserting into prescription" });
        }

        const prescriptionId = result.insertId;

        const prescriptionDetails = prescriptions.map(item => [
            prescriptionId,
            item.drug_id,
            item.dosage_schedule_id,
            item.food_instruction_id
        ]);
        console.log(prescriptionDetails);

        if (prescriptionDetails.length === 0) {
            return res.status(200).json({ message: "Prescription saved without any details." });
        }

        const insertDetailQuery = `
            INSERT INTO prescription_detail (prescription_id, drug_id, dosage_schedule_id, food_instruction_id)
            VALUES ?
        `;

        db.query(insertDetailQuery, [prescriptionDetails], (err2, result2) => {
            if (err2) {
                return res.status(500).json({ message: "Error inserting into prescription_detail" });
            }

            res.status(200).json({ message: "Prescription saved successfully." });
        });
    });
});


module.exports = router;