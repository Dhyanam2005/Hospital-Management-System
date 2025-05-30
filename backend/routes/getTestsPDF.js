const express = require('express')
const router = express.Router();
const db = require('../config/db');

router.get("/testpdf",(req,res) => {
    let regId = req.query; 
    // For time being im conisidering constant value
    db.query(
        `SELECT 
    t.test_name,
    CASE 
        WHEN t.result_type = 'R' THEN CONCAT(t.reference_range_from, '-', t.reference_range_to)
        WHEN t.result_type = 'G' THEN CONCAT('>', t.reference_value)
        WHEN t.result_type = 'L' THEN CONCAT('<', t.reference_value)
        ELSE 'N/A'
    END AS reference_range,
    td.result_char,
    td.result_num,
    tc.test_category_name
FROM 
    test t, test_detail td , test_category tc
WHERE 
    t.test_id = td.test_id
    AND t.test_category_id = tc.test_category_id
    AND td.reg_id = ?`,[regId]
    ,(err,result) => {
            if(err){
                return res.json({ message : "Error in getting info of patient database"});
            }
            return res.json( result );
        }
    )
})

module.exports = router;