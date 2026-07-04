const bcrypt = require('bcrypt');
const express = require('express');
const router = express.Router();
const db = require("../config/db");
const { authenticateJWT } = require('./authenticateJWT');

router.post("/register", authenticateJWT, async (req,res) => {
    if (!req.user.isSuperAdmin) return res.status(403).json({ message: 'Super Admin only' });
    const { username , password } = req.body;
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password,saltRounds);

    db.query(
        `INSERT INTO user (user_name, password) VALUES (?, ?)`,
        [username, hashedPassword], (err,result) => {
            if(err){
                console.error("DB Insert Error:", err); 
                return res.json({ message : "Error in insertion of user"});
            }
            res.json(result);
        }
    )
})

module.exports = router;