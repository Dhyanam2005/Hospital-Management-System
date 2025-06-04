import React , { useEffect, useState } from "react";
import styles from './NewPatient.module.css';
import Sidebar from "../components/SidebarMenu";
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
  const [errorMessage,setErrorMessage] = useState('');
  const [cities,setCities] = useState([]);
  const navigate = useNavigate();

  useEffect(() =>{
    const fetchCities = async() => {
      let res = await fetch('http://localhost:3000/cities');
      let data = await res.json();
      if(res.ok){
        setCities(data);
      }else{
        console.log("Error has occured")
      }
    };
    fetchCities();
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
        body: JSON.stringify({ patientName,dob,phone,address,email,pincode,gender,nextOfKinName,nextOfKinPhone,cityId })
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
      <div className={styles['new-patient'] + " ml-[20%] w-4/5"}>
        {errorMessage && (
          <div className="p-3 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded w-72 text-center mb-4 mx-auto block">
            {errorMessage}
          </div>
        )}
        <h1 className={styles.title}>Create Patient</h1>
        <form onSubmit={handleNewPatientForm} className={styles.form + " mx-auto"}>
          <div className={styles['form-group-1']}>
            <div className={styles['indiv-inp']}>
              <label htmlFor="patient_name">Name</label>
              <input
                value={patientName}
                onChange={(e) => setPatientName(e.target.value)}
                type="text"
                id="patient_name"
                placeholder="Enter name"
              />
            </div>
            <div className={styles['indiv-inp']}>
              <label htmlFor="date_of_birth">DOB</label>
              <input
                value={dob}
                onChange={(e) => setDob(e.target.value)}
                type="text"
                id="date_of_birth"
                placeholder="Enter date of birth"
              />
            </div>
          </div>

          <div className={styles['form-group-2']}>
            <div className={styles['indiv-inp']}>
              <label htmlFor="phone">Phone</label>
              <input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                type="text"
                id="phone"
                placeholder="Enter phone number"
              />
            </div>
          </div>

          <div className={styles['form-group-3']}>
            <div className={styles['indiv-inp']}>
              <label htmlFor="address">Address</label>
              <textarea
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                id="address"
                placeholder="Enter address"
              />
            </div>
          </div>

          <div className={styles['form-group-4']}>
            <div className={styles['indiv-inp']}>
              <label htmlFor="pincode">PinCode</label>
              <input
                value={pincode}
                onChange={(e) => setPinCode(e.target.value)}
                type="text"
                id="pincode"
                placeholder="Enter pincode"
              />
            </div>
            <div className={styles['indiv-inp']}>
              <label htmlFor="email">Email</label>
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                type="text"
                id="email"
                placeholder="Enter email"
              />
            </div>
          </div>

          <div className={styles['form-group-5']}>
            <div className={styles['indiv-inp']}>
              <label htmlFor="next_of_kin_name">Emergency Contact Name </label>
              <input
                value={nextOfKinName}
                onChange={(e) => setNextOfKinName(e.target.value)}
                type="text"
                id="next_of_kin_name"
                placeholder="Enter Emergency Contact Name"
              />
            </div>
            <div className={styles['indiv-inp']}>
              <label htmlFor="next_of_kin_phone">Emergency Contact Phone</label>
              <input
                value={nextOfKinPhone}
                onChange={(e) => setNextOfKinPhone(e.target.value)}
                type="text"
                id="next_of_kin_phone"
                placeholder="Enter Emergency Contact Phone"
              />
            </div>
          </div>

          <div>
            <div className={styles.gender}>
              <span className={styles['gender-label']}>Gender</span>
              <label>
                <input
                  type="radio"
                  name="gender"
                  value="M"
                  onChange={(e) => setGender(e.target.value)}
                />
                Male
              </label>
              <label>
                <input
                  type="radio"
                  name="gender"
                  value="F"
                  onChange={(e) => setGender(e.target.value)}
                />
                Female
              </label>
            </div>
          </div>

          <div className={styles.dropdown}>
            <div className={styles['indiv-select']}>
              <label>City</label>
              <select
                value={cityId}
                onChange={(e) => setCityId(e.target.value)}
                className="w-full p-2 mt-2 border border-gray-300 rounded-lg bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 hover:border-blue-400 transition-all"
              >
                {!cityId && <option value="">Select</option>}
                {cities.map((city) => (
                  <option key={city.CITY_ID} value={city.CITY_ID}>
                    {city.CITY_NAME}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className={styles.buttons}>
            <button type="submit" className={styles['new-patient-cancel']}>
              Cancel
            </button>
            <button
              type="submit"
              className={styles['new-patient-but'] + " bg-gradient-to-r from-cyan-500 to-blue-500 text-white"}
            >
              Create
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default NewPatient;
