import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom'; 
import styles from "./NewDoctorPopUp.module.css";
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
            setErrorMessage("");
        } else {
            setErrorMessage(data.message || 'Something went wrong');
        }
    } catch (err) {
        setErrorMessage('Failed to connect to server');
    }
};

  return (
    <div>
      <div className= 'ml-[20%]'>
        <h1 className="font-bold text-3xl text-center">Create a New Doctor</h1>
        {errorMessage && (
          <div className="p-3 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded w-72 text-center mb-4 mx-auto block">
            {errorMessage}
          </div>
        )}
      <form onSubmit={handleDoctorFormSubmit}>
        <div className= {styles["form-group"]}>
          <div className={styles['indiv-inp']}>
            <label htmlFor="doctorName">Name</label>
            <input
              id="doctorName"
              type="text"
              placeholder="Type doctor's name"
              value={doctorName}
              className={styles['indiv-inp-sizeOfInput']}
              onChange={(e) => setDoctorName(e.target.value)}
            />
          </div>
          <div className={styles['indiv-inp']}>
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="text"
              placeholder="Type doctor's email"
              value={email}
              className={styles['indiv-inp-sizeOfInput']}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
        </div>
        <div className={styles['form-group']}>
          <div className={styles['indiv-inp']}>
            <label htmlFor="phone">Phone</label>
            <input
              id="phone"
              type="text"
              placeholder="Type phone number"
              value={phone}
              className={styles['indiv-inp-sizeOfInput']}
              onChange={(e) => setPhone(e.target.value)}
            />
          </div>
          <div className={styles['indiv-inp']}>
            <label htmlFor="qualification">Qualification</label>
            <input
              id="qualification"
              type="text"
              placeholder="Type qualification"
              value={qualification}
              className={styles['indiv-inp-sizeOfInput']}
              onChange={(e) => setQualification(e.target.value)}
            />
          </div>
        </div>

        <div className={styles['indiv-inp']}>
          <label htmlFor="address">Address</label>
          <textarea
            id="address"
            type="text"
            placeholder="Type address"
            value={address}
            className={`${styles['indiv-inp-sizeOfInput']} ${styles['textarea-address']}`}
            rows={4}
            onChange={(e) => setAddress(e.target.value)}
          />
        </div>

        <div className={styles['form-group']}>
       <div className={styles['indiv-inp']}>
  <label htmlFor="specialization">Specialization</label>
  <select
    id="specialization"
    value={specialization}
    className={styles['indiv-inp-sizeOfselect']}
    onChange={(e) => setSpecialization(e.target.value)}
  >
    <option value="" disabled hidden>Select</option>
    {specializations.map((spec) => (
      <option key={spec.doc_spe_id} value={spec.doc_spe_id}>{spec.specialization}</option>
    ))}
  </select>
</div>
        <div className={styles['indiv-inp']}>
  <label htmlFor="doc_type">Doc Type</label>
  <select
    id="doc_type"
    value={docType}
    className={styles['indiv-inp-sizeOfselect']}
    onChange={(e) => setDocType(e.target.value)}
  >
    <option value="" disabled hidden>Select</option>
    <option value="I">I</option>
    <option value="R">R</option>
  </select>
</div>
        </div>
        <div className={`${styles['indiv-inp']} ${styles['indiv-license']}`}>
          <label htmlFor="licenseNumber">License Number</label>
          <input
            id="licenseNumber"
            type="text"
            placeholder="Type license number"
            value={licenseNumber}
            className={styles['indiv-inp-sizeOfInput']}
            onChange={(e) => setLicenseNumber(e.target.value)}
          />
        </div>
        <div className={styles['buttons']}>
            <button className={styles['submit-button']}>Submit</button>
        </div>
      </form>
      </div>
    </div>
  );
}

export default NewDoctorPopUp;
