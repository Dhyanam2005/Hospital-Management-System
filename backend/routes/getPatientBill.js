const express = require('express');
const router = express.Router();
const db = require("../config/db");

router.get("/patientBill",(req,res) => {
    let regId = req.query.regId;
    db.query(
        `SELECT * from v_patient_bill where regId = ?`,[regId],(err,result) => {
            if(err) return res.json({ message : "Error in fetching patient bill "});
            res.json(result);
        }
    )
})

module.exports = router;