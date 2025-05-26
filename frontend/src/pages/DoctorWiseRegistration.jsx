import React , { useEffect, useState } from "react";
import NavBar from "../components/Navbar"
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { format } from "date-fns";
import "./DoctorWiseRegistration.css";

function DoctorWiseRegistration(){
    const [data,setData] = useState([]);
    const [filteredData, setFilteredData] = useState([]);
    const [startDate, setStartDate] = useState(null);
    const [endDate, setEndDate] = useState(null);

    useEffect(() => {
        const fetchData = async () => {
            try{
                let res = await fetch('http://localhost:3000/doctorWiseRegistrationFees');
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
            const itemDate = item.Date;
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
            <NavBar />
            <div className="doctor-wise-reg-fees">
                <h1 className="bold text-center block pt-5 text-2xl">Doctor Wise Registration Fees</h1>
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
                            <td>No of Patients</td>
                            <td>Total Fee Collected</td>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredData.map((item,index) => (
                            <tr key={index}>
                                <td>{item.Date}</td>
                                <td>{item.Doctor}</td>
                                <td>{item["No of Patients"]}</td>
                                <td>{item["Total Fee Collected"]}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    )
}

export default DoctorWiseRegistration;