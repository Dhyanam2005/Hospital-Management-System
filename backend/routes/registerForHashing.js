const bcrypt = require('bcrypt');
const express = require('express');
const router = express.Router();
const db = require("../config/db");

router.post("/register",async (req,res) => {
    const { username , password , user_type } = req.body;
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password,saltRounds);

    db.query(
        `INSERT INTO user
        (user_name,password,user_type)
        VALUES (?,?,?)
        `,[username,hashedPassword,user_type],(err,result) => {
            if(err){
                console.error("DB Insert Error:", err); 
                return res.json({ message : "Error in insertion of user"});
            }
            res.json(result);
        }
    )
})

module.exports = router;