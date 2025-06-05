const express = require('express');
const db = require("../config/db");
const router = express.Router();
const { insertIntoAuditLog } = require('./auditLog');
const { authenticateJWT } = require("./authenticateJWT");

router.post("/result", authenticateJWT, async (req, res) => {
    const { regId, results } = req.body;

    try {
        const updatePromises = results.map(result => {
            const { result_type, result_num, result_char, test_detail_id } = result;
            const val = result_char || result_num;
            if (!test_detail_id) return Promise.resolve();

            const query = result_type === "P"
                ? 'UPDATE test_detail td SET td.result_char = ? WHERE td.test_detail_id = ? AND td.reg_id = ? AND td.test_id = (SELECT t.test_id FROM test t WHERE t.test_id = td.test_id AND t.result_type = "P");'
                : 'UPDATE test_detail td SET td.result_num = ? WHERE td.test_detail_id = ? AND td.reg_id = ? AND td.test_id = (SELECT t.test_id FROM test t WHERE t.test_id = td.test_id AND t.result_type != "P");';

            return new Promise((resolve, reject) => {
                db.query(query, [val, test_detail_id, regId], (err, updateResult) => {
                    if (err) return reject(err);

                    const field = result_type === "P" ? "result_char" : "result_num";
                    const newData = {};
                    newData[field] = val;

                    insertIntoAuditLog(db, {
                        user_id: req.user.id,
                        action: "UPDATE",
                        table_name: "test_detail",
                        record_id: test_detail_id,
                        old_data: null,
                        new_data: newData
                    }, (logErr) => {
                        if (logErr) console.error("Audit log error:", logErr);
                        resolve(updateResult);
                    });
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
