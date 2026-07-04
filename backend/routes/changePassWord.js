const express = require('express');
const db = require("../config/db");
const { findUserById } = require("../models/userIdModel");
const bcrypt = require('bcryptjs');
const { authenticateJWT } = require('./authenticateJWT');
const router = express.Router();

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
