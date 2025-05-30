const express = require("express");
const router = express.Router();
const util = require("util");
const db = require("../config/db");

router.post("/saveTestGridData", async (req, res) => {
  console.log("Started saveTestGridData");
  const { regId, rows , testDate } = req.body;

  if (!regId || !Array.isArray(rows) || rows.length === 0) {
    return res.status(400).json({ message: "Invalid input data" });
  }

  const query = util.promisify(db.query).bind(db);

  try {
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      console.error("Row ",i ," has ",row);
      const doctorId = row.doctor.doc_id;
      const testId = row.test.test_id;

      if (!doctorId || !testId) {
        return res.status(400).json({ message: "Missing doctor_id or test_id in row data" });
      }

      await query(
        'INSERT INTO test_detail (reg_id, doc_id, test_id , test_date) VALUES (?, ?, ? ,?)',
        [regId, doctorId, testId,testDate]
      );
    }

    res.json({ message: "Data inserted successfully" });
  } catch (err) {
    console.error("DB insertion error:", err.message);
    res.status(500).json({ message: "Error inserting data into database" });
  }
});

module.exports = router;