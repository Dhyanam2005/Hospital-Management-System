import React, { useEffect, useState } from 'react';
import styles from './RegistrationForm.module.css';

function RegistrationForm({ patientId }) {
  const [regCharges, setRegCharges] = useState('');
  const [patientType, setPatientType] = useState('');
  const [docId, setDocId] = useState('');
  const [inHouseDoc, setInHouseDoc] = useState([]);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [oldRegistrations,setOldRegistrations] = useState([]);

  useEffect(() => {
    setRegCharges('');
    setPatientType('');
    setDocId('');
    setErrorMessage('');
    setSuccessMessage('');
  }, [patientId]);

  useEffect(() => {
    const fetchDoctors = async () => {
      try {
        let res = await fetch('http://localhost:3000/fetchInHouseDoctors');
        let data = await res.json();
        if (res.ok) {
          setInHouseDoc(data);
        } else {
          setErrorMessage(data.message || 'ERROR');
        }
      } catch (err) {
        console.log('Error is ', err);
      }
    };
    fetchDoctors();
  }, []);

    useEffect(() => {
    const fetchRegistration = async () => {
      try {
        const res = await fetch(`http://localhost:3000/fetch-registration?patientId=${patientId}`);
        const data = await res.json();

        if (res.ok) {
          const withId = data.map((item, index) => ({
            id: item.patient_id || index,
            ...item,
          }));
          setOldRegistrations(withId);
        } else {
          console.log("res is not ok");
        }
      } catch (err) {
        console.log("Error in try statement");
      }
    };
    fetchRegistration();
    console.log(oldRegistrations);
  },[patientId]);

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    try {
      let res = await fetch('http://localhost:3000/registration', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ regCharges, patientType, docId, patientId }),
      });

      let data = await res.json();

      if (res.ok) {
        setSuccessMessage('Successfully registered');
        setRegCharges('');
        setPatientType('');
        setDocId('');
        setErrorMessage('');
      } else {
        setErrorMessage(data.message || 'Res is not ok');
      }
    } catch (err) {
      setErrorMessage('Error is in try');
    }
  };

  return (
    <div className={styles.registration}>
      {errorMessage && <div className={styles.errorMsg}>{errorMessage}</div>}
      {successMessage && <div className={styles.successMsg}>{successMessage}</div>}
{oldRegistrations.length > 0 && (
  <div className={styles.registration}>
    <h3 style={{ marginTop: "2rem" ,textAlign:"center"}}>Previous Registrations</h3>
    {oldRegistrations.map((reg, index) => (
      <div
        key={index}
        className={styles.loginForm}
        style={{
          marginBottom: "1rem",
          border: "1px solid #ccc",
          padding: "1rem",
          borderRadius: "8px",
          background: "#f9f9f9",
        }}
      >
        <div className={styles.indivInp}>
          <label>Date</label>
          <input
            type="text"
            value={new Date(reg.reg_date).toLocaleString()}
            disabled
            className={styles.indivInpInput}
          />
        </div>

        <div className={styles.indivInp}>
          <label>Doctor ID</label>
          <input
            type="text"
            value={reg.doc_id}
            disabled
            className={styles.indivInpInput}
          />
        </div>

        <div className={styles.indivInp}>
          <label>Registration Fees</label>
          <input
            type="text"
            value={reg.reg_charges}
            disabled
            className={styles.indivInpInput}
          />
        </div>

        <div className={styles.indivInp}>
          <label>Patient Type</label>
          <input
            type="text"
            value={reg.patient_type === 'I' ? 'In-Patient' : 'Out-Patient'}
            disabled
            className={styles.indivInpInput}
          />
        </div>
      </div>
    ))}
  </div>
)}

      <form id="registrationForm" onSubmit={handleRegisterSubmit} className={styles.loginForm}>
        <div>
          <div className={styles.indivInp}>
            <label htmlFor="regCharges">Registration Fees</label>
            <input
              id="regCharges"
              type="text"
              placeholder="Enter registration fees"
              value={regCharges}
              onChange={(e) => setRegCharges(e.target.value)}
              className={styles.indivInpInput}
            />
          </div>
        </div>
        <div>
          <div className={styles.indivSelect}>
            <label htmlFor="patientType">Patient Type</label>
            <select
              id="patientType"
              value={patientType}
              onChange={(e) => setPatientType(e.target.value)}
              className={styles['indivInp-select']}
            >
              <option value="" disabled hidden>
                Select Patient Type
              </option>
              <option value="I">In-Patient</option>
              <option value="O">Out-Patient</option>
            </select>
          </div>
        </div>
        <div>
          <div className={styles.indivSelect}>
            <label htmlFor="docId">Doctor</label>
            <select
              id="docId"
              value={docId}
              onChange={(e) => setDocId(e.target.value)}
              className={styles['indivInp-select']}
            >
              <option value="" disabled hidden>
                Select Doctor
              </option>
              {inHouseDoc.map((doctor) => (
                <option key={doctor.doc_id} value={doctor.doc_id}>
                  {doctor.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </form>
        <div className={styles['buttons']}>
          <button form='registrationForm' type="submit" className={styles["save-btn"]}>
            Save
          </button>
        </div>
    </div>
  );
}

export default RegistrationForm;
