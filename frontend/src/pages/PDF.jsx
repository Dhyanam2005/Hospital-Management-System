import React, { useEffect, useState } from "react";
import {
  PDFDownloadLink,
  Document,
  Page,
  Text,
  View,
} from "@react-pdf/renderer";
import styles from "./pdfStyles";
import API_BASE_URL from '../apiConfig';


const MyDoc = ({ patientInfo, testDetails}) => {

    const grouped = testDetails.reduce((acc,test) => {
      const category = test.test_category_name || "Others";
      if(!acc[category]) acc[category] = [];
      acc[category].push(test);
      return acc;
    },{});

    const checkRefRange = (reference_range) => {
      if(reference_range === "N/A"){
        return " ";
      }else{
        return reference_range;
      }
    }

    const resultInRange = (reference_range,result) => {
      if(reference_range !== "N/A"){
        if(reference_range[0] === "<" || reference_range[0] === ">"){
          let refValue = parseInt(reference_range.substring(1));
          if(reference_range[0] === "<"){
            if(result >= refValue){
              return "red";
            }
          }
          if(reference_range[0] === ">"){
            if(result <= refValue){
              return "red";
            }
          } 
        }else{
          let idx = -1;
          for(let i = 0;i < reference_range.length;i++){
            if(reference_range[i] === "-"){
              idx = i;
              break;
            }
          }

          let leftVal = parseInt(reference_range.substring(0,idx));
          let rightVal = parseFloat(reference_range.substring(idx+1));
          console.log(leftVal);
          console.log(rightVal);
          if(result < leftVal || result > rightVal){
            return "red";
          }
        }
      }
      return "black";
    }

  return (
    <Document>
      <Page size="A4" style={{ padding: 20 }}>
        <Text style={[styles.centeredText, styles.boldText, styles.marginTopHeading]}>
          Clinical Laboratory, Lab Report.
        </Text>
        <View style={styles.patDetailsSections}>
          <View style={styles.patDetailsSectionsRow}>
            <Text style={styles.patDetailsSectionsLabel}>Patient ID :</Text>
            <Text style={styles.patDetailsSectionsValue}>{patientInfo.patient_id}</Text>
          </View>
          <View style={styles.patDetailsSectionsRow}>
            <Text style={styles.patDetailsSectionsLabel}>Name :</Text>
            <Text style={styles.patDetailsSectionsValue}>{patientInfo.name}</Text>
          </View>
          <View style={styles.patDetailsSectionsRow}>
            <Text style={styles.patDetailsSectionsLabel}>Sex :</Text>
            <Text style={styles.patDetailsSectionsValue}>{patientInfo.sex}</Text>
          </View>
          <View style={styles.patDetailsSectionsRow}>
            <Text style={styles.patDetailsSectionsLabel}>Age :</Text>
            <Text style={styles.patDetailsSectionsValue}>{patientInfo.age}</Text>
          </View>
          <View style={styles.patDetailsSectionsRow}>
            <Text style={styles.patDetailsSectionsLabel}>Phone :</Text>
            <Text style={styles.patDetailsSectionsValue}>{patientInfo.phone}</Text>
          </View>
          <View style={styles.patDetailsSectionsRow}>
            <Text style={styles.patDetailsSectionsLabel}>Address :</Text>
            <Text style={styles.patDetailsSectionsValue}>{patientInfo.address}</Text>
          </View>
        </View>
        <View style={styles.line}></View>
        {Object.entries(grouped).map(([category, tests]) => (
  <View key={category} style={{ marginTop: 10, marginBottom: 10 }}>
    <Text style={[styles.boldText, { fontSize: 28, marginBottom: 6 }]}>
      {category}
    </Text>

    <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 6 }}>
      <Text style={[styles.boldText, { flex: 3 }]}>Test Name</Text>

      {(category.toLowerCase() === "biochemistry") && (
        <Text style={[styles.boldText, { flex: 3 }]}>Result Range</Text>
      )}

      <Text style={[styles.boldText, { flex: 3 }]}>Result</Text>
    </View>

    {tests.map((test, index) => (
      <View
        key={index}
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          marginBottom: 4,
        }}
      >
        <Text style={{ flex: 3 }}>{test.test_name}</Text>

        {(category.toLowerCase() === "biochemistry") && (
          <Text style={{ flex: 3, color: "#000" }}>
            {checkRefRange(test.reference_range)}
          </Text>
        )}

        <Text style={{ flex: 3, color: resultInRange(test.reference_range,test.result_num) }}>
          {test.result_num || test.result_char}
        </Text>
      </View>
    ))}
  </View>
))}

      </Page>
    </Document>
  );
};


function PDF() {
  const [grouped, setGrouped] = useState({});
  const [patientInfo, setPatientInfo] = useState({});
  const [testDetails, setTestDetails] = useState([]);

  useEffect(() => {
    const fetchPatDetails = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/patientpdf`);
        const data = await res.json();
        if (res.ok && data.length > 0) {
          setPatientInfo(data[0]);
        }
      } catch (err) {
        console.error("Error fetching patient info:", err);
      }
    };
    fetchPatDetails();
  }, []);

  useEffect(() => {
    const fetchPatTestDetails = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/testpdf`);
        const data = await res.json();
        if (res.ok) {
          setTestDetails(data);
        }
      } catch (err) {
        console.error("Error fetching test details:", err);
      }
    };
    fetchPatTestDetails();
  }, []);

  useEffect(() => {
    const convertIntoResult = () => {
      const groupedMap = {};
      for (const test of testDetails) {
        const category = test.test_category_name || "Others";
        if (!groupedMap[category]) {
          groupedMap[category] = [];
        }
        groupedMap[category].push(test);
      }
      setGrouped(groupedMap);
    };

    if (testDetails.length > 0) {
      convertIntoResult();
    }
    console.log(grouped);
  }, [testDetails]);

  return (
    <div>
      <PDFDownloadLink
        document={<MyDoc patientInfo={patientInfo} testDetails={testDetails} />}
        fileName="patient_report.pdf"
      >
        {({ loading }) => (loading ? "Loading document..." : "Download PDF")}
      </PDFDownloadLink>
    </div>
  );
}

export default PDF;
