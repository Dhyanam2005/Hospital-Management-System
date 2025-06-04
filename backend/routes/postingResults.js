const express = require('express');
const db = require("../config/db");
const router = express.Router();

router.post("/result", async (req, res) => {
    const { regId, results } = req.body;

    try {
        const updatePromises = results.map(result => {
            const { result_type, test_detail_id, result_char, result_num } = result;

            if (!test_detail_id) return Promise.resolve();

            const resultValue = result_type === "P" ? result_char : result_num;

            const query = result_type === "P"
                ? 'UPDATE test_detail td SET td.result_char = ? WHERE td.test_detail_id = ? AND td.reg_id = ? AND td.test_id = (SELECT t.test_id FROM test t WHERE t.test_id = td.test_id AND t.result_type = "P");'
                : 'UPDATE test_detail td SET td.result_num = ? WHERE td.test_detail_id = ? AND td.reg_id = ? AND td.test_id = (SELECT t.test_id FROM test t WHERE t.test_id = td.test_id AND t.result_type != "P");';

            return new Promise((resolve, reject) => {
                db.query(query, [resultValue, test_detail_id, regId], (err, result) => {
                    if (err) return reject(err);
                    resolve(result);
                });
            });
        });

        await Promise.all(updatePromises);

        res.json({ message: "All results updated successfully" });

    } catch (err) {
        res.status(500).json({ message: "Error updating results", error: err });
    }
});


module.exports = router;
