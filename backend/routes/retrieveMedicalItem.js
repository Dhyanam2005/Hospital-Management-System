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

router.get("/fetchMedicines",(req,res) => {
    db.query(
        `SELECT * from drug_master`,(err,result) => {
            if(err) return res.json({ message : "Error"});
            return res.json(result); 
        }
    )
})

router.get("/fetchMedicalItems  ",(req,res) => {
    let { regId } = req.query;
    db.query(
        `select m.medical_item_id , m.drug_id,d.drug_name as medicineName , DATE_FORMAT(m.issue_date, '%Y-%m-%d') as date , m.item_qty,m.item_price,m.item_value, "No" as update_flag
        from drug_master d,medical_item m
        where d.drug_id = m.drug_id
        and reg_id = ?`,[regId],(err,result) => {
        if(err){
            return res.json({ message : "Error in fetching medicalItemss "});
        }
        res.json(result);
    }
    )
})

router.post("/medicalItems", async (req,res) =>{
    try{
        let {regId , medicalItems} = req.body;
        console.log(regId);
        console.log(medicalItems);
        const udpates = medicalItems.filter(c => c.update_flag != "No");
        const updatedPromises = udpates.map(c => {
        return new Promise((resolve,reject) => {
            db.query(`UPDATE medical_item
                    SET drug_id = ?,issue_date = ?,item_qty = ?,reg_id = ?,item_price = ?
                    where medical_item_id = ?`,
                [c.drug_id,c.date,c.quantity,regId,c.price,c.medical_item_id],(err,result) => {
                    if(err) reject(err);
                    resolve(result);
            })
        })
    })
    const newRows = medicalItems.filter(c => !c.medical_item_id);
    console.log("New Rows is ",newRows);
    const newPromises = newRows.map(c => {
        return new Promise((resolve,reject) =>{
            db.query(
                `INSERT INTO medical_item
                (drug_id,reg_id,issue_date,item_qty,item_price,created_at)
                VALUES (?,?,?,?,?,NOW())`,
                [c.drug_id,regId,c.date,c.quantity,c.price],(err,result) => {
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

router.delete("/docmedicalItems/:id",(req,res) => {
    let id  = req.params.id;
    console.log(id);
    if(!id){
        
    }else{
        console.log("Called old");
        db.query(`
            DELETE FROM medical_item
            WHERE medical_item_id = ?`,
            [id],(err,result) => {
                if(err){
                    return res.json({ message : "Error in deleteion of old row"});
                }
                return res.json(result);
            })
    }
})

module.exports = router;


