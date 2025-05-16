import React , { useEffect, useState} from "react";
import "./ResultGrid.css";

function ResultGrid({ regId }){

    const [resultData , setResultData] = useState([]);
    useEffect(() => {
        const fetchResultData = async () => {
            try{
                let res = await fetch(`http://localhost:3000/resultData?regId=${regId}`);
                let data = await res.json();
                if(res.ok){
                    console.log("Data is filled" , data);
                    let dataWithResultEditable = data.map(row => ({...row,result : ""}));
                    setResultData(dataWithResultEditable);
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
        updated[index].result = value;
        setResultData(updated);
    }

    return(
        <div>
            <h2 className="mx-auto bold text-center pt-4">Test for Registration Id : {regId}</h2>
            <table>
                <thead>
                    <tr>
                        <td>Test Name</td>
                        <td>Test Category</td>
                        <td>Result Type</td>
                        <td>Range</td>
                        <td>Result</td>
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
                                <td>{res.test_name}</td>
                                <td>{res.test_category_name}</td>
                                <td>{res.result_type}</td>
                                <td>{res.reference_result || "-"}</td>
                                <td>
                                    <input type="text" value={res.result} onChange={(e) => handleResultChange (index,e.target.value)}/>
                                </td>
                            </tr>
                        ))
                    }
                </tbody>
            </table>
            <button onClick={submitResults} className="pt-5 pb-5  submit-results-btn mx-auto block text-center">Submit Results</button>
        </div>
    )
}

export default ResultGrid;