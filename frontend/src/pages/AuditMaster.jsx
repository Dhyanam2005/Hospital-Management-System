import { useEffect, useState } from "react";
import GenericMasterTableView from "../components/MasterDataTable";
import { Container } from '@mui/material';
import API_BASE_URL from './apiConfig';


function AuditMaster() {
    const [data, setData] = useState([]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                let res = await fetch(`${API_BASE_URL}/audit-master`);
                console.log(`${API_BASE_URL}/audit-master`);
                let data = await res.json();

                if (res.ok) {
                    const dataWithIds = data.map((item) => ({
                        id: item.audit_id,
                        userId: item.user_id,
                        action: item.action,
                        tableName: item.table_name,
                        recordId: item.record_id,
                        oldData: item.old_data,
                        newData: item.new_data,
                        timestamp: new Date(item.timestamp).toLocaleString(),
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
        { field: 'id', headerName: 'Audit ID', width: 100 },
        { field: 'userId', headerName: 'User ID', width: 100 },
        { field: 'action', headerName: 'Action', width: 180 },
        { field: 'tableName', headerName: 'Table Name', width: 150 },
        { field: 'recordId', headerName: 'Record ID', width: 100 },
        { field: 'oldData', headerName: 'Old Data', width: 400 },
        { field: 'newData', headerName: 'New Data', width: 400 },
        { field: 'timestamp', headerName: 'Timestamp', width: 200 },
    ];

    return (
        <div>
            <Container maxWidth="lg">
                <GenericMasterTableView
                    columns={columns}
                    rows={data}
                    title={"Audit Log"}
                />
            </Container>
        </div>
    );
}

export default AuditMaster;
