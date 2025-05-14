import React, { useState , useEffect } from 'react';
import "./Doctor.css";
import NewDoctorPopUp from './NewDoctorPopUp';
import Navbar from '../components/Navbar';


function Doctor(){
  
    const [doctors,setDoctors] = useState([]);
    const [showPopUp,setShowPopUp] = useState(false);
    const closePopUp = () => {
      setShowPopUp(false);
    }

    useEffect(() => {
        const fetchDoctor = async () => {
            try{
                let res = await fetch('http://localhost:3000/doctor');
                let data = await res.json();
                console.log("Data fetched : ",data);
                if(res.ok){
                    setDoctors(data);
                }else{
                    console.log("Error");
                }
            }catch(error){
                console.log("Error is ",error);
            }
        };
        fetchDoctor();
    }, [])

    return(
      <div>
      <Navbar />
      {!showPopUp && <div className="doctor-container">
    <h2 className="doctor-heading">Doctors List</h2>
    <table className="doctor-table">
      <thead>
        <tr>
          <th>Doctor ID</th>
          <th>Name</th>
          <th>Email</th>
          <th>Phone</th>
          <th>Address</th>
          <th>Qualification</th>
          <th>Specialization</th>
          <th>License Number</th>
          <th>User Name</th>
          <th>Created At</th>
        </tr>
      </thead>
      <tbody>
        {doctors.map((doctor, index) => (
          <tr key={index}>
            <td>{doctor.doc_id}</td>
            <td>{doctor.name}</td>
            <td>{doctor.email}</td>
            <td>{doctor.phone}</td>
            <td>{doctor.address}</td>
            <td>{doctor.qualification}</td>
            <td>{doctor.specialization}</td>
            <td>{doctor.medical_license_number}</td>
            <td>{doctor.user_name}</td>
            <td>{new Date(doctor.created_at).toLocaleString()}</td>
          </tr>
        ))}
      </tbody>
    </table>
    <div className="button-wrapper">
      <button onClick={() => setShowPopUp(true)} className='new-doctor'>Create a New Doctor</button>
    </div>
  </div>}
      {showPopUp && <NewDoctorPopUp  onClose = {closePopUp}/>}
</div>

    )
}


//Used showPopUp 
export default Doctor;