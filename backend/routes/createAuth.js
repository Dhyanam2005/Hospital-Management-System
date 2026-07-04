const express  = require('express');
const router   = express.Router();
const { findUserByUsername } = require('../models/userModel');
const db       = require('../config/db');
const bcrypt   = require('bcryptjs');
const { authenticateJWT } = require('./authenticateJWT');

router.post('/newuser', authenticateJWT, async (req, res) => {
  if (!req.user.isSuperAdmin) return res.status(403).json({ message: 'Super Admin only' });
  const { username, password, confirm_password, email } = req.body;

  if (!username || !password || !confirm_password || !email) {
    return res.status(400).json({ message: 'Mandatory fields missing' });
  }
  if (password !== confirm_password || password.length < 8) {
    return res.status(400).json({ message: 'Password not validating' });
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  findUserByUsername(username, (err, users) => {
    if (err) return res.status(500).json({ message: 'DB error' });
    if (users.length !== 0) return res.status(409).json({ message: 'User already exists' });

    db.query(
      'INSERT INTO user (user_name, password, user_email) VALUES (?, ?, ?)',
      [username, hashedPassword, email],
      (err) => {
        if (err) return res.status(500).json({ message: 'DB insert error', error: err });
        return res.status(201).json({ message: 'User created successfully' });
      }
    );
  });
});

module.exports = router;
