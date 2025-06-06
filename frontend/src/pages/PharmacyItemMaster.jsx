import { useEffect, useState } from "react";
import GenericMasterTableView from "../components/MasterDataTable";
import { Container } from "@mui/material";
import API_BASE_URL from './apiConfig';


function PharmacyItemMaster(){
    const [data,setData] = useState([]);
    useEffect(() => {
        const fetchData = async() => {
            try{
                let res = await fetch(`${API_BASE_URL}/pharmacy-item-master`);
                let data = await res.json();

                if(res.ok){
                    const dataWithIds = data.map((item,i) => ({
                        id: item.DRUG_ID,
                        drug_name: item.DRUG_NAME,
                    }));
                    setData(dataWithIds);
                }else{
                    console.log("Res is not ok");
                }
            }catch(err){
                console.log("Error is ",err);
            }
        }
        fetchData();
    },[])

    const columns = [
    { field: 'id', headerName: 'ID', width: 150 },
    { field: 'drug_name', headerName: 'Medicine', width: 500 },
    ];

    return(
        <div>
            <Container maxWidth="lg">
                {<GenericMasterTableView columns={columns} rows={data} title={"Pharmacy Item Master"}/>}
            </Container>
        </div>
    )
}

export default PharmacyItemMaster;