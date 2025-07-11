import React, { useEffect, useState } from "react";
import styles from "./PayBill.module.css";
import API_BASE_URL from '../apiConfig';

function PayBill({ regId }) {
    const [billInfo, setBillInfo] = useState({});
    const [discount, setDiscount] = useState('');
    const [paymentMode, setPaymentMode] = useState('');
    const [paymentDetail, setPaymentDetail] = useState('');
    const [paymentDate, setPaymentDate] = useState('');
    const [paymentData, setPaymentData] = useState(null);
    const [regStatus , setRegStatus] = useState('');

    useEffect(() => {
        const fetchBillInfo = async () => {
            setDiscount("");
            setPaymentMode("");
            setPaymentDetail("");
            setPaymentDate("");
            setBillInfo("");
            setPaymentData("");
            try {
                let res = await fetch(`${API_BASE_URL}/payBill?regId=${regId}`);
                const regStatusRes = await fetch(`${API_BASE_URL}/regStatus?regId=${regId}`);
                const regData = await regStatusRes.json();
                let data = await res.json();
                if (res.ok && regStatusRes.ok) {
                    if (data.PAYMENT_ID) {
                        setPaymentData(data);
                    } else {
                        setBillInfo(data);
                    }
                    setRegStatus(regData[0].reg_status);
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
        const token = localStorage.getItem('token');
        try {
            let res = await fetch(`${API_BASE_URL}/payBill?regId=${regId}`, {
                method: "POST",
                headers: { 
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`,
                },
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

    const handleRazorpayPayment = async () => {
    const token = localStorage.getItem("token");
    try {
        const res = await fetch(`${API_BASE_URL}/create-order`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
            amount: totalPayable,
            regId
        }),
        });

        const data = await res.json();

        const options = {
        key: "rzp_test_PBlcUpzwMmjAq5",
        amount: data.order.amount,
        currency: "INR",
        name: "HMS Payment",
        description: "Patient Bill Payment",
        order_id: data.order.id,
        handler: async function (response) {
            alert("Payment Success: " + response.razorpay_payment_id);

            const payRes = await fetch(`${API_BASE_URL}/verify`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
                razorpay_payment_id : response.razorpay_payment_id
            }),
            });
            const data = await payRes.json()
            if (payRes.ok) {
                console.log(data)
                if(data.card){
                    setPaymentDetail("Entity:"+data.card.entity +"Last4:(" +data.card.last4 + ") CardID:" + data.card.id + " Order_ID:"+data.order_id);
                }else if(data.bank){
                    setPaymentDetail("Bank:"+data.bank +"Bank_Ref_No: "+ data.acquirer_data.bank_transaction_id + " Order_ID:"+data.order_id);
                }else if(data.wallet){
                    setPaymentDetail("Wallet:"+data.wallet + " Order_ID:"+data.order_id)
                }else if(data.vpa){
                    setPaymentDetail("VPA:"+data.vpa + " Order_ID:"+data.order_id)
                }
            }
        },
        prefill: {
            name: "Patient",
            email: "email@example.com",
            contact: "9999999999"
        },
        theme: {
            color: "#1976d2"
        }
        };

        const rzp = new window.Razorpay(options);
        rzp.open();
    } catch (err) {
        console.log("Error:", err);
        alert("Failed to start Razorpay");
    }
    };


    return (
        <div>
            <form>
                <div className={styles["form-group"]}>
                    <div   className={`
    ${styles["indiv-inp"]}
    ${paymentData
      ? 'bg-gray-100 text-gray-500 border-dashed cursor-not-allowed'
      : 'bg-white text-black border-solid'}
  `}><label>Registration Charges</label><input type="text" value={paymentData?.REGN_CHARGES || billInfo.reg_charges || ''} readOnly /></div>
                    <div   className={`
    ${styles["indiv-inp"]}
    ${paymentData
      ? 'bg-gray-100 text-gray-500 border-dashed cursor-not-allowed'
      : 'bg-white text-black border-solid'}
  `}><label>Admission Charges</label><input type="text" value={paymentData?.ADMISSION_CHARGES || billInfo.admission_charges || ''} readOnly /></div>
                    <div   className={`
    ${styles["indiv-inp"]}
    ${paymentData
      ? 'bg-gray-100 text-gray-500 border-dashed cursor-not-allowed'
      : 'bg-white text-black border-solid'}
  `}><label>Test Charges</label><input type="text" value={paymentData?.TEST_FEE || billInfo.test_charges || ''} readOnly /></div>
                    <div   className={`
    ${styles["indiv-inp"]}
    ${paymentData
      ? 'bg-gray-100 text-gray-500 border-dashed cursor-not-allowed'
      : 'bg-white text-black border-solid'}
  `}><label>Service Charges</label><input type="text" value={paymentData?.SERVICE_CHARGES || billInfo.services_charges || ''} readOnly /></div>

                </div>
                <div className={styles["form-group"]}>
                    <div   className={`
    ${styles["indiv-inp"]}
    ${paymentData
      ? 'bg-gray-100 text-gray-500 border-dashed cursor-not-allowed'
      : 'bg-white text-black border-solid'}
  `}><label>Consultation Charges</label><input type="text" value={billInfo.consultation_charges || ''} readOnly /></div>
                    <div   className={`
    ${styles["indiv-inp"]}
    ${paymentData
      ? 'bg-gray-100 text-gray-500 border-dashed cursor-not-allowed'
      : 'bg-white text-black border-solid'}
  `}><label>Medical Charges</label><input type="text" value={paymentData?.DOC_FEE || billInfo.medical_charges || ''} readOnly /></div>
                    <div   className={`
    ${styles["indiv-inp"]}
    ${paymentData
      ? 'bg-gray-100 text-gray-500 border-dashed cursor-not-allowed'
      : 'bg-white text-black border-solid'}
  `}><label>Ward Charges</label><input type="text" value={paymentData?.WARD_CHARGES || billInfo.ward_charges || ''} readOnly /></div>
                    <div   className={`
    ${styles["indiv-inp"]}
    ${paymentData
      ? 'bg-gray-100 text-gray-500 border-dashed cursor-not-allowed'
      : 'bg-white text-black border-solid'}
  `}><label>Total Charges</label><input disabled={regStatus === 'D'} type="text" value={totalCharges} readOnly /></div>
                </div>
                <div className={styles["form-group"]}>
                    <div   className={`
    ${styles["indiv-inp"]}
    ${paymentData
      ? 'bg-gray-100 text-gray-500 border-dashed cursor-not-allowed'
      : 'bg-white text-black border-solid'}
  `}><label>Discount</label><input disabled={regStatus === 'D'} type="text" placeholder="Enter discount" value={paymentData?.DISCOUNT || discount} onChange={(e) => setDiscount(e.target.value)} readOnly={!!paymentData} /></div>
                    <div   className={`
    ${styles["indiv-inp"]}
    ${paymentData
      ? 'bg-gray-100 text-gray-500 border-dashed cursor-not-allowed'
      : 'bg-white text-black border-solid'}
  `}><label>Total Payable</label><input type="text" value={paymentData?.AMT_TO_PAY || totalPayable} readOnly /></div>
                </div>
                <div className={styles["form-group"]}>
                </div>
                <div className={styles["form-group"]}>
                    <div className={styles["indiv-inp-select"]}>
                        <label>Mode of Payment</label>
                        <select value={paymentData?.PAYMENT_MODE || paymentMode} onChange={(e) => setPaymentMode(e.target.value) } disabled={!!paymentData || regStatus === 'D'}>
                            <option value="" disabled>Select Mode of Payment</option>
                            <option value="cash">Cash</option>
                            <option value="cheque">Cheque</option>
                            <option value="card">Card</option>
                        </select>
                    </div>
                    <div   className={`
    ${styles["indiv-inp"]}
    ${paymentData
      ? 'bg-gray-100 text-gray-500 border-dashed cursor-not-allowed w-1/3 h-32 p-2 border rounded'
      : 'bg-white text-black border-solid w-1/3 h-32 p-2 border rounded'}
  `}><label>Payment Detail</label><textarea disabled={regStatus === 'D'} type="text" value={paymentData?.PAYMENT_DETAIL || paymentDetail} onChange={(e) => setPaymentDetail(e.target.value)} readOnly={!!paymentData} /></div>
                    <div   className={`
    ${styles["indiv-inp"]}
    ${paymentData
      ? 'bg-gray-100 text-gray-500 border-dashed cursor-not-allowed'
      : 'bg-white text-black border-solid'}
  `}><label>Payment Date</label><input disabled={regStatus === 'D'} type="date" value={paymentData?.PAYMENT_DATE ? new Date(paymentData.PAYMENT_DATE).toISOString().split('T')[0] : paymentDate} onChange={(e) => setPaymentDate(e.target.value)} readOnly={!!paymentData} /></div>
                </div>
                {!paymentData && regStatus !== "D" &&
                    <div className={styles["buttons"]}>
                        <button type="button" onClick={saveInfo} className={styles["save-btn"]}>Save</button>
                        <br />
                        {paymentMode == "card" && (
                            <button type="button" onClick={handleRazorpayPayment} className={`${styles["save-btn"]} bg-green-600 hover:bg-green-700`}>Pay</button>
                        )}
                    </div>
                }

            </form>
        </div>
    );
}

export default PayBill;
