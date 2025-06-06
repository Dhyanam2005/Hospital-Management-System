import { useEffect, useState } from "react";
import GenericMasterTableView from "../components/MasterDataTable";
import { Container } from '@mui/material';
import API_BASE_URL from './apiConfig';


function DoctorMaster() {
    const [data, setData] = useState([]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                let res = await fetch(`${API_BASE_URL}/doctor`);
                let data = await res.json();

                if (res.ok) {
                    const dataWithIds = data.map((item) => ({
                        id: item.doc_id,
                        name: item.name,
                        email: item.email,
                        phone: item.phone,
                        address: item.address,
                        qualification: item.qualification,
                        license: item.medical_license_number,
                        createdAt: new Date(item.created_at).toLocaleDateString(),
                        specialization: item.specialization,
                        username: item.user_name,
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
        { field: 'id', headerName: 'ID', width: 90 },
        { field: 'name', headerName: 'Name', width: 150 },
        { field: 'email', headerName: 'Email', width: 200 },
        { field: 'phone', headerName: 'Phone', width: 130 },
        { field: 'address', headerName: 'Address', width: 250 },
        { field: 'qualification', headerName: 'Qualification', width: 150 },
        { field: 'license', headerName: 'License No.', width: 150 },
        { field: 'createdAt', headerName: 'Created At', width: 130 },
        { field: 'specialization', headerName: 'Specialization', width: 180 },
        { field: 'username', headerName: 'Username', width: 130 },
    ];

    return (
        <div>
            <Container maxWidth="lg">
                <GenericMasterTableView
                    columns={columns}
                    rows={data}
                    title={"Doctor Master"}
                />
            </Container>
        </div>
    );
}

export default DoctorMaster;
