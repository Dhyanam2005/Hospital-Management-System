const db = require('../config/db');
const express = require('express');
const router = express.Router();

router.get("/cities",(req,res) => {
    db.query(
        'SELECT * from city',(err,result) => {
            if(err){
                return res.json({ message : "Error occured in fetching form city db"});
            }
            res.json(result);
        }
    )
})

module.exports = router;