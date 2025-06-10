import React, { useEffect, useState } from "react";
import styles from "./Appointment.module.css";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { format } from "date-fns";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faMagnifyingGlass } from '@fortawesome/free-solid-svg-icons';
import Navbar from "../components/SidebarMenu";
import delteIcon from "../images/delete-icon.png";
import API_BASE_URL from '../apiConfig';


function Appointment() {
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedDoctor, setSelectedDoctor] = useState('');
  const [isSearched, setIsSearched] = useState(false);
  const [inHousedoctors, setInHouseDoctors] = useState([]);
  const [patient, setPatient] = useState([]);
  const [appointment, setAppointments] = useState([]);

  useEffect(() => {
    const fetchInHouseDoctorsAndPatients = async () => {
      try {
        const res1 = await fetch(`${API_BASE_URL}/fetchInHouseDoctors`);
        const res2 = await fetch(`${API_BASE_URL}/fetchAllPatients`);
        const data1 = await res1.json();
        const data2 = await res2.json();

        if (res1.ok && res2.ok) {
          setInHouseDoctors(data1);
          setPatient(data2);
        } else {
          console.log("Res is not ok");
        }
      } catch (err) {
        console.log("Error is", err);
      }
    };

    fetchInHouseDoctorsAndPatients();
  }, []);

  const handleAppointMents = async () => {
    if (!selectedDate || !selectedDoctor) return;

    try {
      const formattedDate = format(selectedDate, 'yyyy-MM-dd');
      const res = await fetch(`${API_BASE_URL}/appointmentlist?doc_id=${selectedDoctor}&appointment_date=${formattedDate}`);
      const data = await res.json();
      console.log("Fetched Appointment Data:", data);
      if (res.ok) {
        setAppointments(data);
        setIsSearched(true);
      } else {
        console.log("Res is not ok");
      }
    } catch (err) {
      console.error("Error is", err);
    }
  };

  const deleteAppointment = async (id) => {
    try {
      const res = await fetch(`${API_BASE_URL}/appointment/${id}`, {
        method: "DELETE",
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await res.json();

      if (res.ok) {
        alert("Data deleted successfully");
        setAppointments(prev => prev.filter(app => app.APPOINTMENT_ID !== id)); // refresh UI
      } else {
        alert("Error deleting data");
      }
    } catch (err) {
      console.error("Error is", err);
    }
  };

  const saveAppointment = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`${API_BASE_URL}/appointment`, {
        method: "POST",
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          appointment,
          selectedDoctor,
          selectedDate: format(selectedDate, 'yyyy-MM-dd'),
        }),
      });

      const data = await res.json();

      if (res.ok) {
        alert("Data saved successfully");
        await handleAppointMents();
      } else {
        alert("Error saving data");
      }
    } catch (err) {
      console.error("Error is", err);
    }
  };

  const handleChange = (index, field, value) => {
    const updatedAppointments = [...appointment];
    updatedAppointments[index][field] = value;
    setAppointments(updatedAppointments);
  };

  return (
    <div>
      <div className="appointment ml-[20%]">
        <div className="flex items-center gap-2 mb-5">
          <label>Select Date:</label>
          <DatePicker
            selected={selectedDate}
            onChange={(date) => setSelectedDate(date)}
            dateFormat="dd-MM-yyyy"
            placeholderText="Select"
            className={styles["select-date"]}
          />
          <select
            value={selectedDoctor}
            onChange={(e) => setSelectedDoctor(e.target.value)}
            className={styles["select-doctor"]}
          >
            <option value="">Select Doctor</option>
            {inHousedoctors.map((doctor) => (
              <option value={doctor.doc_id} key={doctor.doc_id}>
                {doctor.name}
              </option>
            ))}
          </select>
          <button type="button" onClick={handleAppointMents} className="pl-5">
            <FontAwesomeIcon icon={faMagnifyingGlass} />
          </button>
        </div>

        {isSearched && appointment.length > 0 && (
          <div>
            <form id = "appointment-form">
              <table className="border border-gray-300 w-3/4">
                <thead>
                  <tr>
                    <th className="border border-gray-300 text-left">Appointment Time</th>
                    <th className="border border-gray-300 text-left">Patient</th>
                    <th className="border border-gray-300"></th>
                  </tr>
                </thead>
                <tbody>
                  {appointment.map((app, index) => {
                        const selectedPatients = appointment
                            .filter((_, i) => i !== index)
                            .map(a => String(a.patient_id))
                            .filter(Boolean);

                                const remainingPatients = patient.filter(
                                    p => !selectedPatients.includes(String(p.patient_id))
                                );

                    return (
                      <tr key={index}>
                        <td className="border border-gray-300">{app.appointment_time}</td>
                        <td className="border border-gray-300">
                          <select
                            value={app.patient_id || ''}
                            onChange={(e) =>
                              handleChange(index, "patient_id", e.target.value)
                            }
                            className={styles["select-doctor-time"]}
                          >
                            <option value="">Select Patient</option>
                            {remainingPatients.map((pat) => (
                              <option
                                value={pat.patient_id}
                                key={pat.patient_id}
                              >
                                {pat.name}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="border border-gray-300">
                          <button
                            type="button"
                            onClick={() =>
                              deleteAppointment(app.APPOINTMENT_ID)
                            }
                          >
                            <img src={delteIcon} alt="delete" style={{width : "40%",height:"40%"}}></img>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
                  <div>
                  </div>
            </form>
          <div className={styles["buttons"]}>
            <button form="appointment-form" onClick={saveAppointment} className={styles["save-btn"]}>
             Save
            </button>
          </div>
        </div>
        )}
      </div>
    </div>
  );
}

export default Appointment;
