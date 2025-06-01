import React , { useEffect, useState } from "react";
import Navbar from "./SidebarMenu";
import { useNavigate } from "react-router-dom";

function NewAdmission({ regId }){

const [doctor,setDoctor] = useState('');
const [selectedBedDisplay, setSelectedBedDisplay] = useState('');
const [errorMessage,setErrorMessage] = useState('');
const [admitReason,setAdmitReason] = useState('');
const [doctors,setDoctors] = useState([]);
const [admissionDate , setAdmissionDate] = useState('');
const [dischargeDate,setDischargeDate] = useState('');
const [vacantBeds,setVacantBeds] = useState([]);
const [selectedBed,setSelectedBed] = useState('');
const [wardCharges,setWardCharges] = useState('');
const [admissionCharges,setAdmissionCharges] = useState('');
const [selectedBedName,setSelectedBedName] = useState('');
const [fetchAdmission,setFetchAdmission] = useState(false);
const navigate = useNavigate();

useEffect(() =>{
    const fetchDoctors = async() => {
        let res = await fetch('http://localhost:3000/fetchInHouseDoctors');
        let data = await res.json();
        if(res.ok){
            console.log(data);
            setDoctors(data);
        }else{
            console.log("Error has occured")
        }
    };

    fetchDoctors();
} ,[]);

useEffect(() => {
    const fetchAdmission = async () => {
        try{
        let res = await fetch(`http://localhost:3000/fetchAdmission?regId=${encodeURIComponent(regId)}`);
        let data = await res.json();

        if(res.ok){
            const admission = data[0];
            if(!admission.message){
                setAdmissionDate(admission.admission_date);
                setDischargeDate(admission.discharge_date);
                setDoctor(admission.doc_id);
                setAdmissionCharges(admission.admission_charges);
                setSelectedBed(admission.bed_id);
                setAdmitReason(admission.admit_reason);
                setWardCharges(admission.ward_charges);
                setSelectedBedName(admission.bed);
                setFetchAdmission(true);
            }else{
                setAdmissionDate("");
                setDischargeDate("");
                setDoctor("");
                setAdmissionCharges("");
                setSelectedBed("");
                setAdmitReason("");
                setWardCharges("");
                setFetchAdmission(false);    
            }
        }else{
            console.log("Res is not ok");
        }
        }catch(error){
            console.error("Error is ",error)
        }
    }
    fetchAdmission();
},[regId])

useEffect(() =>{
    const fetchBeds = async() => {
        let res = await fetch('http://localhost:3000/beds');
        let data = await res.json();
        if(res.ok){
            console.log(data);
            setVacantBeds(data);
        }else{
            console.log("Error has occured")
        }
    };

    fetchBeds();
} ,[]);



const handleNewAdmissionForm = async (e) =>{
    e.preventDefault();
    const token = localStorage.getItem('token');
    if(!token){
        setErrorMessage('User not authenticated');
        return;
    }
    try{
        let res = await fetch('http://localhost:3000/admission',{
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify({ doctor,admissionDate,admitReason,selectedBed,wardCharges,dischargeDate ,regId,admissionCharges})
        });

        let data = await res.json();
        if(res.ok){
            navigate("/home");
        }else{
            setErrorMessage(data.message || "Res not ok");
        }
    }catch(err){
        console.log("Error is",err);
        setErrorMessage("Error caught in try statement");
    }
}

    return(
        <div>
            <div className="new-patient">
                {errorMessage && (
                <div className="p-3 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded w-72 text-center mb-4 mx-auto block">
                    {errorMessage}
                </div>
                )}
                <form  onSubmit = {handleNewAdmissionForm} className="max-w-sm mx-auto p-6 shadow-lg rounded-lg">
                    <div className="mt-8">
                        <label htmlFor="admission_date" className="block text-sm font-semibold text-gray-700">Admission Date</label>
                        <input type = 'date' value={admissionDate} onChange={(e) => setAdmissionDate(e.target.value)}  id = "admission_date" placeholder="Enter admission date" className="w-full p-2 border-gray-300 rounded-lg placeholder-gray-400 placeholder-opacity-70 focus:outline-none focus:ring-2 focus:ring-blue-500"></input>
                    </div>
                    <div className="mt-8">
                        <label htmlFor="admitReason" className="block text-sm font-semibold text-gray-700">Admit Reason</label>
                        <input value={admitReason} onChange={(e) => setAdmitReason(e.target.value)} type="text" id = "AdmitReason" placeholder="Enter AdmitReason" className="w-full p-2 border-gray-300 rounded-lg placeholder-gray-400 placeholder-opacity-70 focus:outline-none focus:ring-2 focus:ring-blue-500"></input>
                    </div>
                    <div className="mt-8">
                        <label className="block text-sm font-semibold text-gray-700">Select Doctor</label>
                        <select value={doctor} onChange={(e) => setDoctor(e.target.value)} className="w-full p-2 mt-2 border border-gray-300 rounded-lg bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 hover:border-blue-400 transition-all">
                            <option value="">Select Doctor</option>
                            {doctors.map((doc) => (
                                <option key={doc.doc_id} value={doc.doc_id}>{doc.name}</option>
                            ))}
                        </select>
                    </div>
                    <div className="mt-8">
                        <label htmlFor="admission_charges" className="block text-sm font-semibold text-gray-700">Admission Charges</label>
                        <input type = 'number' value={admissionCharges} onChange={(e) => setAdmissionCharges(e.target.value)}  id = "admission_charges" placeholder="Enter admisssion charges" className="w-full p-2 border-gray-300 rounded-lg placeholder-gray-400 placeholder-opacity-70 focus:outline-none focus:ring-2 focus:ring-blue-500"></input>
                    </div>
                    <div className="mt-8">
                        {fetchAdmission ? 
                            <div>
                                <label> Bed : {selectedBedName}</label>
                            </div>
                        :
                            <div>
                        <label className="block text-sm font-semibold text-gray-700">Select Bed</label>
                        <select value={selectedBed} onChange={(e) => setSelectedBed(e.target.value)} className="w-full p-2 mt-2 border border-gray-300 rounded-lg bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 hover:border-blue-400 transition-all">
                            <option value="">Select Bed</option>
                            {vacantBeds.map((b) => (
                                <option key={b.bed_id} value={b.bed_id}>{b.bed}</option>
                            ))}
                        </select>
                            </div>
                        }
                    </div>
                    <div className="mt-8">
                        <label htmlFor="discharge_date" className="block text-sm font-semibold text-gray-700">Discharge Date</label>
                        <input type = 'date' value={dischargeDate} onChange={(e) => setDischargeDate(e.target.value)}  id = "discharge_date" placeholder="Enter discharge date" className="w-full p-2 border-gray-300 rounded-lg placeholder-gray-400 placeholder-opacity-70 focus:outline-none focus:ring-2 focus:ring-blue-500"></input>
                    </div>
                    <div className="mt-8">
                        <label htmlFor="ward_charges" className="block text-sm font-semibold text-gray-700">Ward Charges</label>
                        <input type = 'number' value={wardCharges} onChange={(e) => setWardCharges(e.target.value)}  id = "ward_charges" placeholder="Enter ward charges" className="w-full p-2 border-gray-300 rounded-lg placeholder-gray-400 placeholder-opacity-70 focus:outline-none focus:ring-2 focus:ring-blue-500"></input>
                    </div>
                    <button type='submit' className="mt-6 mx-auto block login-button">Submit</button>
                </form>
            </div>
        </div>
    )
}

export default NewAdmission