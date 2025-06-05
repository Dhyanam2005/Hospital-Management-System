const express = require('express');
const jwt = require('jsonwebtoken');
const router = express.Router();
const db = require("../config/db");
const { insertIntoAuditLog }= require("./auditLog");
const { use } = require('react');

function authenticateJWT(req, res, next) {
    const token = req.header('Authorization')?.split(' ')[1];
    if (!token) {
        console.log("No token")
        return res.status(401).json({ message: 'Access Denied: No token provided' });
    }

    jwt.verify(token, "your-secret-key", (err, user) => {
        if (err) return res.status(403).json({ message: 'Access Denied: Invalid token' });
        req.user = user;
        next();
    });
}

router.get("/fetchServices",(req,res) => {
    db.query(
        `SELECT * from service`,(err,result) => {
            if(err) return res.json({ message : "Error"});
            return res.json(result); 
        }
    )
})

router.get("/fetchPatientCharges",(req,res) => {
    let { regId } = req.query;
    db.query(
        `SELECT s.service_name,p.service_id,DATE_FORMAT(p.service_date, '%Y-%m-%d') as service_date,p.service_amt,p.reg_id,p.doc_id,d.name,"No" as update_flag,p.charge_id
        from service s,patient_charge p,doctor d
        where s.service_id = p.service_id
        and p.doc_id = d.doc_id
        and reg_id =?`,[regId],(err,result) => {
        if(err){
            return res.json({ message : "Error in fetching medicalItemss "});
        }
        res.json(result);
    }
    )
})

router.post("/patientCharges",authenticateJWT, async (req, res) => {
  try {
    let { regId, patientCharges } = req.body;
    const invalidItems = patientCharges.filter(c => !c.service_id || !c.service_amt || !c.service_date || !c.doc_id);
    if (invalidItems.length > 0) {
      return res.status(400).json({ message: "Mandatory fields missing" });
    }
    console.log(patientCharges);
    const updates = patientCharges.filter(c => c.update_flag != "No" && c.charge_id);
    console.log("Updates is ",updates);
    const updatedPromises = updates.map(c => {
      return new Promise((resolve, reject) => {
        db.query(`SELECT * FROM patient_charge WHERE charge_id = ?`, [c.charge_id], (err, rows) => {
        console.log("Rows is" ,rows);
        console.log(c.charge_id , "Charge ID")
          if (err || !rows.length) return reject(err || new Error("Old data not found"));
          console.log("Rows is" ,rows)
          const oldData = rows[0];
          const query = `UPDATE patient_charge SET service_id = ?, service_date = ?, service_amt = ?, reg_id = ?, doc_id = ? WHERE charge_id = ?`;
          db.query(query, [c.service_id, c.service_date, c.service_amt, regId, c.doc_id, c.charge_id], (err, result) => {
            if (err) return reject(err);

            const newData = {
              service_id: c.service_id,
              service_date: c.service_date,
              service_amt: c.service_amt,
              reg_id: regId,
              doc_id: c.doc_id
            };

            const changedFields = {};
            for (let key in newData) {
              let newVal = newData[key]?.toString();
              let oldVal = oldData[key.toUpperCase()]?.toString();
              if (key.includes("date")) {
                const formatDate = d => new Date(d).toISOString().split("T")[0];
                newVal = formatDate(newVal);
                oldVal = formatDate(oldVal);
              }
              if (newVal !== oldVal) changedFields[key] = newVal;
            }

            if (Object.keys(changedFields).length > 0) {
              insertIntoAuditLog(db, {
                user_id: req.user?.id || null,
                action: "UPDATE",
                table_name: "patient_charge",
                record_id: c.charge_id,
                old_data: oldData,
                new_data: changedFields
              }, logErr => {
                if (logErr) console.error("Audit log error:", logErr);
                resolve();
              });
            } else {
              resolve();
            }
          });
        });
      });
    });

    const newRows = patientCharges.filter(c => !c.charge_id);
    console.log("New rows are",newRows);
    const newPromises = newRows.map(c => {
      return new Promise((resolve, reject) => {
        db.query(
          `INSERT INTO patient_charge (service_id, service_date, service_amt, reg_id, doc_id) VALUES (?, ?, ?, ?, ?)`,
          [c.service_id, c.service_date, c.service_amt, regId, c.doc_id],
          (err, result) => {
            if (err) return reject(err);
            insertIntoAuditLog(db, {
              user_id: req.user?.id || null,
              action: "INSERT",
              table_name: "patient_charge",
              record_id: result.insertId,
              old_data: null,
              new_data: {
                service_id: c.service_id,
                service_date: c.service_date,
                service_amt: c.service_amt,
                reg_id: regId,
                doc_id: c.doc_id
              }
            }, logErr => {
              if (logErr) console.error("Audit log error:", logErr);
              resolve();
            });
          }
        );
      });
    });

    await Promise.all([...updatedPromises, ...newPromises]);
    res.json({ message: "All data saved successfully" });
  } catch (err) {
    console.error("Error is ", err);
    res.json({ message: "Error in posting info" });
  }
});


router.delete("/patientcharge/:id",authenticateJWT, (req, res) => {
  let id = req.params.id;
  if (!id) {
    return res.status(400).json({ message: "ID is required" });
  }

  const selectQuery = `SELECT * FROM patient_charge WHERE charge_id = ?`;
  db.query(selectQuery, [id], (err, rows) => {
    if (err || rows.length === 0) {
      return res.status(500).json({ message: "Error fetching row before deletion" });
    }

    const oldData = rows[0];
    db.query(`DELETE FROM patient_charge WHERE charge_id = ?`, [id], (err, result) => {
      if (err) {
        return res.status(500).json({ message: "Error in deletion of old row" });
      }

      insertIntoAuditLog(db, {
        user_id: req.user?.id || null,
        action: "DELETE",
        table_name: "patient_charge",
        record_id: id,
        old_data: oldData,
        new_data: null
      }, logErr => {
        if (logErr) console.error("Audit log error:", logErr);
        return res.json(result);
      });
    });
  });
});

module.exports = router;


