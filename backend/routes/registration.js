const express = require('express');
const router = express.Router();
const db = require("../config/db");
const jwt = require('jsonwebtoken');


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

router.get("/fetch-registration",(req,res) => {
    let {patientId} = req.query;
    db.query(
        `SELECT * from registration where patient_id = ?`,[patientId],(err,result) => {
            if(err) return res.json({ message : "Error fetching Registration "});
            res.json(result);
        }
    )
})

router.post("/registration",authenticateJWT,(req,res) => {
    let { regCharges , patientType , docId , patientId} = req.body;
    let userId = req.user.id;
    console.log("User id is ",userId);
    console.log("Reg charges is ",regCharges);
    console.log("patientType is ",patientType);
    console.log("docId is ",docId);
    if(!regCharges || !patientType || !docId){
        return res.status(400).json({ message : " Mandatory fields missing "});
    }

    if(regCharges <= 0){
        return res.status(400).json( { message : "Fees must be positive"});
    }

    const today = new Date();
    db.query(
        'INSERT INTO registration (patient_id,doc_id,reg_date,patient_type,reg_charges,created_at,user_id) VALUES (?,?,?,?,?,?,?)',
        [patientId,docId,today,patientType,regCharges,today,userId],
        (err,result) => {
            if(err) return res.status(400).json({ message : "Error in insertion into database "});
            return res.json(result);
        }
    )
})

module.exports = router;