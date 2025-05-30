const express = require('express');
const db = require("../config/db");
const router = express.Router();

router.get("/fetchpat",(req,res) => {
    const { patientName } = req.query;
    db.query(
        "SELECT p.patient_id,p.name,DATE_FORMAT(p.date_of_birth, '%b, %c, %Y') date_of_birth,DATE_FORMAT(CURRENT_TIMESTAMP(),'%Y') - DATE_FORMAT(p.date_of_birth,'%Y') age from patient p where name like ?;",[`%${patientName}%`],(err,result) => {
            if(err){
                return res.json({ message : "Error in searching patient db"});
            }
            if(result.length == 0){
                return res.status(400).json({ message : "No such patient exists"});
            }
            res.json(result);
        }
    )
})

router.get("/fetchAllPatients",(req,res) => {
    db.query(`SELECT * from patient`,(err,result) => {
        if(err) return res.json({ message : "Error in fetching all patients"});
        res.json(result);
    })
})

module.exports = router;