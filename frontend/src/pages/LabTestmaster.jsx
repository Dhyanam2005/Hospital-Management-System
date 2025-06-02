import { useEffect, useState } from "react";
import GenericMasterTableView from "../components/MasterDataTable";

function LabTestMaster(){
    const [data,setData] = useState([]);
    useEffect(() => {
        const fetchData = async() => {
            try{
                let res = await fetch(`http://localhost:3000/lab-test-master`);
                let data = await res.json();

                if(res.ok){
                    const dataWithIds = data.map((item,i) => ({
                        id : i+1,
                        ...item,
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
    { field: 'id', headerName: 'ID', width: 70 },
    { field: 'test_category_name', headerName: 'Category', width: 150 },
    { field: 'test_name', headerName: 'Test Name', width: 150 },
    { field: 'specimen_type', headerName: 'Specimen', width: 100 },
    { field: 'result_type', headerName: 'Result Type', width: 100 },
    { field: 'reference_range', headerName: 'Reference Range', width: 150 },
    { field: 'reference_value', headerName: 'Reference Value', width: 150 },
    { field: 'test_unit', headerName: 'Unit', width: 100 },
    { field: 'test_charge', headerName: 'Charge (₹)', width: 120 },
    { field: 'test_long_name', headerName: 'Long Name', width: 200 },
    ];

    return(
        <div>
            {<GenericMasterTableView columns={columns} rows={data} title={"Lab Test Master"}/>}
        </div>
    )
}

export default LabTestMaster