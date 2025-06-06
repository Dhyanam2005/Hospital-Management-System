import { useEffect, useState } from "react";
import GenericMasterTableView from "../components/MasterDataTable";
import { Container } from '@mui/material';
import API_BASE_URL from '../apiConfig';


function LocationMaster(){
    const [data,setData] = useState([]);
    useEffect(() => {
        const fetchData = async() => {
            try{
                let res = await fetch(`${API_BASE_URL}/location-master`);
                let data = await res.json();

                if(res.ok){
                    const dataWithIds = data.map((item,i) => ({
                        id: i + 1,
                        country_name: item.country_name,
                        state_name: item.state_name,
                        city_name: item.city_name,
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
    { field: 'country_name', headerName: 'Country', width: 150 },
    { field: 'state_name', headerName: 'State', width: 150 },
    { field: 'city_name', headerName: 'City', width: 150 },
    ];

    return(
        <div>
            <Container maxWidth="lg">
                {<GenericMasterTableView columns={columns} rows={data} title={"Location Master"}/>}
            </Container>
        </div>
    )
}

export default LocationMaster;