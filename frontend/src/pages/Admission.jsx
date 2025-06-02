import React , { useState , useEffect } from "react";
import "./DoctorConsultation.css";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faMagnifyingGlass } from '@fortawesome/free-solid-svg-icons'
import DoctorConsultationForm from "../components/DoctorConsultationForm";
import NavBar from "../components/SidebarMenu";
import NewAdmission from "../components/AdmissionForm";

function DoctorConsultation(){

    const [patientName,setPatientName] = useState('');
    const [selectedRegId,setSelectedRegId] = useState('');
    const [patientData,setPatientData]= useState([]);
    const [showTestGrid, setShowTestGrid] = useState(false);

    const handleSearch = async () => {
    try{
        let res = await fetch(`http://localhost:3000/consultationDoc?patientName=${encodeURIComponent(patientName)}`,{
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
            <div className="admission ml-[20%]">
                <h1 className="bold text-2xl block text-center pt-5">Admission</h1>
                <div className="search-bar">
                    <label htmlFor="search">Search Patient</label>
                    <input
                        type="text"
                        placeholder="Enter patient name"
                        id="search"
                        className="search-box"
                        value={patientName}
                        onChange={(e) => setPatientName(e.target.value)}
                    />
                    <button
                        onClick={handleSearch}
                    >
                        <FontAwesomeIcon icon={faMagnifyingGlass} />
                    </button>
                </div>
                {patientData.length > 0 && 
                    <table>
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
                                        <input
                                            type="radio"
                                            name="select"
                                            value={selectedRegId}
                                            onChange={() => {
                                                setSelectedRegId(patient.reg_id);
                                                setShowTestGrid(true);
                                            }}
                                        ></input>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                }
                {showTestGrid && <NewAdmission regId = {selectedRegId}/>}
            </div>
        </div>
    )
}

export default DoctorConsultation;