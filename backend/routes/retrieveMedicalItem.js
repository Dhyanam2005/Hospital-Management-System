const express = require('express');
const jwt = require('jsonwebtoken');
const router = express.Router();
const db = require("../config/db");
const { insertIntoAuditLog } = require('./auditLog');

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

router.get("/fetchMedicines",(req,res) => {
    db.query(
        `SELECT * from drug_master`,(err,result) => {
            if(err) return res.json({ message : "Error"});
            return res.json(result); 
        }
    )
})

router.get("/fetchMedicalItems  ",(req,res) => {
    let { regId } = req.query;
    db.query(
        `select m.medical_item_id , m.drug_id,d.drug_name as medicineName , DATE_FORMAT(m.issue_date, '%Y-%m-%d') as date , m.item_qty,m.item_price,m.item_value, "No" as update_flag
        from drug_master d,medical_item m
        where d.drug_id = m.drug_id
        and reg_id = ?`,[regId],(err,result) => {
        if(err){
            return res.json({ message : "Error in fetching medicalItemss "});
        }
        res.json(result);
    }
    )
})

function formatDateToYYYYMMDD(date) {
  if (!date) return null;
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

router.post("/medicalItems",authenticateJWT, async (req,res) =>{
    try{
        let {regId , medicalItems} = req.body;
        const invalidItems = medicalItems.filter(c => 
            !c.drug_id || !c.date || !c.quantity || !c.price
        );
        if(invalidItems.length > 0){
            return res.status(400).json({ message : "Mandatory fields missing "});
        }
        const udpates = medicalItems.filter(c => c.update_flag != "No");
        const updatedPromises = udpates.map(c => {
            return new Promise((resolve,reject) => {
                db.query(`SELECT * FROM medical_item WHERE medical_item_id = ?`, [c.medical_item_id], (err, rows) => {
                    if(err) return reject(err);
                            const oldDataRaw = rows[0];
                              const oldData = {
                                    drug_id: oldDataRaw.DRUG_ID,
                                    issue_date: formatDateToYYYYMMDD(oldDataRaw.ISSUE_DATE),
                                    item_qty: String(oldDataRaw.ITEM_QTY),
                                    reg_id: oldDataRaw.REG_ID,
                                    item_price: oldDataRaw.ITEM_PRICE,
                                };

                    const newData = {
                        drug_id: c.drug_id,
                        issue_date: c.date,
                        item_qty: c.quantity,
                        reg_id: regId,
                        item_price: c.price
                    };
                    console.log(newData)
                    console.log(oldData);
                    const changedFields = {};
                    for (const key in newData) {
                        if (newData[key] != oldData[key]) {
                            changedFields[key] = newData[key];
                        }
                    }

                    db.query(`UPDATE medical_item
                            SET drug_id = ?,issue_date = ?,item_qty = ?,reg_id = ?,item_price = ?
                            WHERE medical_item_id = ?`,
                        [c.drug_id,c.date,c.quantity,regId,c.price,c.medical_item_id],(err,result) => {
                            if(err) return reject(err);
                            insertIntoAuditLog(db, {
                                user_id: req.user.id,
                                action: 'UPDATE',
                                table_name: 'medical_item',
                                record_id: c.medical_item_id,
                                old_data: oldData,
                                new_data: changedFields
                            }, () => resolve(result));
                        }
                    )
                })
            })
        })
        const newRows = medicalItems.filter(c => !c.medical_item_id);
        const newPromises = newRows.map(c => {
            return new Promise((resolve,reject) =>{
                db.query(
                    `INSERT INTO medical_item
                    (drug_id,reg_id,issue_date,item_qty,item_price,created_at)
                    VALUES (?,?,?,?,?,NOW())`,
                    [c.drug_id,regId,c.date,c.quantity,c.price],(err,result) => {
                        if(err) reject(err);
                        insertIntoAuditLog(db, {
                            user_id: req.user.id,
                            action: 'INSERT',
                            table_name: 'medical_item',
                            record_id: result.insertId,
                            old_data: null,
                            new_data: {
                                drug_id: c.drug_id,
                                issue_date: c.date,
                                item_qty: c.quantity,
                                reg_id: regId,
                                item_price: c.price
                            }
                        }, () => resolve(result));
                    }
                )
            })
        })

        await Promise.all([...updatedPromises,...newPromises]);
        res.json({ message : "All data saved successfully"});
    }catch(err){
        console.error("Error is ",err);
        res.json({ message : "Error in posting info "});
    }
})


router.delete("/docmedicalItems/:id",authenticateJWT, (req, res) => {
  const id = req.params.id;
  if (!id) {
    return res.status(400).json({ message: "ID is required" });
  }
  db.query(`SELECT * FROM medical_item WHERE medical_item_id = ?`, [id], (err, rows) => {
    if (err) return res.status(500).json({ message: "Error fetching record before deletion" });
    if (!rows.length) return res.status(404).json({ message: "Record not found" });

    const oldDataRaw = rows[0];
    db.query(
      `DELETE FROM medical_item WHERE medical_item_id = ?`,
      [id],
      (err, result) => {
        if (err) return res.status(500).json({ message: "Error deleting record" });

        insertIntoAuditLog(db, {
          user_id: req.user.id || null,
          action: "DELETE",
          table_name: "medical_item",
          record_id: id,
          old_data: oldDataRaw,
          new_data: null,
        }, (logErr) => {
          if (logErr) console.error("Audit log error:", logErr);
          res.json({ message: "Record deleted successfully" });
        });
      }
    );
  });
});

module.exports = router;


