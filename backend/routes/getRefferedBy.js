const db = require('../config/db');
const express = require('express');
const router = express.Router();

router.get("/refferedby",(req,res) => {
    const value = 'R';
    db.query(
        'SELECT * from doctor where doc_type = ?',[value],(err,result) => {
            if(err){
                return res.json({ message : "Error occured in fetching form city db"});
            }
            res.json(result);
        }
    )
})

module.exports = router;