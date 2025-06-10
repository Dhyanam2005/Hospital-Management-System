const express = require('express')
const router = express.Router();
const db = require('../config/db');

router.get("/doctor",(req,res) => {
    db.query('SELECT d.doc_id,d.doc_type,d.name,d.email,d.phone,d.address,d.qualification,d.medical_license_number,d.created_at,dp.specialization,u.user_name from doctor d,doctor_specialization dp,user u where d.doc_spe_id = dp.doc_spe_id and d.user_id = u.user_id',(err,results) => {
        if(err){
            return res.json({ message : "DB Error "});
        }
        res.json(results);
    })
})

module.exports = router;