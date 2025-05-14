const express = require('express')
const router = express.Router();
const db = require('../config/db');

router.get('/users',(req,res) => {
    db.query(
        "SELECT * from user" , (err,results) => {
            if(err){
                return res.status(500).send('DB Error');
            }else{
                res.json(results);
            }
        }
    )
})

module.exports = router;