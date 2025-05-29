import React , { useEffect, useState } from 'react';
import "./DoctorConsultation.css"

function DoctorConsultationForm({ regId}){

    const [inHouseDoctor, setInHouseDoctor] = useState([]);
    const [rows, setRows] = useState([]);
    const token = localStorage.getItem('token');

    useEffect(() => {
        const fetchData = async () => {
          try {
            const doctorRes = await fetch("http://localhost:3000/fetchInHouseDoctors");    
            const doctors = await doctorRes.json();
    
            if (doctorRes.ok) {
              setInHouseDoctor(doctors);
              console.log("Doctors fetched successfully");
            } else {
              console.log("Error in fetching doctors");
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
        fetchConsultations();
      }
      }, [regId]);

        const fetchConsultations = async () => {
          try{
              let res = await fetch(`http://localhost:3000/fetchConsultations?regId=${encodeURIComponent(regId)}`);
              let data = await res.json();
              if(res.ok){
                console.log("Length of data is ",data.length);
                setRows(data.map((item) => ({
                  doc_id: item.doc_id,
                  fee: item.fee,
                  date: item.date,
                  update_flag:item.update_flag,
                  consultationId: item.doc_consultation_id
                })));
              }else{
                console.log("Error fetching consultations");
              }
          }catch(err){
            console.error(err);
          }
        }


      const addRow = () => {
        setRows([...rows,{ doc_id : " " , date : " ", fee : " " ,}]);
      };

      const handleChange = (index,field,value) => {
        const updatedRows = [...rows];
        updatedRows[index][field] = value;
        updatedRows[index].update_flag = "Yes";
        setRows(updatedRows);
      }

      const saveConsultations = async() => {
        try{
          let res = await fetch('http://localhost:3000/docConsultation',{
            method: "POST",
            headers: { 
              "Content-Type": "application/json",
              "Authorization": `Bearer ${token}`,
             },
            body: JSON.stringify({ regId , consultation : rows })
          });

          let data = await res.json();

          if(res.ok){
            alert("Consultations Saved Successfully");
            fetchConsultations();
          }else{
            alert("Failed to save consultations");
          }
        }catch(err){
          console.error("Error is ",err);
        }
      };

      const deleteRows = async(id,index) => {
        const confirmed = window.confirm("Are you sure you want to delete this record?");
        if(!confirmed) return;
        if(!id){
          const updatedRows = [...rows];
          updatedRows.splice(index,1);
          setRows(updatedRows);
          return;
        }

        console.log("DeleteRows is called and id is ",id);
        try{
          let res = await fetch(`http://localhost:3000/docConsultation/${id}`,{
            method: "DELETE",
            headers: { 
              "Content-Type": "application/json",
             },
          });

          let data = await res.json();

          if(res.ok){
            alert("Consultations Saved Successfully");
            fetchConsultations();
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
                            <th>Doctor Name</th>
                            <th>Date</th>
                            <th>Consultation Fees</th>
                            <th>Consultation ID</th>
                            <th>Update Flag</th>
                        </tr>
                    </thead>
                    <tbody>
                        {rows.map((row,index) => (
                          <tr key={index}>
                            <td>
                              <select
                                value={row.doc_id}
                                onChange={(e) => handleChange(index,"doc_id",e.target.value)}>
                                  <option value=" ">Select Doctor</option>
                                  {inHouseDoctor.map((doctor,i) => (
                                    <option key={doctor.doc_id} value={doctor.doc_id}>
                                      {doctor.name}
                                    </option>
                                  ))}
                              </select>
                            </td>
                            <td>
                              <input
                                type='date'
                                value={row.date}
                                onChange={(e) => handleChange(index,"date",e.target.value)}
                              />
                            </td>
                            <td>
                              <input
                                type='number'
                                value={row.fee}
                                onChange={(e) => handleChange(index,"fee",e.target.value)}
                              />
                            </td>
                            <td>{row.consultationId}</td>
                            <td>{row.update_flag}</td>
                            <td>
                              <button type='button' className='delete-btn' onClick={() => deleteRows(row.consultationId)}>
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
                  <button type='button' onClick={saveConsultations}>
                    💾 Save
                  </button>
                </div>
            </form>
        </div>
    )
}

export default DoctorConsultationForm;