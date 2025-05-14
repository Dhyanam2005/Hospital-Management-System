const express = require('express');
const db = require("../config/db");
const router = express.Router();

router.get("/fetchInHouseDoctors",(req,res) => {
    const val = 'I';
    db.query(
        "SELECT * from doctor where doc_type = ?",[val],(err,result) => {
            if(err){
                return res.json({ message : "Error in searching doctor db"});
            }
            res.json(result);
        }
    )
})

module.exports = router;