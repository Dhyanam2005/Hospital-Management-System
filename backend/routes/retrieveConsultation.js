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

router.get("/fetchMedicalItems",(req,res) => {
    let { regId } = req.query;
    console.log(regId);
    db.query(
        `select m.medical_item_id , m.drug_id,d.drug_name as medicineName , DATE_FORMAT(m.issue_date, '%Y-%m-%d') as date , m.item_qty,m.item_price,m.item_value, "No" as update_flag
        from drug_master d,medical_item m
        where d.drug_id = m.drug_id
        and reg_id = ?`,[regId],(err,result) => {
        if(err){
            return res.json({ message : "Error in fetching consultations "});
        }
        res.json(result);
    }
    )
})

router.post("/docConsultation",authenticateJWT, async (req,res) =>{
    console.log("post route called")
    const userId = req.user.id;
    try{
        let {regId , consultation} = req.body;
        console.log(regId);
        console.log("Consultation is " ,consultation);
        const Invalid = consultation.filter(c => c.doc_id === ' ' || c.date === ' ' || c.fee === ' ');
        console.log("Invalid is ",Invalid);
        if(Invalid.length > 0) return res.status(400).json({ message : "Mandatory fields missing" });
        const udpates = consultation.filter(c => c.update_flag != "No");
        const updatedPromises = udpates.map(c => {
        return new Promise((resolve,reject) => {
            db.query(`UPDATE DOC_CONSULTATION
                    SET doc_id = ?,consultation_date = ?,doc_fee = ?
                    where doc_consultation_id = ?`,
                [c.doc_id,c.date,c.fee,c.consultationId],(err,result) => {
                    if(err) reject(err);
                    resolve(result);
            })
        })
    })
    console.log("bckhidckck")
    const newRows = consultation.filter(c => !c.consultationId);
    console.log("New Rows is ",newRows);
    const newPromises = newRows.map(c => {
        return new Promise((resolve,reject) =>{
            db.query(
                `INSERT INTO DOC_CONSULTATION
                (doc_id,reg_id,consultation_date,doc_fee,created_at,user_id)
                VALUES (?,?,?,?,NOW(),?)`,
                [c.doc_id,regId,c.date,c.fee,userId],(err,result) => {
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

router.delete("/docConsultation/:id",(req,res) => {
    let id  = req.params.id;
    console.log(id);
    if(!id){
        
    }else{
        console.log("Called old");
        db.query(`
            DELETE FROM DOC_CONSULTATION
            WHERE doc_consultation_id = ?`,
            [id],(err,result) => {
                if(err){
                    return res.json({ message : "Error in deleteion of old row"});
                }
                return res.json(result);
            })
    }
})

module.exports = router;


