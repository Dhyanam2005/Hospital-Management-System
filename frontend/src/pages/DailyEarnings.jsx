import { useEffect, useState } from "react";
import GenericMasterTableView from "../components/MasterDataTable";
import { Container } from '@mui/material';
import { format } from "date-fns";

function DailyEarnings() {
    const [data, setData] = useState([]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                let res = await fetch(`http://localhost:3000/daily-earnings`);
                let data = await res.json();

                if (res.ok) {
                    let i = 0;
                    const dataWithIds = data.map((item) => ({
                        id : i++,
                        PAYMENT_DATE: format(new Date(item.PAYMENT_DATE), 'dd-MM-yyyy'),
                        total_amount: item.total_amount,
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
    }, []);

    const columns = [
        { field: 'PAYMENT_DATE', headerName: 'Date', width: 300 },
        { field: 'total_amount', headerName: 'Amount', width: 400 },
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
