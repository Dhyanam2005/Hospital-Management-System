const express = require('express')
const router = express.Router();
const db = require('../config/db');
const { authenticateJWT } = require('./authenticateJWT');

router.get("/fetchTests", authenticateJWT, (req,res) => {
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