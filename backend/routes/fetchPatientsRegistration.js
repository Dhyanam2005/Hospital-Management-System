const express = require('express');
const db = require("../config/db");
const router = express.Router();

router.get("/fetchpatreg",(req,res) => {
    const { patientName } = req.query;
    console.log(patientName);
    db.query(
        "SELECT p.patient_id,p.name,r.reg_id,DATE_FORMAT(p.date_of_birth, '%b, %c, %Y') date_of_birth,DATE_FORMAT(CURRENT_TIMESTAMP(),'%Y') - DATE_FORMAT(p.date_of_birth,'%Y') age from patient p,registration r where name like ? and p.patient_id = r.patient_id;",[`%${patientName}%`],(err,result) => {
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

module.exports = router;