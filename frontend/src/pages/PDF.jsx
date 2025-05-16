import React ,{ useState } from "react";
import "./PDF.css";
import {PDFDownloadLink,Document,Page,Text,View,StyleSheet} from "@react-pdf/renderer";

const styles = StyleSheet.create({
    page : { padding : 30},
    section : { marginBottom : 10 },
    heading : { fontSize : 20 , marginBottom : 10 },
});

const MyPDF = () => {
    <Document>
        <Page size="A4" style={styles.page}>
            <View style={styles.section}>
                <Text style={styles.heading}>Hello PDF</Text>
                <Text>Sample document</Text>
            </View>
        </Page>
    </Document>
}

function PDF() {
    return(
        <div>
            <PDFDownloadLink document={<MyPDF/>} fileName="sample.pdf">
                 {({ loading }) => (loading ? "Loading document..." : "Download PDF")}
            </PDFDownloadLink>
        </div>
    )
}

export default PDF;