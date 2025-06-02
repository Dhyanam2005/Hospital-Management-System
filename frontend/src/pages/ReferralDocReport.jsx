import React , { useEffect, useState } from "react";
import NavBar from "../components/SidebarMenu"
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { format } from "date-fns";
import "./PatientReportStateWise.css";

function ReferralDocReport
(){
    const [data,setData] = useState([]);
    const [filteredData, setFilteredData] = useState([]);
    const [startDate, setStartDate] = useState(null);
    const [endDate, setEndDate] = useState(null);

    useEffect(() => {
        const fetchData = async () => {
            try{
                let res = await fetch('http://localhost:3000/referralDoc');
                const data = await res.json();
                if(res.ok){
                    setData(data);
                    console.log(data);
                }else{
                    console.log("Res is not ok");
                }
            }catch(err){
                console.err(err);
            }
        };
        fetchData();
    },[]);

    useEffect(() => {
        if(!startDate || !endDate){
            setFilteredData(data);
            return;
        }

        const filtered = data.filter((item) => {
            const itemDate = item["Month"];
            console.log(format(startDate, "dd MM yyyy"));
            console.log(format(endDate, "dd MM yyyy"));
            console.log(itemDate);
            return itemDate >= format(startDate, "dd MM yyyy") && itemDate <= format(endDate, "dd MM yyyy");
        })
        setFilteredData(filtered);
        console.log("Filtered data is as below")
        console.log(filtered);
    },[startDate,endDate,data]);

    return(
        <div>
            <div className="doctor-wise-reg-fees ml-[20%]">
                <h1 className="bold text-center block pt-5 text-2xl">Referral Doctor Summary</h1>
                <div className="flex items-center gap-4 mb-5">
                    <div>
                        <label>Start Date :</label>
                        <DatePicker
                            selected = {startDate}
                            onChange = {(date) => setStartDate(date)}
                            dateFormat="dd-MM-yyyy"
                            placeholderText="Select start date"
                        />
                    </div>
                    <div>
                        <label>End Date :</label>
                        <DatePicker
                            selected = {endDate}
                            onChange = {(date) => setEndDate(date)}
                            dateFormat="dd-MM-yyyy"
                            placeholderText="Select end date"
                        />
                    </div>
                </div>
                <table className="table-auto w-full mt-5">
                    <thead>
                        <tr>
                            <td>Date</td>
                            <td>Doctor</td>
                            <td>Registration Fees</td>
                            <td>Test Fees</td>
                            <td>Total Fees</td>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredData.map((item,index) => (
                            <tr key={index}>
                                <td>{item["Month"]}</td>
                                <td>{item["Doctor"]}</td>
                                <td>{item["Registration Fees"]}</td>
                                <td>{item["Test Fees"]}</td>
                                <td>{item["Total Fees"]}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    )
}

export default ReferralDocReport
;