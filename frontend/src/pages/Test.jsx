import NavBar from "../components/Navbar";
import React , { useEffect, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faMagnifyingGlass } from '@fortawesome/free-solid-svg-icons'
import "./Test.css";


function Test(){

    const [patientName,setPatientName] = useState('');
    const [selectedPatientId,setSelectedPatientId] = useState('');
    const [patientData,setPatientData]= useState([]);
    
    const handleSearch = async () => {
    try{
        let res = await fetch(`http://localhost:3000/fetchpat?patientName=${encodeURIComponent(patientName)}`,{
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
            <NavBar/>
                <div className="search-bar">
                    <label>Search Patient</label>
                    <input className = 'search-box' value = {patientName} onChange = {(e) => setPatientName(e.target.value)}type='text' placeholder='Enter patient Name'></input>
                    <button onClick={() => {
                        setSelectedPatientId('');
                        handleSearch();
                    }}>
                        <FontAwesomeIcon icon={faMagnifyingGlass} />
                    </button>
                </div>
                {patientData.length > 0 && 
                    <table className='table-container'>
                        <thead>
                            <tr>
                                <th>Patient ID</th>
                                <th>Name</th>
                                <th>Age</th>
                                <th>Phone</th>
                            </tr>
                        </thead>
                        <tbody>
                            {patientData.map((patient,index) => (
                            <tr key={index}>
                                <td>{patient.patient_id}</td>
                                <td>{patient.name}</td>
                                <td>{patient.age}</td>
                                <td>{patient.phone}</td>
                                <input value = {patient.patient_id} onChange={(e) => setSelectedPatientId(e.target.value)} type='radio' name = "select"/>
                            </tr>
                        )) }
                        </tbody>
                    </table>
                }
        </div>
    )
}

export default Test;