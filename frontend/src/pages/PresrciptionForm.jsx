import React, { useEffect, useState } from "react";

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
        setRows((prev) => [...prev, { drugId: "", dosageId: "", foodId: "" }]);
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
            drug_id: row.drugId,
            dosage_schedule_id: row.dosageId,
            food_instruction_id: row.foodId
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

    return (
        <div>
            <table>
                <thead>
                    <tr>
                        <th>Drug Name</th>
                        <th>Dosage Schedule</th>
                        <th>Food Instruction</th>
                        <th>Action</th>
                    </tr>
                </thead>
                <tbody>
                    {rows.map((row, index) => (
                        <tr key={index}>
                            <td>
                                <select
                                    value={row.drugId || ""}
                                    onChange={(e) => handleChange(index, "drugId", e.target.value)}
                                >
                                    <option value="">Select Drug</option>
                                    {medicine.map((med) => (
                                        <option key={med.DRUG_ID} value={med.DRUG_ID}>
                                            {med.DRUG_NAME}
                                        </option>
                                    ))}
                                </select>
                            </td>
                            <td>
                                <select
                                    value={row.dosageId || ""}
                                    onChange={(e) => handleChange(index, "dosageId", e.target.value)}
                                >
                                    <option value="">Select Dosage</option>
                                    {dosageSchedules.map((ds) => (
                                        <option key={ds.id} value={ds.id}>
                                            {ds.name}
                                        </option>
                                    ))}
                                </select>
                            </td>
                            <td>
                                <select
                                    value={row.foodId || ""}
                                    onChange={(e) => handleChange(index, "foodId", e.target.value)}
                                >
                                    <option value="">Select Instruction</option>
                                    {foodInstructions.map((fi) => (
                                        <option key={fi.id} value={fi.id}>
                                            {fi.name}
                                        </option>
                                    ))}
                                </select>
                            </td>
                            <td>
                                <button onClick={() => deleteRow(index)} style={{ color: "red" }}>
                                    Delete
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
            <button onClick={addRow} className="mx-auto block pt-4">+ Add Medicine</button><br />
            <button type="button" onClick={handleSave} className="mx-auto block">Save</button>
        </div>
    );
}

export default PrescriptionForm;
