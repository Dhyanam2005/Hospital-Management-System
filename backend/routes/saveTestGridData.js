const express = require("express");
const router = express.Router();
const db = require("../config/db");
const { authenticateJWT } = require("./authenticateJWT");

router.post("/saveTestGridData", authenticateJWT, async (req, res) => {
  const { regId, rows } = req.body;
  console.log(regId);
  console.log(rows);
  if (!regId || !Array.isArray(rows) || rows.length === 0) {
    return res.status(400).json({ message: "Invalid input data" });
  }
  try {
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      if (
        !row.doctor ||
        !row.doctor.doc_id ||
        !row.test ||
        !row.test.test_id ||
        !row.testDate
      ) {
        return res.status(400).json({ message: `Missing data in row ${i}` });
      }
      const doctorId = row.doctor.doc_id;
      const testId = row.test.test_id;
      const testDate = row.testDate;

      await new Promise((resolve, reject) => {
        db.query(
          "INSERT INTO test_detail (reg_id, doc_id, test_id, test_date) VALUES (?, ?, ?, ?)",
          [regId, doctorId, testId, testDate],
          (err) => {
            if (err) return reject(err);
            resolve();
          }
        );
      });
    }
    res.json({ message: "Data inserted successfully" });
  } catch (err) {
    res.status(500).json({ message: "Database error" });
  }
});

module.exports = router;
