const express = require('express');
const router = express.Router();
const db = require("../config/db");
const { insertIntoAuditLog } = require('./auditLog');
const { authenticateJWT } = require("./authenticateJWT");

router.get("/payBill", (req, res) => {
    const { regId } = req.query;

    db.query(
        `SELECT p.* FROM payment p WHERE p.reg_id = ?`,
        [regId],
        (err, result) => {
            if (err) {
                return res.status(500).json({ message: "Error fetching payment details" });
            }   
            console.log("Result after first query is ",result);
            console.log(result.length);
            if (result.length > 0) {
                return res.json(result[0]);
            } else {
                db.query(
                    `
                    SELECT v.regid,
                        v.ward_charges,
                        v.reg_charges,
                        v.admission_charges,
                        v.test_charges,
                        v.medical_charges,
                        v.services_charges,
                        v.consultation_charges,
                        v.reg_charges + v.admission_charges +
                        v.test_charges + v.medical_charges +
                        v.services_charges + v.consultation_charges +
                        v.ward_charges AS total_payable
                    FROM v_patient_bill_summary v
                    WHERE v.regid = ?
                    `,
                    [regId],
                    (err2, result2) => {
                        if (err2) {
                            return res.status(500).json({ message: "Error fetching billing summary" });
                        }
                        if (result2.length === 0) {
                            return res.status(404).json({ message: "No record found" });
                        }
                        console.log(result2[0]);
                        return res.json(result2[0]);
                    }
                );
            }
        }
    );
});

router.post("/payBill", authenticateJWT, (req, res) => {
    const { regId } = req.query;
    const { billInfo, discount, paymentMode, paymentDetail, paymentDate } = req.body;
    const userId = req.user.id;

    const totalPayable = Number(billInfo.total_payable) || 0;
    const discountAmount = Number(discount) || 0;
    const amountToPay = totalPayable - discountAmount;

    const getOldStatusQuery = "SELECT reg_status FROM registration WHERE reg_id = ?";
    db.query(getOldStatusQuery, [regId], (err, result1) => {
        if (err) {
            console.error("Error fetching old reg_status:", err);
            return res.status(500).json({ message: "Failed to fetch registration status" });
        }

        const oldStatus = result1[0]?.reg_status || null;

        const query = `
            INSERT INTO payment
            (reg_id, payment_date, regn_charges, admission_charges, doc_fee, test_fee, service_charges, ward_charges, total_payable, discount, amt_to_pay, payment_mode, payment_detail)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);

            UPDATE ward_room_bed AS w
            SET w.bed_status = "A"
            WHERE w.bed_id = (
                SELECT a.bed_id FROM admission AS a WHERE a.reg_id = ?
            );

            UPDATE registration SET reg_status = ? WHERE reg_id = ?;
        `;

        const params = [
            regId,
            paymentDate,
            Number(billInfo.reg_charges) || 0,
            Number(billInfo.admission_charges) || 0,
            Number(billInfo.consultation_charges) || 0,
            Number(billInfo.test_charges) || 0,
            Number(billInfo.services_charges) || 0,
            Number(billInfo.ward_charges) || 0,
            totalPayable,
            discountAmount,
            amountToPay,
            paymentMode,
            paymentDetail,
            regId,
            "D",
            regId
        ];

        db.query(query, params, (err2, result2) => {
            if (err2) {
                console.error("Payment insert error:", err2);
                return res.status(500).json({ message: "Error during payment update" });
            }

            insertIntoAuditLog(db, {
                user_id: userId,
                action: "UPDATE",
                table_name: "payment",
                record_id: regId,
                old_data: { reg_status: oldStatus },
                new_data: { reg_status: "D" }
            }, (err3) => {
                if (err3) {
                    console.error("Audit log insert failed:", err3);
                }
                return res.status(200).json({ message: "Payment completed and audit logged." });
            });
        });
    });
});

module.exports = router;
