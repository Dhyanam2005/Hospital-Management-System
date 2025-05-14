const express = require('express');
const jwt = require('jsonwebtoken');
const db = require('../config/db');
const router = express.Router();

function authenticateJWT(req, res, next) {
    const token = req.header('Authorization')?.split(' ')[1];
    if (!token) {
        return res.status(401).json({ message: 'Access Denied: No token provided' });
    }

    jwt.verify(token, "your-secret-key", (err, user) => {
        if (err) return res.status(403).json({ message: 'Access Denied: Invalid token' });
        req.user = user;
        next();
    });
}

router.get("/user", authenticateJWT, (req, res) => {
    const userId = req.user.id;

    db.query('SELECT * FROM user WHERE user_id = ?', [userId], (err, results) => {
        if (err) {
            return res.status(500).send('Database error');
        } else if (results.length === 0) {
            return res.status(404).send('User not found');
        } else {
            res.json(results[0]);
        }
    });
});

router.post("/doctor", authenticateJWT, (req, res) => {
    let userId = req.user.id;
    userId = parseInt(userId);

    let { doctorName, email, phone, address, qualification, specialization, licenseNumber , docType } = req.body;
console.log({doctorName,email,phone,address,qualification,specialization,licenseNumber,userId});

    if (!doctorName || !email || !phone || !address || !qualification || !specialization || !licenseNumber || !docType) {
        return res.status(400).json({ message: "Invalid credentials" });
    }



    if (phone.length !== 10 || !/^\d+$/.test(phone) || specialization === "") {
        return res.status(400).json({ message: "Invalid phone number" });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        return res.status(400).json({ message: "Email incorrect" });
    }

    db.query(
        'SELECT * FROM doctor WHERE medical_license_number = ?',
        [licenseNumber],
        (err, results) => {
            if (err) {
                return res.status(500).json({ message: 'DB Error' });
            }
            if (results.length > 0) {
                return res.status(409).json({ message: "Doctor already exists" });
            }

            db.query(
                'INSERT INTO doctor (name, email, phone, address, qualification, doc_spe_id, medical_license_number, user_id,doc_type) VALUES (?, ?, ?, ?, ?, ?, ?, ?,?)',
                [doctorName, email, phone, address, qualification, specialization, licenseNumber, userId,docType],
                (err2,result) => {
                    if (err2) {
                        console.error("Insert Error:", err2); // 👈 Add this
                        return res.status(500).json({ message: 'DB Error during insert' ,});
                    }
                    return res.status(201).json(result);
                }
            );
        }
    );
});

module.exports = router;
