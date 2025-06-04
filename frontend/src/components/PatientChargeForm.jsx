import React , { useEffect, useState } from 'react';
import styles from "./MedicalItemForm.module.css";
import deleteIcon from "../images/delete-icon.png";
import { faP, faPlus } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

function PatientChargeForm({ regId}){

    const [services, setServices] = useState([]);
    const [doctors,setDoctors] = useState([]);
    const [rows, setRows] = useState([]);
    const token = localStorage.getItem('token');

    useEffect(() => {

        const fetchData = async () => {
          try {
            const servicesRes = await fetch("http://localhost:3000/fetchServices");    
            const doctorRes = await fetch("http://localhost:3000/doctor");
            const services = await servicesRes.json();
            const doctors = await doctorRes.json();
    
            if (servicesRes.ok && doctorRes.ok) {
              setServices(services);
              setDoctors(doctors);
              console.log("Services fetched successfully");
            } else {
              console.log("Error in fetching services");
            }
          } catch (err) {
            console.error("Error fetching data:", err);
          }
        };
        fetchData();
      }, []);

      useEffect(() => {
      if (regId) {
        console.log("Fetch Services being called for regId ", regId);
        fetchPatientCharges();
      }
      }, [regId]);

        const fetchPatientCharges = async () => {
          try{
              let res = await fetch(`http://localhost:3000/fetchPatientCharges?regId=${encodeURIComponent(regId)}`);
              let data = await res.json();
              if(res.ok){
                console.log("Length of data is ",data);
                setRows(data.map((item) => ({
                  service_id: item.service_id,
                  service_name : item.service_name,
                  service_date: item.service_date,
                  service_amt : item.service_amt,
                  doc_id : item.doc_id,
                  update_flag:item.update_flag,
                  charge_id: item.charge_id
                })));
              }else{
                console.log("Error fetching consultations");
              }
          }catch(err){
            console.error(err);
          }
        }


      const addRow = () => {
        setRows([...rows, { service_id: "", service_date: "", service_amt: "", doc_id: "" }]);
    };


      const handleChange = (index,field,value) => {
        const updatedRows = [...rows];
        updatedRows[index][field] = value;
        console.log(updatedRows[index])
        if(updatedRows[index].charge_id) updatedRows[index].update_flag = "Yes";
        setRows(updatedRows);
      }

      const savePatientCharges = async() => {
        try{
          let res = await fetch('http://localhost:3000/patientCharges',{
            method: "POST",
            headers: { 
              "Content-Type": "application/json",
             },
            body: JSON.stringify({ regId , patientCharges : rows })
          });

          let data = await res.json();

          if(res.ok){
            alert("Consultations Saved Successfully");
            fetchPatientCharges();
          }else{
            alert("Failed to save consultations");
          }
        }catch(err){
          console.error("Error is ",err);
        }
      };

      const deleteRows = async(id,index) => {

        if(!id){
          const updatedRows = [...rows];
          updatedRows.splice(index,1);
          setRows(updatedRows);
          return;
        }
                const confirmed = window.confirm("Are you sure you want to delete this record?");
        if(!confirmed) return;
        console.log("DeleteRows is called and id is ",id);
        try{
          let res = await fetch(`http://localhost:3000/patientcharge/${id}`,{
            method: "DELETE",
            headers: { 
              "Content-Type": "application/json",
             },
          });

          let data = await res.json();

          if(res.ok){
            alert("Consultations Saved Successfully");
            fetchPatientCharges();
          }else{
            alert("Failed to save consultations");
          }
        }catch(err){
          console.error("Error is ",err);
        }
      }

    return(
        <div>
            <form>
        <div className={styles["title-icon"]}>
  <h1>Consultation for Registered ID: {regId}</h1>
  <button type="button" onClick={addRow}>
    <FontAwesomeIcon icon={faPlus} className={styles["title-icon-i"]} />
  </button>
</div>
                <table className='border -border-gray-300 w-full'>
                    <thead>
                        <tr >
                            <th className='border -border-gray-300 text-left bg-gray-100'>Service</th>
                            <th className='border -border-gray-300 text-left bg-gray-100'>Service Date</th>
                            <th className='border -border-gray-300 text-left bg-gray-100'>Service Amount</th>
                            <th className='border -border-gray-300 text-left bg-gray-100'>Doctor</th>
                        </tr>
                    </thead>
                   <tbody>
  {rows.map((row, index) => (
    <tr key={index}>
      <td className='border -border-gray-300'>
        <select
          value={row.service_id}
          onChange={(e) => handleChange(index, "service_id", e.target.value)}
        >
          <option value="" disabled hidden>Select Service</option>
          {services.map((service,i) => (
            <option key={service.service_id} value={service.service_id}>
              {service.service_name}
            </option>
          ))}
        </select>
      </td>
      <td className='border -border-gray-300'>
        <input
          type="date"
          value={row.service_date || ""}
          onChange={(e) => handleChange(index, "service_date", e.target.value)}
        />
      </td>
      <td className='border -border-gray-300'>
        <input
          type="number"
          value={row.service_amt || ""}
          onChange={(e) => handleChange(index, "service_amt", e.target.value)}
        />
      </td>
      <td className='border border-gray-300'>
                <select
          value={row.doc_id}
          onChange={(e) => handleChange(index, "doc_id", e.target.value)}
          
        >
          <option value=" ">Select Doctor</option>
          {doctors.map((doctor,i) => (
            <option key={doctor.doc_id} value={doctor.doc_id}>
              {doctor.name}
            </option>
          ))}
        </select>
      </td>
      <td className='border -border-gray-300'>
        <button
          type="button"
          onClick={() => deleteRows(row.charge_id)}
        >
          <img src = {deleteIcon} alt='delete-btn' style={{ width : "40%" , height : "40%"}}/>
        </button>
      </td>
    </tr>
  ))}
</tbody>

                </table>

        <div>
          <div className={styles["buttons"]}>
            <button onClick={savePatientCharges} disabled={rows.length === 0} className={styles["save-btn"]}>
             Save
            </button>
          </div>
        </div>
            </form>
        </div>
    )
}

export default PatientChargeForm;