    const express = require('express');
    const jwt = require('jsonwebtoken');
    const db = require("../config/db")
    const bcrypt = require('bcryptjs');
    const router = express.Router();

    const SECRET_KEY = "your-secret-key";

    router.post("/login",(req,res) => {
        const { username , password } = req.body;
        console.log("Username is ", username);
        console.log("Password is ",password);
        db.query("SELECT * FROM user WHERE user_name = ?", [username], (err, result) => {
            if(err){
                return res.status(401).json({ message : "Error"});
            }
            if(result.length == 0){
                return res.status(401).json({ message : "No Result"});
            }

            const user = result[0];
            console.log("Password is ",user.password);

        
            if (password !== user.password) {
                return res.status(401).json({ message: "Invalid password" });
            }   
                const token = jwt.sign(
                    { id : user.user_id ,username : user.user_name , type : user.user_type },
                    SECRET_KEY,
                    { expiresIn : '1h'}
                );

                res.json({ token });
        })
    })

    module.exports = router;