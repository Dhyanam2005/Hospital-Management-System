const express = require('express');
const db = require("../config/db");
const router = express.Router();

router.get("/resultData", (req, res) => {
    const { regId } = req.query;
    const val = 'R';

    db.query(
        `SELECT td.test_detail_id,
       Date_format(td.test_date, '%e %M %Y') test_date,
       t.test_name,
       tc.test_category_name,
       t.result_type,
       td.result_char,
       td.result_num,
       CASE
         WHEN t.result_type = ? THEN Concat(t.reference_range_from, '-',
                                       t.reference_range_to)
         WHEN t.result_type = ? THEN Concat('<', t.reference_value)
         WHEN t.result_type = ? THEN Concat('>', t.reference_value)
         WHEN t.result_type = ? THEN 'NA'
       END                                   AS reference_result
FROM   test_detail td
       JOIN test t
         ON td.test_id = t.test_id
       JOIN test_category tc
         ON t.test_category_id = tc.test_category_id
WHERE  td.reg_id = ?`,
        ["R","L","G","P", regId],
        (err, result) => {
            if (err) {
                return res.json({ message: "Selection from database not valid" });
            }
            return res.json(result);
        }
    );
});



module.exports = router;
