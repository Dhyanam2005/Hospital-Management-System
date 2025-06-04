const express = require('express');
const router = express.Router();
const db = require("../config/db");

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

router.post("/payBill", (req, res) => {
    const { regId } = req.query;
    const { billInfo, discount, paymentMode, paymentDetail, paymentDate } = req.body;

    const totalPayable = Number(billInfo.total_payable) || 0;
    const discountAmount = Number(discount) || 0;
    const amountToPay = totalPayable - discountAmount;

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
        regId,
    ];

    db.query(query, params, (err, result) => {
        if (err) {
            console.error("Payment insert error:", err);
            return res.status(500).json({ message: "Error during payment update" });
        }
        res.json({ message: "Payment recorded successfully" });
    });
});

module.exports = router;
