import React, { useEffect, useState } from "react";
import "react-datepicker/dist/react-datepicker.css";
import { format } from "date-fns";
import styles from "./PatientReportStateWise.module.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faMagnifyingGlass } from "@fortawesome/free-solid-svg-icons";
import DatePicker from "react-datepicker";
import API_BASE_URL from '../apiConfig';
import exportToExcel from "../components/ExcelForTabularReport";


function ReferralDocReport() {
  const [data, setData] = useState([]);
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);

    const fetchData = async (startDate,endDate) => {
      console.log("Fetching data from API...");
      if(!startDate || !endDate){
        alert("Enter start date and end date"); return;
      }
      try {
        const startDateFormatted = startDate ? format(startDate, "yyyy-MM-dd") : "";
        const endDateFormatted = endDate ? format(endDate, "yyyy-MM-dd") : "";
        console.log(startDateFormatted + " " + endDateFormatted)
        let res = await fetch(
          `${API_BASE_URL}/referralDoc?startDate=${startDateFormatted}&endDate=${endDateFormatted}`
        );

        const data = await res.json();

        if (res.ok) {
          if (Array.isArray(data)) {
            console.log(data);
            setData(data);
          } else {
            console.log("Expected an array but got:", data);
            setData([]);
          }
        } else {
          console.log("Response not OK");
        }
      } catch (err) {
        console.error(err);
      }
    };
  return (
    <div>
      <div className="doctor-wise-reg-fees ml-[20%]">
        <h1 className="bold text-center block pt-5 text-2xl">Referral Doctor Summary</h1>
        <div className="flex items-center gap-4 mb-5">
          <div>
            <label>Start Date :</label>
            <DatePicker
              selected={startDate}
              onChange={(date) => setStartDate(date)}
              dateFormat="dd-MM-yyyy"
              placeholderText="Select start date"
              className={styles["date"]}
            />
          </div>
          <div>
            <label>End Date :</label>
            <DatePicker
              selected={endDate}
              onChange={(date) => setEndDate(date)}
              dateFormat="dd-MM-yyyy"
              placeholderText="Select end date"
              className={styles["date"]}
            />
          </div>
                    <div>
                        <button
                            onClick={() => {
                              fetchData(startDate, endDate)
                              console.log("Data is ",data);
                            }}
                            className="bg-blue-500 text-white px-4 py-2 rounded flex items-center gap-2"
                        >
                            <FontAwesomeIcon icon={faMagnifyingGlass} />
                        </button>
                    </div>
        </div>
        {data.length == 0 &&
        <div>No data</div>
        }
        {data.length > 0 &&
        <div>
        <table className="table-auto w-full mt-5 border border-gray-300">
          <thead>
            <tr>
              <td className="border border-gray-300 text-left font-bold">Date</td>
              <td className="border border-gray-300 text-left font-bold">Doctor</td>
              <td className="border border-gray-300 text-left font-bold">Registration Fees</td>
              <td className="border border-gray-300 text-left font-bold">Test Fees</td>
              <td className="border border-gray-300 text-left font-bold">Total Fees</td>
            </tr>
          </thead>
          <tbody>
            {data.map((item, index) => (
              <tr key={index}>
                <td className="border border-gray-300">{item.Month}</td>
                <td className="border border-gray-300">{item.Doctor}</td>
                <td className="border border-gray-300">{item["Registration Fees"]}</td>
                <td className="border border-gray-300">{item["Test Fees"]}</td>
                <td className="border border-gray-300">{item["Total Fees"]}</td>
              </tr>
            ))}
          </tbody>
        </table>
                        <div className={styles["buttons"]}>
                            <button type="button" onClick={() => exportToExcel(data)} className={styles["save-btn"]}>Export</button>
                        </div>
        </div>
        }
      </div>
    </div>
  );
}

export default ReferralDocReport;
