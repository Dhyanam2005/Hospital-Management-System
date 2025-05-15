import React, { useEffect, useState } from "react";
import "./TestGrid.css";

function TestGrid({ regId }) {
  const [inHouseDoctor, setInHouseDoctor] = useState([]);
  const [tests, setTests] = useState([]);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [test_id,setTest_id] =useState('');
  const [doc_id,setDoc_id] =useState('');


  useEffect(() => {
    const fetchData = async () => {
      try {
        const doctorRes = await fetch("http://localhost:3000/fetchInHouseDoctors");
        const testRes = await fetch("http://localhost:3000/fetchTests");

        const doctors = await doctorRes.json();
        const testsData = await testRes.json();

        if (doctorRes.ok && testRes.ok) {
          setInHouseDoctor(doctors);
          setTests(testsData);
          console.log(inHouseDoctor);
          console.log(testsData);
          console.log("Doctors and Tests fetched successfully");
        } else {
          console.log("Error in fetching doctors or tests");
        }
      } catch (err) {
        console.error("Error fetching data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const addRow = () => {
    if (inHouseDoctor.length === 0 || tests.length === 0) {
      alert("Data not loaded yet. Please wait...");
      return;
    }

    setRows([
      ...rows,
      {
        doctor: inHouseDoctor[0], // full doctor object
        test: tests[0],           // full test object
      },
    ]);
  };

  const deleteRow = (index) => {
    const updated = [...rows];
    updated.splice(index, 1);
    setRows(updated);
  };

  const updateRow = (index, field, value) => {
    const updated = [...rows];
    updated[index][field] = value;
    setRows(updated);
  };

const saveData = async () => {
  try {
    const response = await fetch("http://localhost:3000/saveTestGridData", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ regId, rows }),
    });

    const result = await response.json();

    if (response.ok) {
      alert("Data saved successfully!");
    } else {
      alert("Error saving data: " + (result.message || "Unknown error"));
    }
  } catch (err) {
    console.error("Save error:", err);
    alert("Failed to save data. See console for details.");
  }
};


  return (
    <div style={{ padding: "20px" }}>
      <h2 className="mx-auto bold text-center pb-4">Test for Patient Id : {regId}</h2>
      <table border="1" cellPadding="10" style={{ borderCollapse: "collapse", width: "100%" }}>
        <thead>
          <tr>
            <th>Doctor Name</th>
            <th>Test Name</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, idx) => (
            <tr key={idx}>
              <td>
                <select value={row.doctor?.doc_id || ""} onChange={(e) => {
    const selectedDoc = inHouseDoctor.find((doc) => doc.doc_id.toString() === e.target.value);
    updateRow(idx, "doctor", selectedDoc);
  }}>
                  {inHouseDoctor.map((doc, i) => (
                    <option key={i} value={doc.doc_id}>
                      {doc.name}
                    </option>
                  ))}
                </select>
              </td>
              <td>
                <select value={row.test?.test_id || ""}  onChange={(e) => {
    const selectedTest = tests.find((t) => t.test_id.toString() === e.target.value);
    updateRow(idx, "test", selectedTest);
  }} >
                  {tests.map((t, i) => (
                    <option key={i} value={t.test_id}>
                      {t.test_name}
                    </option>
                  ))}
                </select>
              </td>
              <td>
                <button onClick={() => deleteRow(idx)}>Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <br />
      <button onClick={addRow} disabled={loading} className="mx-auto block addRow">
        {loading ? "Loading..." : "Add Row"}
      </button>

      <button onClick={saveData} disabled={rows.length === 0}>
        Save
      </button>
    </div>
  );
}

export default TestGrid;
