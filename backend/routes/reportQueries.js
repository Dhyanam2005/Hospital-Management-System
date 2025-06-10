const express = require('express')
const router = express.Router();
const db = require('../config/db');
const { format } = require("date-fns");

router.get("/patientReportStateWise",(req,res) => {
    console.log(req.query);
    const {startDate , endDate } = req.query;
    const startDateFormatted = format(new Date(startDate), "yyyy-MM-dd") + " 00:00:00";
    const endDateFormatted = format(new Date(endDate), "yyyy-MM-dd") + " 23:59:59";
    console.log("Start Date is ",startDateFormatted);
    console.log("End date is ",endDateFormatted);
    db.query(
        `SELECT DATE_FORMAT(p.created_at, '%d-%m-%Y') as Date,s.state_name as State,c.city_name as City,COUNT(*) as \`No of Patients\`
        from city c , state s , patient p
        where p.city_id = c.city_id
        and s.state_id = c.state_id
        and p.created_at >= ? and p.created_at <= ?
        GROUP BY Date ,State ,City;
`,[startDateFormatted,endDateFormatted],(err,result) => {
    if(err){
        console.error(err);
        return res.json({ message : "Error in getting patient state info"})
    }
    return res.json(result);
}
    )
})

router.get("/doctorWiseRegistrationFees",(req,res) => {
    const {startDate , endDate } = req.query;
    const startDateFormatted = format(new Date(startDate), "yyyy-MM-dd") + " 00:00:00";
    const endDateFormatted = format(new Date(endDate), "yyyy-MM-dd") + " 23:59:59";
    console.log(startDateFormatted);
    console.log(endDateFormatted);
    db.query(
        `select DATE_FORMAT(r.reg_date, '%d-%m-%Y') as Date,d.name as Doctor, COUNT(*) as \`No of Patients\`, SUM(r.reg_charges) as \`Total Fee Collected\`
        from registration r,doctor d
        where r.doc_id = d.doc_id
        and r.reg_date between ? and ?
        GROUP BY Date,Doctor;`
    ,[startDateFormatted,endDateFormatted],(err,result) =>{
        if(err){
            console.error("Error is ",err)
            return res.json({ message : "Error"})
        }
        return res.json(result);
    }
    )
})

router.get("/deptTestDocFees",(req,res) => {
    const {startDate , endDate } = req.query;
    const startDateFormatted = format(new Date(startDate), "yyyy-MM-dd") + " 00:00:00";
    const endDateFormatted = format(new Date(endDate), "yyyy-MM-dd") + " 23:59:59";
    console.log(startDateFormatted);
    console.log(endDateFormatted);
    db.query(
        `select DATE_FORMAT(td.test_date,'%d-%m-%Y') as \`Test Date\`,tc.test_category_name as \`Test Department\`,t.test_name as \`Test Name\`,d.name as Doctor,SUM(t.test_charge) as \`Total Fee Collected\`
        from test_detail td,test t,test_category as tc,doctor d 
        where td.test_id = t.test_id
        and t.test_category_id = tc.test_category_id
        and td.doc_id = d.doc_id
        and td.test_date between ? and ?
        GROUP BY \`Test Date\`,\`Test Department\`,\`Test Name\`,Doctor;`
        ,[startDateFormatted,endDateFormatted],(err,result) =>{
            if(err){
                return res.json({ message : "Error"})
            }
            return res.json(result);
        }
    )
})

router.get("/deptDocFees",(req,res) => {
    const {startDate , endDate } = req.query;
    const startDateFormatted = format(new Date(startDate), "yyyy-MM-dd") + " 00:00:00";
    const endDateFormatted = format(new Date(endDate), "yyyy-MM-dd") + " 23:59:59";
    console.log(startDateFormatted);
    console.log(endDateFormatted);
    db.query(
        `select DATE_FORMAT(td.test_date,'%d-%m-%Y') as \`Test Date\`,tc.test_category_name as \`Test Department\`,d.name as Doctor,SUM(t.test_charge) as \`Total Fee Collected\`
        from test_detail td,test t,test_category as tc,doctor d 
        where td.test_id = t.test_id
        and t.test_category_id = tc.test_category_id
        and td.doc_id = d.doc_id
        and td.test_date between ? and ?
        GROUP BY \`Test Date\`,\`Test Department\`,Doctor;`
        ,[startDateFormatted,endDateFormatted],(err,result) =>{
            if(err){
                return res.json({ message : "Error"})
            }
            return res.json(result);
        }
    )
})

router.get("/referralDoc",(req,res) => {
    const {startDate , endDate } = req.query;
    const startDateFormatted = format(new Date(startDate), "yyyy-MM-dd") + " 00:00:00";
    const endDateFormatted = format(new Date(endDate), "yyyy-MM-dd") + " 23:59:59";
    console.log(startDateFormatted);
    console.log(endDateFormatted);
    db.query(
        ` SELECT DATE_FORMAT(STR_TO_DATE(Month, '%e %b %Y'), '%d-%m-%Y') AS Date,
        Month,
       Doctor,
       \`Test Fees\`,
       \`Registration Fees\`,
       \`Total Fees\`
FROM v_referralDoc
WHERE STR_TO_DATE(Month, '%e %M %Y') BETWEEN ? AND ?;
`,[startDateFormatted,endDateFormatted]
        ,(err,result) =>{
            if(err){
                console.error("Error is ",err);
                return res.json({ message : "Error"})
            }
            return res.json(result);
        }
    )
})
module.exports = router;