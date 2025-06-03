import React, { useState } from 'react';
import NavBar from "../components/SidebarMenu";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faMagnifyingGlass } from '@fortawesome/free-solid-svg-icons';
import RegistrationForm from '../components/RegistrationForm';
import GenericMasterTableViewForRegistration from '../components/GenericTableForReg';
import styles from "./Registration.module.css";

function Registration() {
  const [patientName, setPatientName] = useState('');
  const [selectedPatientId, setSelectedPatientId] = useState('');
  const [patientData, setPatientData] = useState([]);

  const handleSearch = async () => {
    try {
      const res = await fetch(`http://localhost:3000/fetchpat?patientName=${encodeURIComponent(patientName)}`);
      const data = await res.json();

      if (res.ok) {
        const withId = data.map((item, index) => ({
          id: item.patient_id || index,
          ...item,
        }));
        setPatientData(withId);
      } else {
        console.log("res is not ok");
      }
    } catch (err) {
      console.log("Error in try statement");
    }
  };

  const columns = [
    {
      field: 'select',
      headerName: '',
      width: 70,
      renderCell: (params) => (
        <input
          type="radio"
          name="select"
          value={params.row.patient_id}
          checked={selectedPatientId === params.row.patient_id}
          onChange={() => setSelectedPatientId(params.row.patient_id)}
        />
      ),
    },
    { field: 'patient_id', headerName: 'Patient ID', width: 150 },
    { field: 'name', headerName: 'Name', width: 200 },
    { field: 'date_of_birth', headerName: 'DOB', width: 150 },
    { field: 'age', headerName: 'Age', width: 100 },
  ];

  return (
    <div>
      <div className={`${styles.registration} ${styles.marginLeft20}`}>
        <div className={styles["search-bar"]}>
          <label>Search Patient</label>
          <input
            className={styles["search-box"]}
            value={patientName}
            onChange={(e) => setPatientName(e.target.value)}
            type="text"
            placeholder="Enter patient name"
          />
          <button
            onClick={() => {
              setSelectedPatientId('');
              handleSearch();
            }}
          >
            <FontAwesomeIcon icon={faMagnifyingGlass} />
          </button>
        </div>
      </div>
      <div>
        {patientData.length > 0 && (
          <GenericMasterTableViewForRegistration
            columns={columns}
            rows={patientData}
          />
        )}
      </div>
      <div className={styles.marginLeft20}>
        {selectedPatientId && <RegistrationForm patientId={selectedPatientId} />}
      </div>
    </div>
  );
}

export default Registration;
