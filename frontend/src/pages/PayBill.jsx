import React, { useEffect, useState } from "react";
import styles from "./PayBill.module.css";

function PayBill({ regId }) {
    const [billInfo, setBillInfo] = useState({});
    const [discount, setDiscount] = useState('');
    const [paymentMode, setPaymentMode] = useState('');
    const [paymentDetail, setPaymentDetail] = useState('');
    const [paymentDate, setPaymentDate] = useState('');
    const [paymentData, setPaymentData] = useState(null);

    useEffect(() => {
        const fetchBillInfo = async () => {
            try {
                let res = await fetch(`http://localhost:3000/payBill?regId=${regId}`);
                let data = await res.json();
                if (res.ok) {
                    if (data.PAYMENT_ID) {
                        setPaymentData(data);
                    } else {
                        setBillInfo(data);
                    }
                }
            } catch (err) {
                console.error("Error fetching bill info:", err);
            }
        };
        fetchBillInfo();
    }, [regId]);

    const totalCharges =
        (Number(billInfo.reg_charges) || Number(paymentData?.REGN_CHARGES) || 0) +
        (Number(billInfo.admission_charges) || Number(paymentData?.ADMISSION_CHARGES) || 0) +
        (Number(billInfo.test_charges) || Number(paymentData?.TEST_FEE) || 0) +
        (Number(billInfo.medical_charges) || Number(paymentData?.DOC_FEE) || 0) +
        (Number(billInfo.services_charges) || Number(paymentData?.SERVICE_CHARGES) || 0) +
        (Number(billInfo.consultation_charges) || 0) +
        (Number(billInfo.ward_charges) || Number(paymentData?.WARD_CHARGES) || 0);

    const totalPayable = totalCharges - (Number(discount) || Number(paymentData?.DISCOUNT) || 0);

    const saveInfo = async () => {
        try {
            let res = await fetch(`http://localhost:3000/payBill?regId=${regId}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    billInfo,
                    discount,
                    paymentMode,
                    paymentDetail,
                    paymentDate,
                }),
            });
            let data = await res.json();
            if (res.ok) {
                alert("Data saved successfully");
                setPaymentData(data);
            } else {
                alert("Data not saved");
            }
        } catch (err) {
            console.error("Error during save:", err);
        }
    };

    return (
        <div>
            <form>
                <div className={styles["form-group"]}>
                    <div className={styles["indiv-inp"]}><label>Registration Charges</label><input type="text" value={paymentData?.REGN_CHARGES || billInfo.reg_charges || ''} readOnly /></div>
                    <div className={styles["indiv-inp"]}><label>Admission Charges</label><input type="text" value={paymentData?.ADMISSION_CHARGES || billInfo.admission_charges || ''} readOnly /></div>
                    <div className={styles["indiv-inp"]}><label>Test Charges</label><input type="text" value={paymentData?.TEST_FEE || billInfo.test_charges || ''} readOnly /></div>
                    <div className={styles["indiv-inp"]}><label>Service Charges</label><input type="text" value={paymentData?.SERVICE_CHARGES || billInfo.services_charges || ''} readOnly /></div>

                </div>
                <div className={styles["form-group"]}>
                    <div className={styles["indiv-inp"]}><label>Consultation Charges</label><input type="text" value={billInfo.consultation_charges || ''} readOnly /></div>
                    <div className={styles["indiv-inp"]}><label>Medical Charges</label><input type="text" value={paymentData?.DOC_FEE || billInfo.medical_charges || ''} readOnly /></div>
                    <div className={styles["indiv-inp"]}><label>Ward Charges</label><input type="text" value={paymentData?.WARD_CHARGES || billInfo.ward_charges || ''} readOnly /></div>
                    <div className={styles["indiv-inp"]}><label>Total Charges</label><input type="text" value={totalCharges} readOnly /></div>
                </div>
                <div className={styles["form-group"]}>
                    <div className={styles["indiv-inp"]}><label>Discount</label><input type="text" placeholder="Enter discount" value={paymentData?.DISCOUNT || discount} onChange={(e) => setDiscount(e.target.value)} readOnly={!!paymentData} /></div>
                    <div className={styles["indiv-inp"]}><label>Total Payable</label><input type="text" value={paymentData?.AMT_TO_PAY || totalPayable} readOnly /></div>
                </div>
                <div className={styles["form-group"]}>
                </div>
                <div className={styles["form-group"]}>
                    <div className={styles["indiv-inp-select"]}>
                        <label>Mode of Payment</label>
                        <select value={paymentData?.PAYMENT_MODE || paymentMode} onChange={(e) => setPaymentMode(e.target.value) } disabled={!!paymentData}>
                            <option value="" disabled>Select Mode of Payment</option>
                            <option value="cash">Cash</option>
                            <option value="cheque">Cheque</option>
                            <option value="card">Card</option>
                        </select>
                    </div>
                    <div className={styles["indiv-inp"]}><label>Payment Detail</label><input type="text" value={paymentData?.PAYMENT_DETAIL || paymentDetail} onChange={(e) => setPaymentDetail(e.target.value)} readOnly={!!paymentData} /></div>
                    <div className={styles["indiv-inp"]}><label>Payment Date</label><input type="date" value={paymentData?.PAYMENT_DATE ? new Date(paymentData.PAYMENT_DATE).toISOString().split('T')[0] : paymentDate} onChange={(e) => setPaymentDate(e.target.value)} readOnly={!!paymentData} /></div>
                </div>
                {!paymentData && 
                    <div className={styles["buttons"]}>
                        <button onClick={saveInfo} className={styles["save-btn"]}>Save</button>
                    </div>
                }
            </form>
        </div>
    );
}

export default PayBill;
