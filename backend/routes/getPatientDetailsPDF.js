const express = require('express')
const router = express.Router();
const db = require('../config/db');

router.get("/patientpdf",(req,res) => {
    let patiendId = 4; 
    // For time being im conisidering constant value

    db.query(
        'select patient_id,name,sex,phone,age,address from patient where patient_id = ?',
        [patiendId],
        (err,result) => {
            if(err){
                return res.json({ message : "Error in getting info of patient database"});
            }
            return res.json( result );
        }
    )
})

module.exports = router;