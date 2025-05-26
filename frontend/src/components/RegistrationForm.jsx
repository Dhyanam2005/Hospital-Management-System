import React , { useEffect, useState } from 'react';
import './RegistrationForm.css'

function RegistrationForm({ patientId }) {

    const [regCharges,setRegCharges] = useState('');
    const [patientType,setPatientType] = useState('');
    const [docId,setDocId] = useState('');
    const [inHouseDoc,setInHouseDoc] = useState([]);
    const [errorMessage,setErrorMessage] = useState('');
    const [successMessage,setSuccessMessage] = useState('');

    useEffect(() => {
        setRegCharges('');
        setPatientType('');
        setDocId('');
        setErrorMessage('');
    },[patientId])

    useEffect(() => {
        const fetchDoctors = async (e) => {
            try{
                let res = await fetch('http://localhost:3000/fetchInHouseDoctors');
                let data = await res.json();

                if(res.ok){
                    console.log("Res is ok");
                    setInHouseDoc(data);
                }else{
                    setErrorMessage(data.message || "ERROR");
                }
            }catch(err){
                console.log("Error is " ,err);
            }
        }
        fetchDoctors();
    },[]);

    const handleRegisterSubmit = async (e) => {
        e.preventDefault();
        const token = localStorage.getItem('token');
        try{
            let res = await fetch('http://localhost:3000/registration',{
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body:JSON.stringify({ regCharges,patientType,docId , patientId})
            });

            let data = await res.json();

            if(res.ok){
                setSuccessMessage("Successfully registered");
                setRegCharges('');
                setPatientType('');
                setDocId('');
                setErrorMessage('');

            }else{
                setErrorMessage(data.message || 'Res is not ok');
            }
        }catch(err){
            setErrorMessage("Error is in try");
        }
    } 

    return(
        <div className='registration'>
            {errorMessage && (
                <div className="mt-5 pt-3 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded w-72 text-center mt-2 mx-auto block">
                    {errorMessage}
                </div>
            )}
            <form onSubmit={handleRegisterSubmit} className="max-w-sm mx-auto p-6 shadow-lg rounded-lg login-form pb-4">
                    <p className="block text-center text-gray-700 font-bold">Registering for Patient ID: {patientId}</p>
                    <h1 className="font-medium text-3xl text-center pt-3">Registration</h1>
                    <div className="mt-8">
                        <label htmlFor = "regCharges" className="block text-sm font-semibold text-gray-700">Registration Fees</label>
                        <input id = "regCharges" className="w-full p-2 border-gray-300 rounded-lg placeholder-gray-400 placeholder-opacity-70 focus:outline-none focus:ring-2 focus:ring-blue-500" type='text' placeholder='Enter registration fees' value={regCharges} onChange={(e) => setRegCharges(e.target.value)}></input>
                    </div>
                    <div className="mt-8">
                        <label htmlFor = "patientType" className="block text-sm font-semibold text-gray-700">Patient Type</label>
                        <select value={patientType} onChange={(e) => setPatientType(e.target.value)}>
                            <option value="" disabled hidden>Select Patient Type</option>
                            <option value= "I" >In-Patient</option>
                            <option value= "O">Out-Patient</option>
                        </select>
                    </div>
                    <div className="mt-8">
                        <label htmlFor = "patientType" className="block text-sm font-semibold text-gray-700">Doctor Type</label>
                        <select value={docId} onChange={(e) => setDocId(e.target.value)}>
                            <option value= "" disabled hidden>Select Doctor</option>
                            {inHouseDoc.map((doctor) => (
                            <option key={doctor.doc_id} value={doctor.doc_id}>{doctor.name}</option>
                            ))}
                        </select>
                    </div>
                <button type='submit' className="mt-6 mx-auto block reg-button">Register</button>
            </form>
        </div>
    )
}

export default RegistrationForm;