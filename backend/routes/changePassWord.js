const express = require('express');
const jwt = require('jsonwebtoken');
const db = require("../config/db");
const { findUserById } = require("../models/userIdModel");
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

router.post("/changepassword", authenticateJWT, (req, res) => {
    const userId = req.user.id;
    const { oldPassword, newPassword, confirmPassword } = req.body;

    findUserById(userId, (err, result) => {
        if (err) {
            return res.status(500).json({ message: 'Database error' });
        }
        if (result.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }

        const user = result[0];

        if (oldPassword !== user.password || newPassword.length < 8) {
            return res.status(400).json({ message: 'Entered password is incorrect' });
        }

        if (newPassword !== confirmPassword) {
            console.log("Submitted old password:", oldPassword);
            console.log("Stored password in DB:", user.password);
            return res.status(400).json({ message: 'New and confirm password do not match' });
        }

        db.query('UPDATE user SET password = ? WHERE user_id = ?', [newPassword, userId], (err, result) => {
            if (err) {
                return res.status(500).json({ message: 'Error updating password' });
            }
            return res.status(200).json({ message: 'Password changed successfully' });
        });
    });
});

module.exports = router;
