const express = require('express');
const db = require("../config/db");
const router = express.Router();
const multer = require('multer');
const xlsx = require('xlsx');

const upload = multer({ storage: multer.memoryStorage() });

router.post("/import",upload.single('file'),async(req,res) => {
    const fileBuffer = req.file.buffer;
    const workbook = xlsx.read(fileBuffer,{ type : "buffer"})
    const entity = req.body.entityType;
    console.log(entity)
    const sheetName = workbook.SheetNames[0];
    const data = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);
    // Duplicate Check
    const map = new Map()
    const set = new Set();
    const duplicate_errors = [];
    for(let i = 0;i < data.length;i++){
        set.add(data[i][entity])
        if(Object.keys(data[i][entity]).length)
        if(!data[i][entity]) continue
        if(map.has(data[i][entity])){
            duplicate_errors.push({
                row: i + 2,
                message: `Duplicate ${entity}: "${data[i][entity]}" (also seen at row ${map.get(data[i][entity])})`
            });
        }else{
            map.set(data[i][entity],i+2)
        }
    }
    if (duplicate_errors.length > 0) {
        const errorMessages = duplicate_errors.map(e => `Row ${e.row}: ${e.message}`).join('\n');
    }

    function checkExists(value) {
        return new Promise((resolve, reject) => {
            db.query(`SELECT COUNT(*) AS count FROM country WHERE country_name = ?`, [value], (err, results) => {
                if (err) return reject(err);
                resolve(results[0].count > 0);
            });
        });
    }

    await Promise.all(data.map(async (row, i) => {
        const exists = await checkExists(row[entity]);
        if (exists) {
            duplicate_errors.push({
                row: i + 2,
                message: `"${row[entity]}" exists in database`
            });
        }
    }));

    if (duplicate_errors.length > 0) {
        const errorMessages = duplicate_errors.map(e => `Row ${e.row}: ${e.message}`).join('\n');
        return res.status(400).json({ success: false, message: errorMessages });
    }

    errors = [];

    //Insert into database
    if(entity == "Country"){
        try{
            for(let row of data){
                await new Promise((resolve,reject) => {
                    db.query(`INSERT INTO country (country_name) VALUES (?)`,[row[entity]],(err,result1) => {
                        if(err) return reject(err)
                        resolve();
                    })
                })
            }
            return res.status(200).json({ success: true, message: "Data inserted successfully." });
        }catch(err){
            console.error(err)
            return res.status(500).json({ success: false, message: "Database insert error.", error: err });
        }
    }else if(entity == "Service"){
        try{
            for(let row of data){
                await new Promise((resolve,reject) => {
                    db.query(`INSERT INTO service (service_name) VALUES (?)`,[row[entity]],(err,result1) => {
                        if(err) return reject(err)
                        resolve();
                    })
                })
            }
            return res.status(200).json({ success: true, message: "Data inserted successfully." });
        }catch(err){
            console.error(err)
            return res.status(500).json({ success: false, message: "Database insert error.", error: err });
        }
} else if (entity == "State") {
    try {
        for (let row of data) {
            const countryName = row["Country"];
            const stateName = row["State"];

            const [country] = await new Promise((resolve, reject) => {
                db.query("SELECT country_id FROM country WHERE country_name = ?", [countryName], (err, results) => {
                    if (err) return reject(err);
                    resolve(results);
                });
            });

            if (!country) {
                errors.push({ row: row.__rowNum__, message: `Country '${countryName}' does not exist.` });
                continue;
            }

            const countryId = country.country_id;

            await new Promise((resolve, reject) => {
                db.query("INSERT INTO state (country_id, state_name) VALUES (?, ?)", [countryId, stateName], (err, result) => {
                    if (err) return reject(err);
                    resolve();
                });
            });
        }

        if (errors.length > 0) {
            const errorMessages = errors.map(e => `Row ${e.row}: ${e.message}`).join('\n');
            return res.status(400).json({ success: false, message: errorMessages });
        }

        return res.status(200).json({ success: true, message: "State data inserted successfully." });

    } catch (err) {
        console.error(err);
        return res.status(500).json({ success: false, message: "Database insert error.", error: err });
    }
} else if (entity === "City") {
    try {
        for (let row of data) {
            const stateName = row["State"];
            const cityName = row["City"];


            const [state] = await new Promise((resolve, reject) => {
                db.query("SELECT state_id FROM state WHERE state_name = ?", [stateName], (err, results) => {
                    if (err) return reject(err);
                    resolve(results);
                });
            });

            if (!state) {
                errors.push({ row: row.__rowNum__, message: `State '${stateName}' does not exist under Country '${countryName}'.` });
                continue;
            }

            const stateId = state.state_id;

            await new Promise((resolve, reject) => {
                db.query("INSERT INTO city (state_id, city_name) VALUES (?, ?)", [stateId, cityName], (err, result) => {
                    if (err) return reject(err);
                    resolve();
                });
            });
        }

        if (errors.length > 0) {
            const errorMessages = errors.map(e => `Row ${e.row}: ${e.message}`).join('\n');
            return res.status(400).json({ success: false, message: errorMessages });
        }

        return res.status(200).json({ success: true, message: "City data inserted successfully." });

    } catch (err) {
        console.error(err);
        return res.status(500).json({ success: false, message: "Database insert error.", error: err });
    }
}
else if(entity == "Test"){

}
})


module.exports = router