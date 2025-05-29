const express = require('express');
const jwt = require('jsonwebtoken');
const router = express.Router();
const db = require("../config/db");
const { use } = require('react');

function authenticateJWT(req, res, next) {
    const token = req.header('Authorization')?.split(' ')[1];
    if (!token) {
        console.log("No token")
        return res.status(401).json({ message: 'Access Denied: No token provided' });
    }

    jwt.verify(token, "your-secret-key", (err, user) => {
        if (err) return res.status(403).json({ message: 'Access Denied: Invalid token' });
        req.user = user;
        next();
    });
}

router.get("/fetchServices",(req,res) => {
    db.query(
        `SELECT * from service`,(err,result) => {
            if(err) return res.json({ message : "Error"});
            return res.json(result); 
        }
    )
})

router.get("/fetchPatientCharges",(req,res) => {
    let { regId } = req.query;
    db.query(
        `SELECT s.service_name,p.service_id,DATE_FORMAT(p.service_date, '%Y-%m-%d') as service_date,p.service_amt,p.reg_id,p.doc_id,d.name,"No" as update_flag,p.charge_id
        from service s,patient_charge p,doctor d
        where s.service_id = p.service_id
        and p.doc_id = d.doc_id
        and reg_id =?`,[regId],(err,result) => {
        if(err){
            return res.json({ message : "Error in fetching medicalItemss "});
        }
        res.json(result);
    }
    )
})

router.post("/patientCharges", async (req,res) =>{
    try{
        let {regId , patientCharges} = req.body;
        console.log(regId);
        console.log(patientCharges);
        const udpates = patientCharges.filter(c => c.update_flag != "No");
        const updatedPromises = udpates.map(c => {
        return new Promise((resolve,reject) => {
            db.query(`UPDATE patient_charge
                    SET service_id = ?,service_date = ?,service_amt = ?,reg_id = ?,doc_id = ?
                    where charge_id = ?`,
                [c.service_id,c.service_date,c.service_amt,regId,c.doc_id,c.charge_id],(err,result) => {
                    if(err) reject(err);
                    resolve(result);
            })
        })
    })
    const newRows = patientCharges.filter(c => !c.charge_id);
    const newPromises = newRows.map(c => {
        return new Promise((resolve,reject) =>{
            db.query(
                `INSERT INTO patient_charge
                (service_id,service_date,service_amt,reg_id,doc_id)
                VALUES (?,?,?,?,?)`,
                [c.service_id,c.service_date,c.service_amt,regId,c.doc_id],(err,result) => {
                    if(err) reject(err);
                    resolve(result);
                }
            )
        }
        )
    })

    await Promise.all([...updatedPromises,...newPromises]);
    res.json({ message : "All data saved successfully"});
    
    }catch(err){
        console.error("Error is ",err);
        res.json({ message : "Error in posting info "});
    }
})

router.delete("/patientcharge/:id",(req,res) => {
    let id  = req.params.id;
    console.log(id);
    if(!id){
        
    }else{
        console.log("Called old");
        db.query(`
            DELETE FROM patient_charge
            WHERE charge_id = ?`,
            [id],(err,result) => {
                if(err){
                    return res.json({ message : "Error in deleteion of old row"});
                }
                return res.json(result);
            })
    }
})

module.exports = router;


