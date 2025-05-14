const express = require('express');
const db = require('../config/db');
const router = express.Router(); 

router.get("/specializations", (req, res) => {
  db.query("SELECT * FROM doctor_specialization", (err, results) => {
    if (err) return res.status(500).json({ message: "DB Error" });
    return res.json(results);
  });
});

module.exports = router;