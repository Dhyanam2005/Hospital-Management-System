import Sidebar from "../components/SidebarMenu";
import React , { useEffect, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faMagnifyingGlass } from '@fortawesome/free-solid-svg-icons'
import PayBill from "./PayBill";
import GenericMasterTableViewForRegistration from "../components/GenericTableForReg";
import styles from "./Test.module.css";
import API_BASE_URL from '../apiConfig';

function PayBillBefore(){
    const [patientName,setPatientName] = useState('');
    const [selectedRegId,setSelectedRegId] = useState('');
    const [patientData,setPatientData]= useState([]);
    const [showTestGrid, setShowTestGrid] = useState(false);

    
    const handleSearch = async () => {
    try{
        let res = await fetch(`${API_BASE_URL}/fetchpatreg?patientName=${encodeURIComponent(patientName)}`,{
            method : 'GET',
            headers: { 'Content-Type': 'application/json' },
        });

        let data = await res.json();

        if(res.ok){
            console.log(data);
            setPatientData(data);
        }else{
            console.log("res is not ok");
        }
    }catch(err){
        console.log("Error in try statement");
    }
}
    const columns = [
        { field: 'patient_id', headerName: 'Patient ID', width: 130 },
        { field: 'name', headerName: 'Name', width: 150 },
        { field: 'age', headerName: 'Age', width: 100 },
        { field: 'reg_id', headerName: 'Registration ID', width: 160 },
        {
            field: 'select',
            headerName: 'Select',
            width: 100,
            renderCell: (params) => (
                <input
                    type="radio"
                    name="select"
                    checked={selectedRegId === params.row.reg_id}
                    onChange={() => {
                        setSelectedRegId(params.row.reg_id);
                        setShowTestGrid(true);
                    }}
                />
            ),
        },
    ];

    const rows = patientData.map((patient, index) => ({
        id: index,
        ...patient,
    }));

    return (
        <div>
            <div className={`${styles.admission} ml-[20%]`}>
                <div className={styles["search-bar"]}>
                    <label htmlFor="search">Search Patient</label>
                    <input
                        type="text"
                        placeholder="Enter patient name"
                        id="search"
                        className={styles["search-box"]}
                        value={patientName}
                        onChange={(e) => setPatientName(e.target.value)}
                    />
                    <button onClick={handleSearch}>
                        <FontAwesomeIcon icon={faMagnifyingGlass} />
                    </button>
                </div>
            </div>
            <div>
                <div>
                    {patientData.length > 0 && (
                        <GenericMasterTableViewForRegistration
                            columns={columns}
                            rows={rows}
                        />
                    )}
                </div>
                <div className="ml-[20%]">
                    {showTestGrid && <PayBill regId={selectedRegId} />}
                </div>
            </div>
        </div>
    );
}

export default PayBillBefore;