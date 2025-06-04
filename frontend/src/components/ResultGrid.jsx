import React , { useEffect, useState} from "react";
import styles from "./ResultGrid.module.css";

function ResultGrid({ regId }){

    const [resultData , setResultData] = useState([]);

    useEffect(() => {
        const fetchResultData = async () => {
            try{
                let res = await fetch(`http://localhost:3000/resultData?regId=${regId}`);
                let data = await res.json();
                if(res.ok){
                    console.log("Data is filled" , data);
                    setResultData(data);
                }else{
                    console.log("Error fetching data");
                }
            }catch(err){
                console.log(regId)
                console.log("Error is ",err);
            }
        }

        fetchResultData();
    },[regId]);

    const submitResults = async () => {
        try{
            let res = await fetch('http://localhost:3000/result',{
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body:JSON.stringify({
                    regId,
                    results : resultData
                })
            })
            let data = res.json();
            if(res.ok){
                console.log("Submmited results successfully");
            }else{
                console.log("Error in submitting results");
            }
        }catch(error){
            console.err("Error in try of posting results");
        }
    }

    const handleResultChange = (index,value) => {
        const updated = [...resultData];
        if (updated[index].result_type === "P") {
            updated[index].result_char = value;
        } else {
            updated[index].result_num = value;
        }
        setResultData(updated);
    }

    return(
        <div>
            <h2 className="mx-auto text-center">Test for Registration Id : {regId}</h2>
            <table className="border border-gray-300 w-full">
                <thead className="border border-gray-300 bg-gray-100">
                    <tr className="border border-gray-300">
                        <td className="border border-gray-300 font-bold">Test Date</td>
                        <td className="border border-gray-300 font-bold">Test Name</td>
                        <td className="border border-gray-300 font-bold">Test Category</td>
                        <td className="border border-gray-300 font-bold">Range</td>
                        <td className="border border-gray-300 font-bold">Result</td>
                    </tr>
                </thead>
                <tbody>
                    {resultData.length === 0 && 
                        <div>
                            No entries are present
                        </div>
                    }
                    {resultData.length > 0 && 
                        resultData.map((res,index) => (
                            <tr key={index}>
                                <td className="border border-gray-300">{res.test_date}</td>
                                <td className="border border-gray-300">{res.test_name}</td>
                                <td className="border border-gray-300">{res.test_category_name}</td>
                                <td className="border border-gray-300">{res.reference_result || "-"}</td>
                                <td className="border border-gray-300">
                                    <input type="text" value={res.result_char || res.result_num} onChange={(e) => handleResultChange (index,e.target.value)}/>
                                </td>
                            </tr>
                        ))
                    }
                </tbody>
            </table>
            <div className={styles["buttons"]}>
                <button onClick={submitResults} className={styles["save-btn"]}>Save</button>
            </div>
        </div>
    )
}

export default ResultGrid;