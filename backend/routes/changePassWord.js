const express = require('express');
const jwt = require('jsonwebtoken');
const db = require("../config/db");
const { findUserById } = require("../models/userIdModel");
const bcrypt = require('bcryptjs');
const router = express.Router();

function authenticateJWT(req, res, next) {
    const token = req.header('Authorization')?.split(' ')[1];
    if (!token) {
        return res.status(401).json({ message: 'You are not logged in yet' });
    }

    jwt.verify(token, "your-secret-key", (err, user) => {
        if (err) return res.status(403).json({ message: 'Access Denied: Invalid token' });
        req.user = user;
        next();
    });
}

router.post("/changepassword", authenticateJWT, async (req, res) => {
    const userId = req.user.id;
    const { oldPassword, newPassword, confirmPassword } = req.body;

    findUserById(userId,async (err, result) => {
        if (err) {
            return res.status(500).json({ message: 'Database error' });
        }
        if (result.length === 0) {      
            return res.status(404).json({ message: 'User not found' });
        }

        const user = result[0];

        const isPasswordValid = await bcrypt.compare(oldPassword,user.password,);
        if(!isPasswordValid) return res.json({ message : "Password entered is invalid "});

        if (newPassword.length < 8) {
            return res.status(400).json({ message: 'Entered password length is insufficient' });
        }

        if (newPassword !== confirmPassword) {
            console.log("Submitted old password:", oldPassword);
            console.log("Stored password in DB:", user.password);
            return res.status(400).json({ message: 'New and confirm password do not match' });
        }

        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(newPassword,saltRounds);
        db.query('UPDATE user SET password = ? WHERE user_id = ?', [hashedPassword, userId], (err, result) => {
            if (err) {
                return res.status(500).json({ message: 'Error updating password' });
            }
            return res.status(200).json({ message: 'Password changed successfully' });
        });
    });
});

module.exports = router;
