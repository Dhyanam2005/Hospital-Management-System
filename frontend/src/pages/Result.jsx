import React , { useState } from "react";
import NavBar from "../components/SidebarMenu";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faMagnifyingGlass } from '@fortawesome/free-solid-svg-icons';
import ResultGrid from "../components/ResultGrid";

function Result(){

    const [patientName,setPatientName] = useState('');
    const [selectedRegId,setSelectedRegId] = useState('');
    const [patientData,setPatientData]= useState([]);
    const [showResultTable,setShowResultTable] = useState(false);


    

    const handleSearch = async () => {
    try{
        let res = await fetch(`http://localhost:3000/fetchpatreg?patientName=${encodeURIComponent(patientName)}`,{
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

    return(
        <div>
            <div className="result ml-[20%]">
                <div className="search-bar">
                    <label>Search Patient</label>
                    <input className = 'search-box' value = {patientName} onChange = {(e) => setPatientName(e.target.value)}type='text' placeholder='Enter patient Name'></input>
                    <button onClick={() => {
                        setSelectedRegId('');
                        handleSearch();
                    }}>
                        <FontAwesomeIcon icon={faMagnifyingGlass} />
                    </button>
                </div>

                {patientData.length > 0 &&
                    <table className="table-container">
                        <thead>
                            <tr>
                                <th>Patient ID</th>
                                <th>Name</th>
                                <th>Age</th>
                                <th>Registration ID</th>
                            </tr>
                        </thead>
                        <tbody>
                            {patientData.map((patient,index) => (
                                <tr key={index}>
                                    <td>{patient.patient_id}</td>
                                    <td>{patient.name}</td>
                                    <td>{patient.age}</td>
                                    <td>{patient.reg_id}</td>
                                    <td>
                                        <input name="select" type="radio" value={patient.reg_id} onChange={(e) => { setSelectedRegId(e.target.value); setShowResultTable(true)}} />
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                }

                {showResultTable && <ResultGrid regId = {selectedRegId}/>}
            </div>
        </div>
    )
}

export default Result;