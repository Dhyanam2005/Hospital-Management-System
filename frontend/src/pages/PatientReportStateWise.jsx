import React , { useEffect, useState } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import "./PatientReportStateWise.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faMagnifyingGlass } from "@fortawesome/free-solid-svg-icons";
import styles from "./ReportQueries.module.css";
import API_BASE_URL from './apiConfig';


function PatientReportStateWise(){
    const [data,setData] = useState([]);
    const [startDate, setStartDate] = useState(null);
    const [endDate, setEndDate] = useState(null);

        const fetchData = async (startDate,endDate) => {
            if(!startDate || !endDate){
                alert("Enter start date and end date")
                return;
            }
            try{
                let res = await fetch(`${API_BASE_URL}/patientReportStateWise?startDate=${startDate}&endDate=${endDate}`);
                const data = await res.json();
                if (res.ok) {
                    if (Array.isArray(data)) {
                        setData(data);
                    } else {
                        console.log("Expected an array but got:", data);
                        setData([]);
                    }
                } else {
                    console.log("Res is not ok");
                }
            }catch(err){
                console.err(err);
            }
        };
    return(
        <div>
            <div className="doctor-wise-reg-fees ml-[20%]">
                <h1 className="bold pt-5 text-xl text-left ml-5">Patient Report State Wise</h1>
                <div className="flex items-center gap-2 mb-5">
                    <div>
                        <label>Start Date :</label>
                        <DatePicker
                            selected = {startDate}
                            onChange = {(date) => setStartDate(date)}
                            dateFormat="dd-MM-yyyy"
                            placeholderText="Select start date"
                            className={styles["date"]}
                        />
                    </div>
                    <div>
                        <label>End Date :</label>
                        <DatePicker
                            selected = {endDate}
                            onChange = {(date) => setEndDate(date)}
                            dateFormat="dd-MM-yyyy"
                            placeholderText="Select end date"
                            className={styles["date"]}
                        />
                    </div>
                    <div>
                        <button
                            onClick={() => fetchData(startDate, endDate)}
                            className="bg-blue-500 text-white px-4 py-2 rounded flex items-center gap-2"
                        >
                            <FontAwesomeIcon icon={faMagnifyingGlass} />
                        </button>
                    </div>
                </div>
                {data.length > 0 &&
                <table className="table-auto w-full mt-5 border border-gray-300">
                    <thead>
                        <tr>
                            <td className="border border-gray-300 text-left font-bold">Month</td>
                            <td className="border border-gray-300 text-left font-bold">State</td>
                            <td className="border border-gray-300 text-left font-bold">City</td>
                            <td className="border border-gray-300 text-left font-bold">No of Patients</td>
                        </tr>
                    </thead>
                    <tbody>
                        {data.map((item,index) => (
                            <tr key={index}>
                                <td className="border border-gray-300">{item.Date}</td>
                                <td className="border border-gray-300">{item.State}</td>
                                <td className="border border-gray-300"> {item.City}</td>
                                <td className="border border-gray-300">{item["No of Patients"]}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                }
            </div>
        </div>
    )
}

export default PatientReportStateWise;