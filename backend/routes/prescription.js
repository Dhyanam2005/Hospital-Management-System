const express = require('express');
const router = express.Router();
const db = require("../config/db");
const { insertIntoAuditLog } = require('./auditLog');
const { authenticateJWT } = require("./authenticateJWT");

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
    const { date, doc, reg } = req.query;
    console.log(req.query);

    db.query(
        `SELECT 
  pd.drug_id,
  pd.dosage_schedule_id,
  pd.food_instruction_id,
  pd.prescription_detail_id,
  ? AS Date,
  ? AS doc_id,
  ? AS reg_id,
  p.prescription_id
FROM 
  prescription p,
  prescription_detail pd
WHERE 
  p.prescription_id = pd.prescription_id
  AND p.reg_id = ?
  AND p.doc_id = ?
  AND p.prescription_date = ?
`,[date,doc,reg,reg,doc,date],(err,result) => {
    if(err){
        console.error(err);
        return res.json({ message : "Error in fetching prescription"});
    }
    res.json(result);
}
    )
})

router.post("/prescription", async (req, res) => {
  const { prescriptions, selectedDate, selectedDoctor, selectedPatientRegId } = req.body;
  console.log(req.body);
  if (!prescriptions || !Array.isArray(prescriptions) || prescriptions.length === 0) {
    return res.status(400).json({ message: "No prescriptions provided" });
  }

  const values1 = [selectedPatientRegId, selectedDoctor, selectedDate];

  const queryPromise = (sql, params) =>
    new Promise((resolve, reject) => {
      db.query(sql, params, (err, results) => {
        if (err) reject(err);
        else resolve(results);
      });
    });

  try {
    let existingPrescription = await queryPromise(
      `SELECT prescription_id FROM prescription WHERE reg_id = ? AND doc_id = ? AND prescription_date = ?`,
      values1
    );

    let prescriptionId;

    if (existingPrescription.length === 0) {
      const insertResult = await queryPromise(
        `INSERT INTO prescription (reg_id, doc_id, prescription_date) VALUES (?, ?, ?)`,
        values1
      );

      prescriptionId = insertResult.insertId;
    } else {
      prescriptionId = existingPrescription[0].prescription_id;
    }

    const newPrescriptions = prescriptions.filter((p) => !p.prescription_detail_id);
    console.log("insert");
    console.log(newPrescriptions);

    const insertPromises = newPrescriptions.map((p) => {
      const insertSql = `
        INSERT INTO prescription_detail (prescription_id, drug_id, dosage_schedule_id, food_instruction_id)
        VALUES (?, ?, ?, ?)
      `;
      const insertValues = [prescriptionId, p.drug_id, p.dosage_schedule_id, p.food_instruction_id];
      return queryPromise(insertSql, insertValues);
    });

    const insertResults = await Promise.all(insertPromises);


    const updatePrescriptions = prescriptions.filter((p) => p.prescription_detail_id && p.update_flag);
    console.log("Update")
    console.log(updatePrescriptions);
    const updatePromises = updatePrescriptions.map((p) => {
      const updateSql = `
        UPDATE prescription_detail
        SET drug_id = ?, dosage_schedule_id = ?, food_instruction_id = ?
        WHERE prescription_detail_id = ?
      `;
      const updateValues = [p.drug_id, p.dosage_schedule_id, p.food_instruction_id, p.prescription_detail_id];
      return queryPromise(updateSql, updateValues);
    });

    await Promise.all(updatePromises);

    res.json({ message: "Prescription details processed successfully", insertResults });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error processing prescription" });
  }
});



router.delete("/prescription/:id", (req, res) =>{
  let prescription_detail_id = req.params.id;
  db.query(`DELETE FROM prescription_detail where prescription_detail_id = ?`,[prescription_detail_id],(err,result) => {
    if(err){
      console.error(err);
      return res.json({ message : "Error in deletion "});
    }

    res.json(result);
  })
});

module.exports = router;