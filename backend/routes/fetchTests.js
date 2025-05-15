const express = require('express')
const router = express.Router();
const db = require('../config/db');

router.get("/fetchTests",(req,res) => {
    console.log("Fetch called");
    db.query('SELECT * from test',(err,results) => {
        if(err){
            return res.json({ message : "DB Error "});
        }
        console.log("Reuslt is ",results);
        res.json(results);
    })
})

module.exports = router;