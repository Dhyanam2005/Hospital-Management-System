import React, { useEffect, useState } from "react";
import {
  PDFDownloadLink,
  Document,
  Page,
  Text,
  View,
  StyleSheet,
} from "@react-pdf/renderer";
import NavBar from "../components/Navbar";

// PDF styles
const styles = StyleSheet.create({
  page: {
    padding: 30,
    fontSize: 12,
    fontFamily: "Helvetica",
  },
  heading: {
    fontSize: 16,
    textAlign: "center",
    marginBottom: 20,
    fontWeight: "bold",
  },
  section: {
    marginBottom: 20,
  },
  label: {
    fontWeight: "bold",
    marginBottom: 5,
  },
  value: {
    fontWeight: "normal",
  },
  table: {
    display: "table",
    width: "auto",
    borderStyle: "solid",
    borderWidth: 1,
    borderRightWidth: 0,
    borderBottomWidth: 0,
  },
  tableRow: {
    flexDirection: "row",
  },
  tableCell: {
    borderStyle: "solid",
    borderWidth: 1,
    borderLeftWidth: 0,
    borderTopWidth: 0,
    padding: 5,
    flex: 1,
  },
  headerCell: {
    backgroundColor: "#f0f0f0",
    fontWeight: "bold",
  },
  lastCell: {
    textAlign: "right",
  },
});

const MyDoc = ({ patientInfo, bill }) => {
  // Calculate total amount safely
  const totalAmount = bill.reduce(
    (sum, item) => sum + Number(item.Amount || 0),
    0
  );

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.heading}>Clinical Laboratory, Lab Report</Text>

        <View style={styles.section}>
          <Text style={styles.label}>
            Patient ID: <Text style={styles.value}>{patientInfo.patient_id}</Text>
          </Text>
          <Text style={styles.label}>
            Name: <Text style={styles.value}>{patientInfo.name}</Text>
          </Text>
          <Text style={styles.label}>
            Sex: <Text style={styles.value}>{patientInfo.sex}</Text>
          </Text>
          <Text style={styles.label}>
            Age: <Text style={styles.value}>{patientInfo.age}</Text>
          </Text>
          <Text style={styles.label}>
            Phone: <Text style={styles.value}>{patientInfo.phone}</Text>
          </Text>
          <Text style={styles.label}>
            Address: <Text style={styles.value}>{patientInfo.address}</Text>
          </Text>
        </View>

        <Text style={[styles.heading, { marginTop: 20 }]}>Bill Details</Text>

        <View style={styles.table}>
          {/* Table Header */}
          <View style={styles.tableRow}>
            <Text style={[styles.tableCell, styles.headerCell]}>Date</Text>
            <Text style={[styles.tableCell, styles.headerCell]}>Description</Text>
            <Text style={[styles.tableCell, styles.headerCell]}>Amount</Text>
          </View>

          {/* Table Data Rows */}
          {bill.map((item, index) => (
            <View style={styles.tableRow} key={index}>
              <Text style={styles.tableCell}>{item.Date?.split("T")[0] || "N/A"}</Text>
              <Text style={styles.tableCell}>{item.Description || "N/A"}</Text>
              <Text style={[styles.tableCell, styles.lastCell]}>
                {Number(item.Amount || 0).toFixed(2)}
              </Text>
            </View>
          ))}

          {/* Total Row */}
          <View style={styles.tableRow}>
            <Text style={[styles.tableCell, { flex: 2, fontWeight: "bold" }]}>Total</Text>
            <Text style={[styles.tableCell, styles.lastCell, { fontWeight: "bold" }]}>
              {totalAmount.toFixed(2)}
            </Text>
          </View>
        </View>
      </Page>
    </Document>
  );
};

function ViewPatientBill({ regId }) {
  const [patientInfo, setPatientInfo] = useState({});
  const [bill, setBill] = useState([]);

  useEffect(() => {
    const fetchPatAndBillDetails = async () => {
      try {
        const res1 = await fetch(
          `http://localhost:3000/patientpdf?regId=${regId}`
        );
        const res2 = await fetch(
          `http://localhost:3000/patientBill?regId=${regId}`
        );
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
    <div>
      <div className="view-patient-bill" style={{ padding: 20 }}>
        <PDFDownloadLink
          document={<MyDoc patientInfo={patientInfo} bill={bill} />}
          fileName="patient_bill.pdf"
        >
          {({ loading }) =>
            loading ? "Loading document..." : "Download Patient Bill PDF"
          }
        </PDFDownloadLink>
      </div>
    </div>
  );
}

export default ViewPatientBill;
