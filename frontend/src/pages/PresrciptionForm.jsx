import React, { useEffect, useState } from "react";
import styles from "../components/MedicalItemForm.module.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {faPlus } from "@fortawesome/free-solid-svg-icons";
import deleteIcon from "../images/delete-icon.png";

function PrescriptionForm({ selectedDoctor, selectedDate, selectedPatientRegId }) {
    const [rows, setRows] = useState([]);
    const [medicine, setMedicine] = useState([]);

    const dosageSchedules = [
        { id: 1, name: "1-1-1" }, { id: 2, name: "1-0-1" }, { id: 3, name: "0-0-1" },
        { id: 4, name: "1-0-0" }, { id: 5, name: "0-1-0" }, { id: 6, name: "0.5-0.5-0.5" },
        { id: 7, name: "0.5-0-0.5" }, { id: 8, name: "0-0-0.5" }, { id: 9, name: "0.5-0-0" },
        { id: 10, name: "0-0.5-0" }
    ];

    const foodInstructions = [
        { id: 1, name: "Before Food" }, { id: 2, name: "After Food" },
        { id: 3, name: "Empty Stomach" }, { id: 4, name: "At bed time" },
        { id: 5, name: "With Food" }, { id: 6, name: "With Plenty of Water" }
    ];

      useEffect(() => {
        const fetchData = async () => {
          try{
            let res = await fetch(`http://localhost:3000/fetch-prescription?doc=${selectedDoctor}&date=${selectedDate}&reg=${selectedPatientRegId}`);
            let data = await res.json();
            if(res.ok){
                setRows(data);
            }else{
                console.log("Res is not ok");
            }
          }catch(err){
            console.error("Error is ",err);
          }
        };
        fetchData();
        console.log(rows);
      },[selectedDate,selectedDoctor,selectedPatientRegId]);

    useEffect(() => {
        const fetchMedicine = async () => {
            try {
                const res = await fetch("http://localhost:3000/fetchMedicines");
                if (res.ok) {
                    const data = await res.json();
                    setMedicine(data || []);
                } else {
                    console.error("Failed to fetch medical items");
                }
            } catch (error) {
                console.error("Error fetching medicines:", error);
            }
        };
        fetchMedicine();
    }, []);

    const addRow = () => {
        setRows((prev) => [...prev, { drug_id: "", dosage_schedule_id: "", food_instruction_id: "" }]);
    };

    const deleteRow = (index) => {
        setRows((prev) => prev.filter((_, i) => i !== index));
    };

    const handleChange = (index, field, value) => {
        setRows((prev) => {
            const updated = [...prev];
            updated[index] = { ...updated[index], [field]: value };
            return updated;
        });
    };

    const handleSave = async () => {
        const formattedPrescriptions = rows.map((row) => ({
            drug_id: row.drug_id,
            dosage_schedule_id: row.dosage_schedule_id,
            food_instruction_id: row.food_instruction_id
        }));
        console.log("FormattedPresviptions is ",formattedPrescriptions)
        try {
            const res = await fetch("http://localhost:3000/prescription", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    prescriptions: formattedPrescriptions,
                    selectedDate,
                    selectedDoctor,
                    selectedPatientRegId
                }),
            });

            if (res.ok) {
                alert("Prescription saved successfully");
                setRows([]);
            } else {
                alert("Failed to save prescription");
            }
        } catch (error) {
            console.error("Save error:", error);
        }
    };

const handleDelete = async () => {
    try {
        const res = await fetch(`http://localhost:3000/prescription?reg=${selectedPatientRegId}&doc=${selectedDoctor}&date=${selectedDate}`, {
            method: "DELETE"
        });
        if (res.ok) {
            alert("Prescription deleted successfully");
            setRows([]);
        } else {
            alert("Failed to delete prescription");
        }
    } catch (error) {
        console.error("Delete error:", error);
    }
};


    return (
        <div >
            <div className="mt-10">
                <div className={styles["title-icon"]}>
                    <p>Prescription Details </p>
                <button type="button" onClick={addRow}>
                <FontAwesomeIcon icon={faPlus} className={styles["title-icon-i"]} />
                </button>
            </div>    
            </div>
            {rows.length > 0 && 
            <table className="border border-gray-300 w-full">
                <thead>
                    <tr>
                        <th className="border border-gray-300 text-left">Drug Name</th>
                        <th className="border border-gray-300 text-left">Dosage Schedule</th>
                        <th className="border border-gray-300 text-left">Food Instruction</th>
                        <th className="border border-gray-300 text-left">Action</th>
                    </tr>
                </thead>
                <tbody>
                    {rows.map((row, index) => (
                        <tr key={index}>
                            <td className="border border-gray-300">
                                <select
                                    value={row.drug_id || ""}
                                    onChange={(e) => handleChange(index, "drug_id", e.target.value)}
                                >
                                    <option value="">Select Drug</option>
                                    {medicine.map((med) => (
                                        <option key={med.DRUG_ID} value={med.DRUG_ID}>
                                            {med.DRUG_NAME}
                                        </option>
                                    ))}
                                </select>
                            </td>
                            <td className="border border-gray-300">
                                <select
                                    value={row.dosage_schedule_id || ""}
                                    onChange={(e) => handleChange(index, "dosage_schedule_id", e.target.value)}
                                >
                                    <option value="">Select Dosage</option>
                                    {dosageSchedules.map((ds) => (
                                        <option key={ds.id} value={ds.id}>
                                            {ds.name}
                                        </option>
                                    ))}
                                </select>
                            </td>
                            <td className="border border-gray-300">
                                <select
                                    value={row.food_instruction_id || ""}
                                    onChange={(e) => handleChange(index, "food_instruction_id", e.target.value)}
                                >
                                    <option value="">Select Instruction</option>
                                    {foodInstructions.map((fi) => (
                                        <option key={fi.id} value={fi.id}>
                                            {fi.name}
                                        </option>
                                    ))}
                                </select>
                            </td>
                            <td className="border border-gray-300">
                                <button onClick={handleDelete} style={{ color: "red" }}>
                                    <img src={deleteIcon} alt="delete" style={{width:"40%",height:"40%"}}/>
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
            }
            <div className={styles["buttons"]}>
                <button onClick={handleSave} className={styles["save-btn"]}>Save</button>
            </div>
        </div>
    );
}

export default PrescriptionForm;
