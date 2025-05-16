const express = require('express');
const db = require("../config/db");
const router = express.Router();

router.get("/resultData",(req,res) => {
    db.query(
        'select td.test_detail_id , t.test_name , tc.test_category_name , t.result_type , t.reference_range_from , t.reference_range_to from test_detail td,test t,test_category tc where td.test_id = t.test_id and  t.test_category_id = tc.test_category_id',
        (err,result) => {
            if(err){
                return res.json({ message : "Selection from database not valid"});
            }
            return res.json(result);
        }
    );
})

module.exports = router;