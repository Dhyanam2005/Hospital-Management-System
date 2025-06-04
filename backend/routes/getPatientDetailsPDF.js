const express = require('express')
const router = express.Router();
const db = require('../config/db');

router.get("/patientpdf",(req,res) => {
    let regId = req.query.regId;
    console.log(req.query); 
    db.query(
        `select p.patient_id,p.name,p.sex,p.phone,p.age,p.address ,? as reg_id
        from patient p,registration r
        where p.patient_id = r.patient_id
        and r.reg_id = ?`,
        [regId, regId],
        (err,result) => {
            if(err){
                return res.json({ message : "Error in getting info of patient database"});
            }
            return res.json( result );
        }
    )
})

module.exports = router;