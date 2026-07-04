const express = require('express');
const router = express.Router();
const db = require("../config/db");
const { authenticateJWT } = require('./authenticateJWT');

router.get("/regStatus", authenticateJWT, (req, res) => {
    const { regId } = req.query;
    db.query(`SELECT reg_status FROM registration WHERE reg_id = ?`, [regId], (err, result) => {
        if (err || result.length === 0) return res.status(500).json({ message: "Error fetching status" });
        res.json(result);
    });
});

module.exports = router;