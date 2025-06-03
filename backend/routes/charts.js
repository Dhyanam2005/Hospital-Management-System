const express = require('express');
const db = require("../config/db");
const router = express.Router();

router.get("/firstChart",(req,res) => {
    db.query(
        `SELECT t.test_name, COUNT(td.test_id) AS count
         FROM test_detail td , test t
         where td.test_id = t.test_id
        GROUP BY td.test_id,t.test_name
        ORDER BY count DESC
        LIMIT 5;`,(err,result) => {
            if(err) return res.json({ message : "Error in fetching first chart details"});
            res.json(result);
        }
    )
})

router.get("/secondChart",(req,res) => {
    db.query(
        `SELECT t.test_name, SUM(t.test_charge) AS sum
         FROM test_detail td , test t
         where td.test_id = t.test_id
        GROUP BY td.test_id,t.test_name
        ORDER BY sum DESC
        LIMIT 5;`,(err,result) => {
            if(err) return res.json({ message : "Error in fetching second chart details"});
            res.json(result);
        }
    )
})

router.get("/thirdChart",(req,res) => {
    db.query(
        `select d.drug_name , sum(m.item_value) as sum
        from medical_item m,drug_master d
        where m.drug_id = d.drug_id
        GROUP BY d.drug_name
        ORDER BY SUM desc
        LIMIT 5;`,(err,result) => {
            if(err) return res.json({ message : "Error in fetching third chart details"});
            res.json(result);
        }
    )
})

router.get("/fourthChart",(req,res) => {
    db.query(
        `SELECT 
    d.name AS DoctorName,
    COALESCE(dc.total_doc_fee, 0) +
    COALESCE(pc.total_service_amt, 0) +
    COALESCE(tt.total_test_charge, 0) AS total_fee
FROM doctor d
LEFT JOIN (
    SELECT doc_id, SUM(doc_fee) AS total_doc_fee
    FROM doc_consultation
    GROUP BY doc_id
) AS dc ON d.doc_id = dc.doc_id
LEFT JOIN (
    SELECT doc_id, SUM(service_amt) AS total_service_amt
    FROM patient_charge
    GROUP BY doc_id
) AS pc ON d.doc_id = pc.doc_id
LEFT JOIN (
    SELECT td.doc_id, SUM(t.test_charge) AS total_test_charge
    FROM test_detail td
    JOIN test t ON td.test_id = t.test_id
    GROUP BY td.doc_id
) AS tt ON d.doc_id = tt.doc_id
ORDER BY total_fee DESC
LIMIT 5;
`,(err,result) => {
            if(err) return res.json({ message : "Error in fetching third chart details"});
            res.json(result);
        }
    )
})

router.get("/fifthChart",(req,res) => {
    db.query(
        `select case
when sex = "M" then "Male"
else "Female"
end
as sex,count(*)
as s_count 
from patient
GROUP By sex;`,(err,result) => {
            if(err) return res.json({ message : "Error in fetching third chart details"});
            res.json(result);
        }
    )
})
module.exports = router;