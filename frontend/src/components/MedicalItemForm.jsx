import React, { useEffect, useState } from 'react';
import styles from "./MedicalItemForm.module.css";
import deleteIcon from "../images/delete-icon.png";
import { faP, faPlus } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import API_BASE_URL from './apiConfig';


function MedicalItemForm({ regId }) {
  const [medicines, setMedicines] = useState([]);
  const [rows, setRows] = useState([]);
  const [errorMessage,setErrorMessage] = useState("");
   const [regStatus , setRegStatus] = useState('');
  const token = localStorage.getItem('token');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const medicineRes = await fetch(`${API_BASE_URL}/fetchMedicines`);
        const regStatusRes = await fetch(`${API_BASE_URL}/regStatus?regId=${regId}`);
        const regData = await regStatusRes.json();
        const medicines = await medicineRes.json();
        if (medicineRes.ok && regStatusRes.ok) {
          setMedicines(medicines);
          setRegStatus(regData[0].reg_status);
          console.log("Medicines fetched successfully");
        } else {
          console.log("Error in fetching medicines");
        }
      } catch (err) {
        console.error("Error fetching data:", err);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    if (regId) {
      console.log("Fetch Medical Items being called for regId", regId);
      fetchMedicalItems();
    }
  }, [regId]);

  const fetchMedicalItems = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/fetchMedicalItems?regId=${encodeURIComponent(regId)}`);
      const data = await res.json();
      if (res.ok) {
        setRows(data.map(item => ({
          drug_id: item.drug_id,
          drug_name: item.medicineName,
          quantity: item.item_qty,
          price: item.item_price,
          value: item.item_value,
          date: item.date,
          update_flag: item.update_flag,
          medical_item_id: item.medical_item_id
        })));
      } else {
        console.log("Error fetching consultations");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const addRow = () => {
    setRows([...rows, { drug_id: "", date: "", quantity: "", price: "", value: "", update_flag: "", medical_item_id: null }]);
  };

  const handleChange = (index, field, value) => {
    const updatedRows = [...rows];
    updatedRows[index][field] = value;

    const quantity = parseFloat(updatedRows[index].quantity || 0);
    const price = parseFloat(updatedRows[index].price || 0);
    updatedRows[index].value = (price * quantity).toFixed(2);

    if (updatedRows[index].medical_item_id) {
      updatedRows[index].update_flag = "Yes";
    }

    setRows(updatedRows);
  };

  const saveMedicalItems = async () => {
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`${API_BASE_URL}/medicalItems`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({ regId, medicalItems: rows })
      });

      const data = await res.json();

      if (res.ok) {
        setErrorMessage("");
        fetchMedicalItems();
      } else {
        setErrorMessage(data.message);
      }
    } catch (err) {
      console.error("Error is", err);
    }
  };

  const deleteRows = async (id, index) => {
    if (!id) {
      const updatedRows = [...rows];
      updatedRows.splice(index, 1);
      setRows(updatedRows);
      return;
    }

    const confirmed = window.confirm("Are you sure you want to delete this record?");
    if (!confirmed) return;

    try {
      const res = await fetch(`${API_BASE_URL}/docmedicalItems/${id}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
      });

      const data = await res.json();

      if (res.ok) {
        alert("Consultation deleted successfully");
        setErrorMessage("");
        fetchMedicalItems();
      } else {
      }
    } catch (err) {
      console.error("Error is", err);
    }
  };

  return (
    <div className="p-4">
        {errorMessage && (
          <div className="p-3 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded w-72 text-center mb-4 mx-auto block">
            {errorMessage}
          </div>
        )}
      <form>
        <div className={styles["title-icon"]}>
  <h1>Consultation for Registered ID: {regId}</h1>
  <button type="button" onClick={addRow}>
    <FontAwesomeIcon icon={faPlus} className={styles["title-icon-i"]} />
  </button>
</div>


        <div className="overflow-x-auto">
          <table className="min-w-full border border-gray-300 text-sm text-left">
            <thead className="bg-gray-100">
              <tr>
                <th className="border px-3 py-2">Medicine</th>
                <th className="border px-3 py-2">Issue Date</th>
                <th className="border px-3 py-2">Quantity</th>
                <th className="border px-3 py-2">Price</th>
                <th className="border px-3 py-2">Value</th>
                <th className="border px-3 py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="border px-3 py-2">
                    <select
                      value={row.drug_id}
                      onChange={(e) => handleChange(index, "drug_id", e.target.value)}
                      className="w-full border rounded px-2 py-1"
                       disabled={regStatus === 'D'}
                    >
                      <option value="">Select Medicine</option>
                      {medicines.map((med) => (
                        <option key={med.DRUG_ID} value={med.DRUG_ID}>
                          {med.DRUG_NAME}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="border px-3 py-2">
                    <input
                      type="date"
                      value={row.date || ""}
                      onChange={(e) => handleChange(index, "date", e.target.value)}
                      className="w-full border rounded px-2 py-1"
                       disabled={regStatus === 'D'}
                    />
                  </td>
                  <td className="border px-3 py-2">
                    <input
                      type="number"
                      value={row.quantity || ""}
                      onChange={(e) => handleChange(index, "quantity", e.target.value)}
                      className="w-full border rounded px-2 py-1"
                       disabled={regStatus === 'D'}
                    />
                  </td>
                  <td className="border px-3 py-2">
                    <input
                      type="number"
                      value={row.price || ""}
                      onChange={(e) => handleChange(index, "price", e.target.value)}
                      className="w-full border rounded px-2 py-1"
                       disabled={regStatus === 'D'}
                    />
                  </td>
                  <td className="border px-3 py-2">{row.value}</td>
                  <td className="border px-3 py-2">
                    <button
                      type="button"
                      className="text-red-600 hover:underline"
                      onClick={() => deleteRows(row.medical_item_id, index)}
                    >
                      <img src = {deleteIcon} alt='delete-btn' style={{ width : "40%" , height : "40%"}}/>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div>
          <div className={styles["buttons"]}>
            <button type='button' onClick={saveMedicalItems} disabled={rows.length === 0} className={styles["save-btn"]}>
             Save
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

export default MedicalItemForm;
