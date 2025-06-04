import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./AdmissionForm.module.css";

function NewAdmission({ regId }) {
  const [doctor, setDoctor] = useState("");
  const [selectedBedDisplay, setSelectedBedDisplay] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [admitReason, setAdmitReason] = useState("");
  const [doctors, setDoctors] = useState([]);
  const [admissionDate, setAdmissionDate] = useState("");
  const [dischargeDate, setDischargeDate] = useState("");
  const [vacantBeds, setVacantBeds] = useState([]);
  const [selectedBed, setSelectedBed] = useState("");
  const [wardCharges, setWardCharges] = useState("");
  const [admissionCharges, setAdmissionCharges] = useState("");
  const [selectedBedName, setSelectedBedName] = useState("");
  const [fetchAdmission, setFetchAdmission] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    async function fetchDoctors() {
      try {
        const res = await fetch("http://localhost:3000/fetchInHouseDoctors");
        const data = await res.json();
        if (res.ok) {
          setDoctors(data);
        } else {
          console.error("Error fetching doctors");
        }
      } catch (error) {
        console.error("Fetch doctors error:", error);
      }
    }

    fetchDoctors();
  }, []);

  useEffect(() => {
    async function fetchAdmission() {

    setAdmissionDate("");
    setDischargeDate("");
    setDoctor("");
    setAdmissionCharges("");
    setSelectedBed("");
    setAdmitReason("");
    setWardCharges("");
    setSelectedBedName("");
    setFetchAdmission(false);
    setErrorMessage("");
      try {
        const res = await fetch(
          `http://localhost:3000/fetchAdmission?regId=${encodeURIComponent(
            regId
          )}`
        );
        const data = await res.json();

        if (res.ok) {
          const admission = data[0];
          if (admission && !admission.message) {
            setAdmissionDate(admission.admission_date || "");
            setDischargeDate(admission.discharge_date || "");
            setDoctor(admission.doc_id || "");
            setAdmissionCharges(admission.admission_charges || "");
            setSelectedBed(admission.bed_id || "");
            setAdmitReason(admission.admit_reason || "");
            setWardCharges(admission.ward_charges || "");
            setSelectedBedName(admission.bed || "");
            setFetchAdmission(true);
          }
        } else {
          console.error("Error fetching admission");
        }
      } catch (error) {
        console.error("Fetch admission error:", error);
      }
    }

    if (regId) {
      fetchAdmission();
    }
  }, [regId]);

  useEffect(() => {
    async function fetchBeds() {
      try {
        const res = await fetch("http://localhost:3000/beds");
        const data = await res.json();
        if (res.ok) {
          setVacantBeds(data);
        } else {
          console.error("Error fetching beds");
        }
      } catch (error) {
        console.error("Fetch beds error:", error);
      }
    }

    fetchBeds();
  }, []);

  const handleNewAdmissionForm = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem("token");
    if (!token) {
      setErrorMessage("User not authenticated");
      return;
    }

    try {
      const res = await fetch("http://localhost:3000/admission", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          doctor,
          admissionDate,
          admitReason,
          selectedBed,
          wardCharges,
          dischargeDate,
          regId,
          admissionCharges,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        navigate("/home");
      } else {
        setErrorMessage(data.message || "Submission failed");
      }
    } catch (err) {
      console.error("Error submitting form:", err);
      setErrorMessage("Error caught in try statement");
    }
  };

  return (
    <div className={styles.newPatient}>
      {errorMessage && (
        <div className={styles.errorMessage}>{errorMessage}</div>
      )}
      <form id="admissionForm" onSubmit={handleNewAdmissionForm} className={styles.admissionForm}>
        <div className={styles.formGroup}>
          <div className={styles.indivInput}>
            <label htmlFor="admission_date">Admission Date</label>
            <input
              type="date"
              id="admission_date"
              placeholder="Enter admission date"
              value={admissionDate}
              onChange={(e) => setAdmissionDate(e.target.value)}
            />
          </div>
          <div className={styles.indivInput}>
            <label htmlFor="admitReason">Admit Reason</label>
            <input
              type="text"
              id="admitReason"
              placeholder="Enter Admit Reason"
              value={admitReason}
              onChange={(e) => setAdmitReason(e.target.value)}
            />
          </div>
        </div>

        <div className={styles.formGroup}>
          <div className={styles.indivInput}>
            <label>Select Doctor</label>
            <select
              value={doctor}
              onChange={(e) => setDoctor(e.target.value)}
            >
              <option value="">Select Doctor</option>
              {doctors.map((doc) => (
                <option key={doc.doc_id} value={doc.doc_id}>
                  {doc.name}
                </option>
              ))}
            </select>
          </div>

          <div className={styles.indivInput}>
            <label htmlFor="admission_charges">Admission Charges</label>
            <input
              type="number"
              id="admission_charges"
              placeholder="Enter admission charges"
              value={admissionCharges}
              onChange={(e) => setAdmissionCharges(e.target.value)}
            />
          </div>
        </div>

        <div className={styles.indivInput}>
          {fetchAdmission ? (
            <div>
              <label>Bed: {selectedBedName}</label>
            </div>
          ) : (
            <div>
              <label>Select Bed</label>
              <select
                value={selectedBed}
                onChange={(e) => setSelectedBed(e.target.value)}
              >
                <option value="">Select Bed</option>
                {vacantBeds.map((b) => (
                  <option key={b.bed_id} value={b.bed_id}>
                    {b.bed}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        <div className={styles.formGroup}>
          <div className={styles.indivInput}>
            <label htmlFor="discharge_date">Discharge Date</label>
            <input
              type="date"
              id="discharge_date"
              placeholder="Enter discharge date"
              value={dischargeDate}
              onChange={(e) => setDischargeDate(e.target.value)}
            />
          </div>
          <div className={styles.indivInput}>
            <label htmlFor="ward_charges">Ward Charges</label>
            <input
              type="number"
              id="ward_charges"
              placeholder="Enter ward charges"
              value={wardCharges}
              onChange={(e) => setWardCharges(e.target.value)}
            />
          </div>
        </div>
      </form>
        <div className={styles.buttons}>
          <button form="admissionForm" type="submit" className={styles.saveBtn}>
            Save
          </button>
        </div>
    </div>
  );
}

export default NewAdmission;
