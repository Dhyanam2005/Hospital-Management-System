const express = require('express');
const router = express.Router();
const db = require("../config/db");

router.get("/consultationDoc",(req,res) => {
    let { patientName } = req.query;
    db.query(
        `SELECT p.patient_id,p.name,r.reg_id,DATE_FORMAT(p.date_of_birth, '%b, %c, %Y') date_of_birth,DATE_FORMAT(CURRENT_TIMESTAMP(),'%Y') - DATE_FORMAT(p.date_of_birth,'%Y') age from patient p,registration r where name like ? and p.patient_id = r.patient_id;`,[`%${patientName}%`],(err,result) =>{
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