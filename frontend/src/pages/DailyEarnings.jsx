import { useEffect, useState } from "react";
import GenericMasterTableView from "../components/MasterDataTable";
import { Container } from '@mui/material';
import { format } from "date-fns";
import API_BASE_URL from './apiConfig';

function DailyEarnings() {
    const [data, setData] = useState([]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                let res = await fetch(`${API_BASE_URL}/daily-earnings`);
                let data = await res.json();

                if (res.ok) {
                    let i = 0;
                   const dataWithIds = data.map((item) => ({
    id: i++,
    PAYMENT_DATE: format(new Date(item.payment_date), 'dd-MM-yyyy'), // date formatted correctly
    reg_charges: item.r,
    admission_charges: item.a,
    doc_fee: item.d,
    test_fee: item.t,
    ward_charges: item.w,
    discount: item.di,
    service_charges: item.s,
    total_payable: item.tot,
    total_amount: item["total_amount"],
}));
                    setData(dataWithIds);
                } else {
                    console.log("Res is not ok");
                }
            } catch (err) {
                console.log("Error is", err);
            }
        };
        fetchData();
        console.log(data);
    }, []);

    const columns = [
        { field: 'PAYMENT_DATE', headerName: 'Date', width: 130 },
        { field: 'reg_charges', headerName: 'Registration Charges', width: 180 },
        { field: 'admission_charges', headerName: 'Admission Charges', width: 180 },
        { field: 'doc_fee', headerName: 'Doctor Fee', width: 150 },
        { field: 'test_fee', headerName: 'Test Fee', width: 150 },
        { field: 'ward_charges', headerName: 'Ward Charges', width: 150 },
        { field: 'discount', headerName: 'Discount', width: 130 },
        { field: 'service_charges', headerName: 'Service Charges', width: 160 },
        { field: 'total_payable', headerName: 'Total Payable', width: 160 },
        { field: 'total_amount', headerName: 'Total Amount', width: 160 },
    ];

    return (
        <div>
            <Container maxWidth="lg">
                <GenericMasterTableView
                    columns={columns}
                    rows={data}
                    title={"Daily Earnings"}
                />
            </Container>
        </div>
    );
}

export default DailyEarnings;
