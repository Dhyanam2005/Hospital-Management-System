const express = require('express');
const router = express.Router();
const db = require("../config/db");

router.get("/lab-test-master",(req,res) => {
    db.query(
        `select tc.test_category_name,t.test_name,t.specimen_type,t.result_type,t.reference_value,concat(t.reference_range_from,'-',t.reference_range_to) as reference_range,t.test_unit,t.test_charge,t.test_long_name
        from test t,test_category tc
        where t.test_category_id = tc.test_category_id;`,(err,result) => {
            if(err) return res.json({ message : "Error fetching data from lab-test-master"});
            res.json(result);
        }
    )
})

router.get("/location-master",(req,res) => {
    db.query(
        `select c.country_name , s.state_name ,cy.city_name
        from country c,state s,city cy
        where c.country_id = s.country_id
        and s.state_id = cy.state_id
        ORDER BY c.country_name , s.state_name ,cy.city_name;
`,(err,result) => {
            if(err) return res.json({ message : "Error fetching data from location-master"});
            res.json(result);
        }
    )
})

router.get("/pharmacy-item-master",(req,res) => {
    db.query(
        `select * from drug_master`,(err,result) => {
            if(err) return res.json({ message : "Error fetching data from pharmacy-item-master"});
            res.json(result);
        }
    )
})

router.get("/facility-master",(req,res) => {
    db.query(
        `select w.ward_name,r.room_number,b.bed_number,w.ward_charges
from ward w,ward_room r,ward_room_bed b
where b.ward_room_id = r.ward_room_id
and r.ward_id = w.ward_id
`,(err,result) => {
            if(err) return res.json({ message : "Error fetching data from pharmacy-item-master"});
            res.json(result);
        }
    )
})

router.get("/audit-master",(req,res) => {
    db.query(`SELECT * from audit_log`,(err,result) => {
        if(err) return res.json({ messgae : "Error fetching info form audit log"});
        res.json(result);
    })
})

router.get("/daily-earnings",(req,res) => {
    db.query(`SELECT 
    PAYMENT_DATE, 
    SUM(AMT_TO_PAY) AS total_amount 
FROM 
    payment 
GROUP BY 
    PAYMENT_DATE 
ORDER BY 
    PAYMENT_DATE;`,(err,result) => {
        if(err) return res.json({ messgae : "Error fetching info form audit log"});
        res.json(result);
    })
})

module.exports = router;