import React , { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import { useNavigate } from "react-router-dom";

function NewPatient(){

const[patientName,setPatientName] = useState('');
const[dob,setDob] = useState('');
const[phone,setPhone] = useState('');
const[address,setAddress] = useState('');
const[email,setEmail] = useState('');
const[pincode,setPinCode] = useState('');
const[gender,setGender] = useState('');
const[nextOfKinName,setNextOfKinName] = useState('');
const[nextOfKinPhone,setNextOfKinPhone] = useState('');
const[cityId,setCityId] = useState('');
const[refferedBy,setRefferedBy] = useState('');
const [errorMessage,setErrorMessage] = useState('');
const [cities,setCities] = useState([]);
const [refferedDoctors,setRefferedDoctors] = useState([]);
const navigate = useNavigate();

useEffect(() =>{
    const fetchCities = async() => {
        let res = await fetch('http://localhost:3000/cities');
        let data = await res.json();
        console.log("Fetched data : ",data);
        if(res.ok){
            console.log("Cities added");
            setCities(data);
        }else{
            console.log("Error has occured")
        }
    };

    fetchCities();
} ,[]);

useEffect(() =>{
    const fetchReferredDoctors = async() => {
        let res = await fetch('http://localhost:3000/refferedby');
        let data = await res.json();
        if(res.ok){
            console.log("Reffered by added");
            console.log(data);
            setRefferedDoctors(data);
        }else{
            console.log("Error has occured")
        }
    };

    fetchReferredDoctors();
} ,[]);



const handleNewPatientForm = async (e) =>{
    e.preventDefault();
    const token = localStorage.getItem('token');
    if(!token){
        setErrorMessage('User not authenticated');
        return;
    }
    try{
        let res = await fetch('http://localhost:3000/patient',{
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify({ patientName,dob,phone,address,email,pincode,gender,nextOfKinName,nextOfKinPhone,cityId,refferedBy })
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
            <Navbar />
            <div className="new-patient">
                {errorMessage && (
                <div className="p-3 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded w-72 text-center mb-4 mx-auto block">
                    {errorMessage}
                </div>
                )}
                <h1 className="bold text-3xl block text-center pt-3">Create Patient</h1>
                <form onSubmit={handleNewPatientForm} className="max-w-sm mx-auto p-6 shadow-lg rounded-lg">
                    <div className="mt-8">
                        <label htmlFor="patient_name" className="block text-sm font-semibold text-gray-700">Name</label>
                        <input value={patientName} onChange={(e) => setPatientName(e.target.value)} type="text" id = "patient_name" placeholder="Enter name" className="w-full p-2 border-gray-300 rounded-lg placeholder-gray-400 placeholder-opacity-70 focus:outline-none focus:ring-2 focus:ring-blue-500"></input>
                    </div>
                    <div className="mt-8">
                        <label htmlFor="date_of_birth" className="block text-sm font-semibold text-gray-700">DOB</label>
                        <input value={dob} onChange={(e) => setDob(e.target.value)} type="text" id = "date_of_birth" placeholder="Enter date of birth" className="w-full p-2 border-gray-300 rounded-lg placeholder-gray-400 placeholder-opacity-70 focus:outline-none focus:ring-2 focus:ring-blue-500"></input>
                    </div>
                    <div className="mt-8">
                        <label htmlFor="phone" className="block text-sm font-semibold text-gray-700">Phone</label>
                        <input value={phone} onChange={(e) => setPhone(e.target.value)} type="text" id = "phone" placeholder="Enter phone number" className="w-full p-2 border-gray-300 rounded-lg placeholder-gray-400 placeholder-opacity-70 focus:outline-none focus:ring-2 focus:ring-blue-500"></input>
                    </div>
                    <div className="mt-8">
                        <label htmlFor="address" className="block text-sm font-semibold text-gray-700">Address</label>
                        <input value={address} onChange={(e) => setAddress(e.target.value)} type="text" id = "address" placeholder="Enter address" className="w-full p-2 border-gray-300 rounded-lg placeholder-gray-400 placeholder-opacity-70 focus:outline-none focus:ring-2 focus:ring-blue-500"></input>
                    </div>
                    <div className="mt-8">
                        <label htmlFor="pincode" className="block text-sm font-semibold text-gray-700">PinCode</label>
                        <input value={pincode} onChange={(e) => setPinCode(e.target.value)} type="text" id = "pincode" placeholder="Enter pincode" className="w-full p-2 border-gray-300 rounded-lg placeholder-gray-400 placeholder-opacity-70 focus:outline-none focus:ring-2 focus:ring-blue-500"></input>
                    </div>
                    <div className="mt-8">
                        <h1 className="block text-sm font-semibold text-gray-700">Gender</h1>
                        <label className="mt-3 block text-sm font-semibold text-gray-700">
                            <input type="radio" name = "gender" value = "M" onChange={(e) => setGender(e.target.value)}/>
                            Male
                        </label>
                        <label className="mt-3 block text-sm font-semibold text-gray-700">
                            <input type="radio" name = "gender" value = "F" onChange={(e) => setGender(e.target.value)}/>
                            Female
                        </label>
                    </div>
                    <div className="mt-8">
                        <label htmlFor="email" className="block text-sm font-semibold text-gray-700">Email</label>
                        <input value={email} onChange={(e) => setEmail(e.target.value)} type="text" id = "email" placeholder="Enter email" className="w-full p-2 border-gray-300 rounded-lg placeholder-gray-400 placeholder-opacity-70 focus:outline-none focus:ring-2 focus:ring-blue-500"></input>
                    </div>
                    <div className="mt-8">
                        <label htmlFor="next_of_kin_name" className="block text-sm font-semibold text-gray-700">Emergency Contact Name </label>
                        <input value={nextOfKinName} onChange={(e) => setNextOfKinName(e.target.value)} type="text" id = "next_of_kin_name" placeholder="Enter Emergency Contact Name" className="w-full p-2 border-gray-300 rounded-lg placeholder-gray-400 placeholder-opacity-70 focus:outline-none focus:ring-2 focus:ring-blue-500"></input>
                    </div>
                    <div className="mt-8">
                        <label htmlFor="next_of_kin_phone" className="block text-sm font-semibold text-gray-700">Emergency Contact Phone</label>
                        <input value={nextOfKinPhone} onChange={(e) => setNextOfKinPhone(e.target.value)} type="text" id = "next_of_kin_phone" placeholder="Enter Emergency Contact Phone" className="w-full p-2 border-gray-300 rounded-lg placeholder-gray-400 placeholder-opacity-70 focus:outline-none focus:ring-2 focus:ring-blue-500"></input>
                    </div>
                    <div className="mt-8">
                        <label className="block text-sm font-semibold text-gray-700">Select City</label>
                        <select value={cityId} onChange={(e) => setCityId(e.target.value)} className="w-full p-2 mt-2 border border-gray-300 rounded-lg bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 hover:border-blue-400 transition-all">
                            {!cityId && <option value="">Select a city</option>}
                            {cities.map((city) => (
                                <option key = {city.city_id} value = {city.city_id}>{city.city_name}</option>
                            ))}
                        </select>
                    </div>
                    <div className="mt-8">
                        <label className="block text-sm font-semibold text-gray-700">Select Referred Doctor(If any)</label>
                        <select value={refferedBy} onChange={(e) => setRefferedBy(e.target.value)} className="w-full p-2 mt-2 border border-gray-300 rounded-lg bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 hover:border-blue-400 transition-all">
                            <option value="">Select Referred Doctor</option>
                            {refferedDoctors.map((doctor) => (
                                <option key={doctor.doc_id} value={doctor.doc_id}>{doctor.name}</option>
                            ))}
                        </select>
                    </div>
                    <button type='submit' className="mt-6 mx-auto block login-button">Create</button>
                </form>
            </div>
        </div>
    )
}

export default NewPatient