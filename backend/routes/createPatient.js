const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const db = require('../config/db');

function authenticateJWT(req, res, next) {
    const token = req.header('Authorization')?.split(' ')[1];
    if (!token) return res.status(401).json({ message: 'Access Denied: No token provided' });

    jwt.verify(token, "your-secret-key", (err, user) => {
        if (err) return res.status(403).json({ message: 'Access Denied: Invalid token' });
        req.user = user;
        next();
    });
}

function calculateAge(dob) {
    const [day, month, year] = dob.split('-').map(Number);
    const birthDate = new Date(year, month - 1, day);
    const today = new Date();

    let age = today.getFullYear() - birthDate.getFullYear();
    const hasBirthdayPassed = today.getMonth() > birthDate.getMonth() ||
        (today.getMonth() === birthDate.getMonth() && today.getDate() >= birthDate.getDate());

    if (!hasBirthdayPassed) age--;
    return age;
}

router.post("/patient", authenticateJWT, (req, res) => {
    const userId = req.user.id;
    const {
        patientName, dob, phone, address, email,
        pincode, gender, nextOfKinName,
        nextOfKinPhone, cityId, refferedBy
    } = req.body;

    console.log("Reffered by is ", refferedBy);

    if (!patientName || !dob || !phone || !address || !email || !pincode || !gender || !nextOfKinName || !nextOfKinPhone || !cityId) {
        return res.status(400).json({ message: "Invalid Credentials" });
    }

    const dobRegex = /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12][0-9]|3[01])$/;
if (!dobRegex.test(dob)) {
    return res.status(400).json({ message: "Invalid DOB format. Use yyyy-mm-dd" });
}
    if(patientName === nextOfKinName || phone === nextOfKinPhone){
        return res.json({ message : "Error in kin or patient"});
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        return res.status(400).json({ message: "Email incorrect" });
    }

    if (phone.length !== 10 || nextOfKinPhone.length !== 10) {
        return res.status(400).json({ message: "Invalid Phone number" });
    }

    db.query('SELECT * FROM patient WHERE name = ?', [patientName], (err, result) => {
        if (err) return res.status(500).json({ message: 'DB error while checking patient' });
        if (result.length !== 0) return res.status(400).json({ message: 'Patient already exists' });

        const age = calculateAge(dob);

        const insertQuery = `
            INSERT INTO patient 
            (name, date_of_birth, age, phone, address, email, pincode, sex, next_of_kin_name, next_of_kin_phone, city_id, referred_by, created_at,user_id)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,?)
        `;

        const values = [
            patientName, dob, age, phone, address, email, pincode, gender,
            nextOfKinName, nextOfKinPhone, cityId, refferedBy || null,new Date(), userId
        ];

        db.query(insertQuery, values, (err, insertResult) => {
            if (err) {
                console.error("Insert error:", err);
                return res.status(500).json({ message: 'Error inserting patient' });
            }
            return res.status(200).json({ message: 'Patient created successfully' });
        });
    });
});

module.exports = router;
