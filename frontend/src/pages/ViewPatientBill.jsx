import React, { useEffect, useState, useRef } from "react";
import { useReactToPrint } from "react-to-print";
import NavBar from "../components/SidebarMenu";
import API_BASE_URL from '../apiConfig';

function PrintableBill({ patientInfo, bill }) {
  const totalAmount = bill.reduce(
    (sum, item) => sum + Number(item.Amount || 0),
    0
  );

  return (
    <div style={{ padding: "30px", fontFamily: "Arial", fontSize: "14px" }}>
      <h2 style={{ textAlign: "center", marginBottom: "20px" }}>
        Patient Invoice
      </h2>

      <div style={{ marginBottom: "20px" }}>
        <p><strong>Patient ID:</strong> {patientInfo.patient_id}</p>
        <p><strong>Registration No:</strong> {patientInfo.reg_id}</p>
        <p><strong>Name:</strong> {patientInfo.name}</p>
        <p><strong>Sex:</strong> {patientInfo.sex}</p>
        <p><strong>Age:</strong> {patientInfo.age}</p>
        <p><strong>Phone:</strong> {patientInfo.phone}</p>
        <p><strong>Address:</strong> {patientInfo.address}</p>
      </div>

      <h3 style={{ marginTop: "20px" }}>Bill Details</h3>

      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr>
            <th style={thStyle}>Date</th>
            <th style={thStyle}>Description</th>
            <th style={thStyle}>Amount</th>
          </tr>
        </thead>
        <tbody>
          {bill.map((item, index) => (
            <tr key={index}>
              <td style={tdStyle}>{item.Date?.split("T")[0] || "N/A"}</td>
              <td style={tdStyle}>{item.Description || "N/A"}</td>
              <td style={tdStyle}>{Number(item.Amount || 0).toFixed(2)}</td>
            </tr>
          ))}
          <tr>
            <td style={{ ...tdStyle, fontWeight: "bold" }} colSpan={2}>
              Total
            </td>
            <td style={{ ...tdStyle, fontWeight: "bold" }}>
              {totalAmount.toFixed(2)}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

const thStyle = {
  border: "1px solid black",
  padding: "8px",
  backgroundColor: "#f0f0f0",
  textAlign: "left",
};

const tdStyle = {
  border: "1px solid black",
  padding: "8px",
  textAlign: "left",
};

function ViewPatientBill({ regId }) {
  const [patientInfo, setPatientInfo] = useState({});
  const [bill, setBill] = useState([]);
  const componentRef = useRef();
  const handlePrint = useReactToPrint({
    content: () => componentRef.current,
    documentTitle: "Patient_Bill",
  });

  useEffect(() => {
    const fetchPatAndBillDetails = async () => {
      console.log("regId received:", regId);
      try {
        const res1 = await fetch(`${API_BASE_URL}/patientpdf?regId=${regId}`);
        const res2 = await fetch(`${API_BASE_URL}/patientBill?regId=${regId}`);
        const data = await res1.json();
        const data2 = await res2.json();
        if (res1.ok && data.length > 0 && res2.ok) {
          setPatientInfo(data[0]);
          setBill(data2);
        }
      } catch (err) {
        console.error("Error fetching patient info:", err);
      }
    };
    fetchPatAndBillDetails();
  }, [regId]);

  return (
    <div className="view-patient-bill" style={{ padding: 20 }}>
      {Object.keys(patientInfo).length > 0 && bill.length > 0 && (
        <>

          <div ref={componentRef}>
            <PrintableBill patientInfo={patientInfo} bill={bill} />
          </div>
        </>
      )}
    </div>
  );
}

export default ViewPatientBill;
