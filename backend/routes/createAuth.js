const express = require('express');
const router = express.Router();
const { findUserByUsername } = require('../models/userModel');
const db = require("../config/db");
const bcrypt = require('bcryptjs');

const userTypeMapping = {
    admin: 1,
    doctor: 2,
    operator: 3
};

router.post("/newuser", async (req, res) => {
    const { username, password, confirm_password, type,email } = req.body;

    if (!username || !password || !confirm_password || !type || type === "Select Role" || !email) {
        return res.status(400).json({ message: 'Mandatory fields missing' });
    }

    if (password !== confirm_password || password.length < 8) {
        return res.status(400).json({ message: 'Password not validating' });
    }
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password,saltRounds);
    findUserByUsername(username, (err, users) => {
        if (err) {
            return res.status(500).json({ message: 'DB error' });
        }

        if (users.length !== 0) {
            return res.status(409).json({ message: "User already exists" });
        }
        
        db.query(
            "INSERT INTO user (user_name, password, user_type,user_email) VALUES (?, ?, ?,?)",
            [username, hashedPassword, userTypeMapping[type],email],
            (err, result) => {
                if (err) {
                    return res.status(500).json({ message: "DB insert error", error: err });
                }

                return res.status(201).json({ message: "User created successfully" });
            }
        );
    });
});

module.exports = router;
