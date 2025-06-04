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

router.get("/fetch-prescription",(req,res) => {
    const { prescriptions, date, doc, reg } = req.query;
    console.log(req.query);
    db.query(
        `select pd.drug_id,pd.dosage_schedule_id ,pd.food_instruction_id,? as Date,? as doc_id,? as reg_id
from prescription p,prescription_detail pd
where p.prescription_id = pd.prescription_id
and p.reg_id = ?
and p.doc_id = ?
and p.prescription_date = ?`,[date,doc,reg,reg,doc,date],(err,result) => {
    if(err){
        console.error(err);
        return res.json({ message : "Error in fetching prescription"});
    }
    res.json(result);
}
    )
})

router.post("/prescription", (req, res) => {
    const { prescriptions, selectedDate, selectedDoctor, selectedPatientRegId } = req.body;

    const checkQuery = `
        SELECT prescription_id FROM prescription
        WHERE reg_id = ? AND doc_id = ? AND prescription_date = ?
    `;

    db.query(checkQuery, [selectedPatientRegId, selectedDoctor, selectedDate], (err, result) => {
        if (err) return res.status(500).json({ message: "Error checking prescription" });

        if (result.length > 0) {
            const prescriptionId = result[0].prescription_id;

            const deleteQuery = `DELETE FROM prescription_detail WHERE prescription_id = ?`;

            db.query(deleteQuery, [prescriptionId], (err2) => {
                if (err2) return res.status(500).json({ message: "Error deleting old details" });

                if (!prescriptions || prescriptions.length === 0) {
                    return res.status(200).json({ message: "Prescription cleared successfully." });
                }

                const values = prescriptions.map(p => [
                    prescriptionId,
                    p.drug_id,
                    p.dosage_schedule_id,
                    p.food_instruction_id
                ]);

                const insertDetailsQuery = `
                    INSERT INTO prescription_detail (prescription_id, drug_id, dosage_schedule_id, food_instruction_id)
                    VALUES ?
                `;

                db.query(insertDetailsQuery, [values], (err3) => {
                    if (err3) return res.status(500).json({ message: "Error inserting new details" });
                    res.status(200).json({ message: "Prescription updated successfully." });
                });
            });
        } else {
            const insertPrescriptionQuery = `
                INSERT INTO prescription (reg_id, doc_id, prescription_date)
                VALUES (?, ?, ?)
            `;

            db.query(insertPrescriptionQuery, [selectedPatientRegId, selectedDoctor, selectedDate], (err4, result2) => {
                if (err4) return res.status(500).json({ message: "Error inserting into prescription" });

                const prescriptionId = result2.insertId;

                if (!prescriptions || prescriptions.length === 0) {
                    return res.status(200).json({ message: "Prescription saved with no details" });
                }

                const values = prescriptions.map(p => [
                    prescriptionId,
                    p.drug_id,
                    p.dosage_schedule_id,
                    p.food_instruction_id
                ]);

                const insertDetailsQuery = `
                    INSERT INTO prescription_detail (prescription_id, drug_id, dosage_schedule_id, food_instruction_id)
                    VALUES ?
                `;

                db.query(insertDetailsQuery, [values], (err5) => {
                    if (err5) return res.status(500).json({ message: "Error inserting into prescription_detail" });
                    res.status(200).json({ message: "Prescription and details saved successfully" });
                });
            });
        }
    });
});

router.delete("/prescription", (req, res) => {
    const { reg, doc, date } = req.query;

    const getQuery = `
        SELECT prescription_id FROM prescription
        WHERE reg_id = ? AND doc_id = ? AND prescription_date = ?
    `;

    db.query(getQuery, [reg, doc, date], (err, result) => {
        if (err) return res.status(500).json({ message: "Error fetching prescription ID" });

        if (result.length === 0) return res.status(404).json({ message: "Prescription not found" });

        const prescriptionId = result[0].prescription_id;

        const deleteDetails = `DELETE FROM prescription_detail WHERE prescription_id = ?`;
        db.query(deleteDetails, [prescriptionId], (err2) => {
            if (err2) return res.status(500).json({ message: "Error deleting details" });

            const deletePrescription = `DELETE FROM prescription WHERE prescription_id = ?`;
            db.query(deletePrescription, [prescriptionId], (err3) => {
                if (err3) return res.status(500).json({ message: "Error deleting prescription" });
                res.status(200).json({ message: "Prescription deleted successfully" });
            });
        });
    });
});



module.exports = router;