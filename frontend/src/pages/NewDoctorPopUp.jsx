import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom'; 
import "./NewDoctorPopUp.css";
import Sidebar from '../components/SidebarMenu';

function NewDoctorPopUp() {
  const [doctorName, setDoctorName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [qualification, setQualification] = useState('');
  const [specialization, setSpecialization] = useState('');
  const [licenseNumber, setLicenseNumber] = useState('');
  const [docType,setDocType] = useState('');
  const [errorMessage,setErrorMessage] = useState('');
  const [specializations, setSpecializations] = useState([]);
  const token = localStorage.getItem('token');
  const navigate = useNavigate();


  useEffect(() => {
  const fetchSpecializations = async () => {
    try {
      const res = await fetch('http://localhost:3000/specializations');
      const data = await res.json();
      if (res.ok) {
        setSpecializations(data);
      } else {
        setErrorMessage('Error loading specializations');
      }
    } catch (err) {
      console.log(err);
      setErrorMessage('Failed to load specializations');
    }
  };
  fetchSpecializations();
}, []);


  const handleDoctorFormSubmit = async (e) => {
  e.preventDefault();
    setErrorMessage('');

    if (!token) {
        setErrorMessage('User not authenticated');
        return;
    }

    try {
        const res = await fetch('http://localhost:3000/doctor', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify({
                doctorName, email, phone, address, qualification, specialization: parseInt(specialization), licenseNumber , docType
            })
        });
        console.log({doctorName,email,phone,address,qualification,specialization,licenseNumber});
        const data = await res.json();

        if (res.ok) {
            alert("Doctor created successfully");
        } else {
            setErrorMessage(data.message || 'Something went wrong');
        }
    } catch (err) {
        setErrorMessage('Failed to connect to server');
    }
};

  return (
    <div>
      <div className='max-w-md mx-auto p-6 shadow-lg rounded-lg ml-[20%]'>
        <h1 className="font-bold text-3xl text-center">Create a New Doctor</h1>
      <form onSubmit={handleDoctorFormSubmit}>
        <div className="mt-6">
          <label htmlFor="doctorName" className="block text-sm font-semibold text-gray-700">Name</label>
          <input
            id="doctorName"
            type="text"
            placeholder="Type doctor's name"
            value={doctorName}
            onChange={(e) => setDoctorName(e.target.value)}
            className="w-full p-2 border-gray-300 rounded-lg placeholder-gray-400 placeholder-opacity-70 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="mt-6">
          <label htmlFor="email" className="block text-sm font-semibold text-gray-700">Email</label>
          <input
            id="email"
            type="text"
            placeholder="Type doctor's email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full p-2 border-gray-300 rounded-lg placeholder-gray-400 placeholder-opacity-70 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="mt-6">
          <label htmlFor="phone" className="block text-sm font-semibold text-gray-700">Phone</label>
          <input
            id="phone"
            type="text"
            placeholder="Type phone number"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="w-full p-2 border-gray-300 rounded-lg placeholder-gray-400 placeholder-opacity-70 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="mt-6">
          <label htmlFor="address" className="block text-sm font-semibold text-gray-700">Address</label>
          <input
            id="address"
            type="text"
            placeholder="Type address"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            className="w-full p-2 border-gray-300 rounded-lg placeholder-gray-400 placeholder-opacity-70 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="mt-6">
          <label htmlFor="qualification" className="block text-sm font-semibold text-gray-700">Qualification</label>
          <input
            id="qualification"
            type="text"
            placeholder="Type qualification"
            value={qualification}
            onChange={(e) => setQualification(e.target.value)}
            className="w-full p-2 border-gray-300 rounded-lg placeholder-gray-400 placeholder-opacity-70 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="mt-6">
  <label htmlFor="specialization" className="block text-sm font-semibold text-gray-700">Specialization</label>
  <select
    id="specialization"
    value={specialization}
    onChange={(e) => setSpecialization(e.target.value)}
    className="w-full p-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
  >
    <option value="" disabled hidden></option>
    {specializations.map((spec) => (
      <option key={spec.doc_spe_id} value={spec.doc_spe_id}>{spec.specialization}</option>
    ))}
  </select>
</div>
        <div className="mt-6">
  <label htmlFor="doc_type" className="block text-sm font-semibold text-gray-700">Doc Type</label>
  <select
    id="doc_type"
    value={docType}
    onChange={(e) => setDocType(e.target.value)}
    className="w-full p-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
  >
    <option value="" disabled hidden></option>
    <option value="I">I</option>
    <option value="R">R</option>
  </select>
</div>
        <div className="mt-6">
          <label htmlFor="licenseNumber" className="block text-sm font-semibold text-gray-700">License Number</label>
          <input
            id="licenseNumber"
            type="text"
            placeholder="Type license number"
            value={licenseNumber}
            onChange={(e) => setLicenseNumber(e.target.value)}
            className="w-full p-2 border-gray-300 rounded-lg placeholder-gray-400 placeholder-opacity-70 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className='button-wrapper'>
            <button className='submit-button'>Submit</button>
        </div>
      </form>
      </div>
    </div>
  );
}

export default NewDoctorPopUp;
