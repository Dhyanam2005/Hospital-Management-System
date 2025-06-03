import React, { useEffect, useState } from 'react';
import styles from './RegistrationForm.module.css';

function RegistrationForm({ patientId }) {
  const [regCharges, setRegCharges] = useState('');
  const [patientType, setPatientType] = useState('');
  const [docId, setDocId] = useState('');
  const [inHouseDoc, setInHouseDoc] = useState([]);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

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
      <form onSubmit={handleRegisterSubmit} className={styles.loginForm}>
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
            <label htmlFor="docId">Doctor Type</label>
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
        <div className={styles['buttons']}>
          <button type="submit" className={styles["save-btn"]}>
            Register
          </button>
        </div>
      </form>
    </div>
  );
}

export default RegistrationForm;
