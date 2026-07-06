import React, { useEffect, useState } from "react";
import {
    Box, TextField, MenuItem, Button, Paper, Typography
} from '@mui/material';
import API_BASE_URL from '../apiConfig';
import { authFetch } from '../utils/authFetch';

function PayBill({ regId }) {
    const [billInfo, setBillInfo] = useState({});
    const [discount, setDiscount] = useState('');
    const [paymentMode, setPaymentMode] = useState('');
    const [paymentDetail, setPaymentDetail] = useState('');
    const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
    const [paymentData, setPaymentData] = useState(null);
    const [regStatus , setRegStatus] = useState('');

    useEffect(() => {
        const fetchBillInfo = async () => {
            setDiscount("");
            setPaymentMode("");
            setPaymentDetail("");
            setPaymentDate(new Date().toISOString().split('T')[0]);
            setBillInfo("");
            setPaymentData("");
            try {
                let res = await authFetch(`${API_BASE_URL}/payBill?regId=${regId}`);
                const regStatusRes = await authFetch(`${API_BASE_URL}/regStatus?regId=${regId}`);
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
        try {
            let res = await authFetch(`${API_BASE_URL}/payBill?regId=${regId}`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
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
    try {
        const res = await authFetch(`${API_BASE_URL}/create-order`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            amount: totalPayable,
            regId
        }),
        });

        const data = await res.json();

        const options = {
        key: process.env.REACT_APP_RAZORPAY_KEY_ID,
        amount: data.order.amount,
        currency: "INR",
        name: "HMS Payment",
        description: "Patient Bill Payment",
        order_id: data.order.id,
        handler: async function (response) {
            alert("Payment Success: " + response.razorpay_payment_id);

            const payRes = await authFetch(`${API_BASE_URL}/verify`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
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


    const readOnly = !!paymentData;
    const discharged = regStatus === 'D';

    const fieldSx = { flex: 1, minWidth: 180 };

    return (
        <Paper elevation={0} sx={{ p: 3, border: '1px solid #e2e8f0', borderRadius: 2 }}>
            <Box component="form" noValidate>

                {/* Row 1 — charge summary */}
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 2 }}>
                    <TextField size="small" label="Registration Charges" sx={fieldSx}
                        value={paymentData?.REGN_CHARGES || billInfo.reg_charges || ''}
                        InputProps={{ readOnly: true }} />
                    <TextField size="small" label="Admission Charges" sx={fieldSx}
                        value={paymentData?.ADMISSION_CHARGES || billInfo.admission_charges || ''}
                        InputProps={{ readOnly: true }} />
                    <TextField size="small" label="Test Charges" sx={fieldSx}
                        value={paymentData?.TEST_FEE || billInfo.test_charges || ''}
                        InputProps={{ readOnly: true }} />
                    <TextField size="small" label="Service Charges" sx={fieldSx}
                        value={paymentData?.SERVICE_CHARGES || billInfo.services_charges || ''}
                        InputProps={{ readOnly: true }} />
                </Box>

                {/* Row 2 */}
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 2 }}>
                    <TextField size="small" label="Consultation Charges" sx={fieldSx}
                        value={billInfo.consultation_charges || ''}
                        InputProps={{ readOnly: true }} />
                    <TextField size="small" label="Medical Charges" sx={fieldSx}
                        value={paymentData?.DOC_FEE || billInfo.medical_charges || ''}
                        InputProps={{ readOnly: true }} />
                    <TextField size="small" label="Ward Charges" sx={fieldSx}
                        value={paymentData?.WARD_CHARGES || billInfo.ward_charges || ''}
                        InputProps={{ readOnly: true }} />
                    <TextField size="small" label="Total Charges" sx={fieldSx}
                        value={totalCharges}
                        InputProps={{ readOnly: true }} />
                </Box>

                {/* Row 3 — discount + total payable */}
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 2 }}>
                    <TextField size="small" label="Discount" sx={fieldSx}
                        placeholder="Enter discount"
                        value={paymentData?.DISCOUNT || discount}
                        onChange={(e) => setDiscount(e.target.value)}
                        disabled={discharged}
                        InputProps={{ readOnly }} />
                    <TextField size="small" label="Total Payable" sx={fieldSx}
                        value={paymentData?.AMT_TO_PAY || totalPayable}
                        InputProps={{ readOnly: true }} />
                </Box>

                {/* Row 4 — payment details */}
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 3 }}>
                    <TextField
                        select size="small" label="Mode of Payment" sx={fieldSx}
                        value={paymentData?.PAYMENT_MODE || paymentMode}
                        onChange={(e) => setPaymentMode(e.target.value)}
                        disabled={readOnly || discharged}
                    >
                        <MenuItem value="" disabled>Select Mode of Payment</MenuItem>
                        <MenuItem value="cash">Cash</MenuItem>
                        <MenuItem value="cheque">Cheque</MenuItem>
                        <MenuItem value="card">Card</MenuItem>
                    </TextField>
                    <TextField size="small" label="Payment Detail" sx={{ flex: 2, minWidth: 240 }}
                        multiline rows={3}
                        value={paymentData?.PAYMENT_DETAIL || paymentDetail}
                        onChange={(e) => setPaymentDetail(e.target.value)}
                        disabled={discharged}
                        InputProps={{ readOnly }} />
                    <TextField size="small" label="Payment Date" sx={fieldSx}
                        type="date"
                        value={paymentData?.PAYMENT_DATE
                            ? new Date(paymentData.PAYMENT_DATE).toISOString().split('T')[0]
                            : paymentDate}
                        onChange={(e) => setPaymentDate(e.target.value)}
                        disabled={discharged}
                        InputProps={{ readOnly }}
                        InputLabelProps={{ shrink: true }} />
                </Box>

                {/* Action buttons */}
                {!readOnly && !discharged && (
                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1.5 }}>
                        <Button
                            variant="contained" size="medium"
                            onClick={saveInfo}
                            sx={{
                                textTransform: 'none', fontWeight: 600, px: 3,
                                background: 'linear-gradient(135deg,#2563eb,#0891b2)',
                                boxShadow: 'none',
                                '&:hover': { boxShadow: 'none', opacity: 0.9 },
                            }}
                        >
                            Save
                        </Button>
                        {paymentMode === 'card' && (
                            <Button
                                variant="contained" size="medium"
                                onClick={handleRazorpayPayment}
                                sx={{
                                    textTransform: 'none', fontWeight: 600, px: 3,
                                    background: 'linear-gradient(135deg,#16a34a,#15803d)',
                                    boxShadow: 'none',
                                    '&:hover': { boxShadow: 'none', opacity: 0.9 },
                                }}
                            >
                                Pay via Razorpay
                            </Button>
                        )}
                    </Box>
                )}
            </Box>
        </Paper>
    );
}

export default PayBill;
