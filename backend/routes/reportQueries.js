const express = require('express')
const router = express.Router();
const db = require('../config/db');

router.get("/patientReportStateWise",(req,res) => {
    db.query(
        `select DATE_FORMAT(p.created_at ,'%e %b %y') as Date,s.state_name as State,c.city_name as City,COUNT(*) as \`No of Patients\`
from city c , state s , patient p
where p.city_id = c.city_id
and s.state_id = c.state_id
GROUP BY Date ,State ,City;
`,(err,result) => {
    if(err){
        return res.json({ message : "Error"})
    }
    return res.json(result);
}
    )
})

router.get("/doctorWiseRegistrationFees",(req,res) => {
    db.query(
        `select DATE_FORMAT(r.reg_date, '%e %M %Y') as Date,d.name as Doctor, COUNT(*) as \`No of Patients\`, SUM(r.reg_charges) as \`Total Fee Collected\`
        from registration r,doctor d
        where r.doc_id = d.doc_id
        GROUP BY Date,Doctor;`
    ,(err,result) =>{
        if(err){
            return res.json({ message : "Error"})
        }
        return res.json(result);
    }
    )
})

router.get("/deptTestDocFees",(req,res) => {
    db.query(
        `select DATE_FORMAT(td.created_at,'%e %b %y') as \`Test Date\`,tc.test_category_name as \`Test Department\`,t.test_name as \`Test Name\`,d.name as Doctor,SUM(t.test_charge) as \`Total Fee Collected\`
        from test_detail td,test t,test_category as tc,doctor d 
        where td.test_id = t.test_id
        and t.test_category_id = tc.test_category_id
        and td.doc_id = d.doc_id
        GROUP BY \`Test Date\`,\`Test Department\`,\`Test Name\`,Doctor;`
        ,(err,result) =>{
            if(err){
                return res.json({ message : "Error"})
            }
            return res.json(result);
        }
    )
})

router.get("/deptDocFees",(req,res) => {
    db.query(
        `select DATE_FORMAT(td.created_at,'%e %b %y') as \`Test Date\`,tc.test_category_name as \`Test Department\`,d.name as Doctor,SUM(t.test_charge) as \`Total Fee Collected\`
        from test_detail td,test t,test_category as tc,doctor d 
        where td.test_id = t.test_id
        and t.test_category_id = tc.test_category_id
        and td.doc_id = d.doc_id
        GROUP BY \`Test Date\`,\`Test Department\`,Doctor;`
        ,(err,result) =>{
            if(err){
                return res.json({ message : "Error"})
            }
            return res.json(result);
        }
    )
})

router.get("/referralDoc",(req,res) => {
    db.query(
        ` select Month,Doctor,\`Test Fees\`,\`Registration Fees\`,\`Total Fees\` from v_referralDoc;`
        ,(err,result) =>{
            if(err){
                return res.json({ message : "Error"})
            }
            return res.json(result);
        }
    )
})
module.exports = router;