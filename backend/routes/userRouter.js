const express = require('express');
const router  = express.Router();
const db      = require('../config/db');
const { authenticateJWT } = require('./authenticateJWT');

router.get('/users', authenticateJWT, (req, res) => {
  db.query(
    'SELECT user_id, user_name, user_email, created_at FROM user ORDER BY user_id ASC',
    (err, results) => {
      if (err) return res.status(500).json({ message: 'DB Error' });
      res.json(results);
    }
  );
});

module.exports = router;
