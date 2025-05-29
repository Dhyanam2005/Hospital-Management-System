import React , { useEffect, useState } from 'react';
import "./DoctorConsultation.css"

function MedicalItemForm({ regId}){

    const [medicines, setMedicines] = useState([]);
    const [rows, setRows] = useState([]);
    const token = localStorage.getItem('token');

    useEffect(() => {
        const fetchData = async () => {
          try {
            const medicineRes = await fetch("http://localhost:3000/fetchMedicines");    
            const medicines = await medicineRes.json();
    
            if (medicineRes.ok) {
              setMedicines(medicines);
              console.log("medicines fetched successfully");
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
        console.log("Fetch Consultations being called for regId ", regId);
        fetchMedicalItems();
      }
      }, [regId]);

        const fetchMedicalItems = async () => {
          try{
              let res = await fetch(`http://localhost:3000/fetchMedicalItems?regId=${encodeURIComponent(regId)}`);
              let data = await res.json();
              if(res.ok){
                console.log("Length of data is ",data);
                setRows(data.map((item) => ({
                  drug_id: item.drug_id,
                  drug_name : item.medicineName,
                  quantity: item.item_qty,
                  price : item.item_price,
                  value : item.item_value,
                  date: item.date,
                  update_flag:item.update_flag,
                  medical_item_id: item.medical_item_id
                })));
              }else{
                console.log("Error fetching consultations");
              }
          }catch(err){
            console.error(err);
          }
        }


      const addRow = () => {
        setRows([...rows, { drug_id: "", date: "", quantity: "", price: "", value: "" }]);
    };


      const handleChange = (index,field,value) => {
        const updatedRows = [...rows];
        updatedRows[index][field] = value;
        if(updatedRows[index].medical_item_id) updatedRows[index].update_flag = "Yes";
        setRows(updatedRows);
      }

      const saveMedicalItems = async() => {
        try{
          let res = await fetch('http://localhost:3000/medicalItems',{
            method: "POST",
            headers: { 
              "Content-Type": "application/json",
             },
            body: JSON.stringify({ regId , medicalItems : rows })
          });

          let data = await res.json();

          if(res.ok){
            alert("Consultations Saved Successfully");
            fetchMedicalItems();
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
          let res = await fetch(`http://localhost:3000/docmedicalItems/${id}`,{
            method: "DELETE",
            headers: { 
              "Content-Type": "application/json",
             },
          });

          let data = await res.json();

          if(res.ok){
            alert("Consultations Saved Successfully");
            fetchMedicalItems();
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
                <h1 className='text-center block text-lg pt-3 pb-3'>Consultation for registered ID : {regId}</h1>
                <table>
                    <thead>
                        <tr>
                            <th>Medicine</th>
                            <th>Issue Date</th>
                            <th>Quantity</th>
                            <th>Price</th>
                            <th>Value</th>
                        </tr>
                    </thead>
                   <tbody>
  {rows.map((row, index) => (
    <tr key={index}>
      <td>
        <select
          value={row.drug_id}
          onChange={(e) => handleChange(index, "drug_id", e.target.value)}
        >
          <option value=" ">Select Medicine</option>
          {medicines.map((med,i) => (
            <option key={med.DRUG_ID} value={med.DRUG_ID}>
              {med.DRUG_NAME}
            </option>
          ))}
        </select>
      </td>
      <td>
        <input
          type="date"
          value={row.date || ""}
          onChange={(e) => handleChange(index, "date", e.target.value)}
        />
      </td>
      <td>
        <input
          type="number"
          value={row.quantity || ""}
          onChange={(e) => handleChange(index, "quantity", e.target.value)}
        />
      </td>
      <td>
        <input
          type="number"
          value={row.price || ""}
          onChange={(e) => handleChange(index, "price", e.target.value)}
        />
      </td>
      <td>{row.value}</td>
      <td>{row.update_flag}</td>
      <td>
        <button
          type="button"
          className="delete-btn"
          onClick={() => deleteRows(row.medical_item_id)}
        >
          Delete Row
        </button>
      </td>
    </tr>
  ))}
</tbody>

                </table>

                <div className='pt-4 flex gap-4'>
                  <button type='button' onClick={addRow}>
                    + Add Row
                  </button>
                  <button type='button' onClick={saveMedicalItems}>
                    💾 Save
                  </button>
                </div>
            </form>
        </div>
    )
}

export default MedicalItemForm;