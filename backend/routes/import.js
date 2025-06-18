const express = require('express');
const db = require("../config/db");
const router = express.Router();
const multer = require('multer');
const xlsx = require('xlsx');

const upload = multer({ storage: multer.memoryStorage() });

router.post("/import", upload.single('file'), async (req, res) => {
    const fileBuffer = req.file.buffer;
    const workbook = xlsx.read(fileBuffer, { type: "buffer" });
    const entity = req.body.entityType;
    const sheetName = workbook.SheetNames[0];
    const data = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);

    const map = new Map();
    const set = new Set();
    const duplicate_errors = [];

    for (let i = 0; i < data.length; i++) {
        const row = data[i];
        set.add(data[i][entity]);
        const missingFields = Object.keys(row).filter(key => {
            return row[key] === undefined || row[key] === null || row[key].toString().trim() === '';
        });
        if (missingFields.length > 0) {
            duplicate_errors.push({
                row: i + 2,
                message: `Incomplete entries: missing ${missingFields.join(', ')}`
            });
        }
        if (map.has(data[i][entity])) {
            duplicate_errors.push({
                row: i + 2,
                message: `Duplicate ${entity}: "${data[i][entity]}" (also seen at row ${map.get(data[i][entity])})`
            });
        } else {
            map.set(data[i][entity], i + 2);
        }
    }

    const errors = [];

    if (entity === "Country") {
        function checkExistsCountry(value) {
            return new Promise((resolve, reject) => {
                db.query(`SELECT COUNT(*) AS count FROM country WHERE country_name = ?`, [value], (err, results) => {
                    if (err) return reject(err);
                    resolve(results[0].count > 0);
                });
            });
        }

        await Promise.all(data.map(async (row, i) => {
            const exists = await checkExistsCountry(row[entity]);
            if (exists) {
                duplicate_errors.push({
                    row: i + 2,
                    message: `"${row[entity]}" exists in database`
                });
            }
        }));
    }

    if (entity === "Service") {
        function checkExistsService(value) {
            return new Promise((resolve, reject) => {
                db.query(`SELECT COUNT(*) AS count FROM service WHERE service_name = ?`, [value], (err, results) => {
                    if (err) return reject(err);
                    resolve(results[0].count > 0);
                });
            });
        }

        await Promise.all(data.map(async (row, i) => {
            const exists = await checkExistsService(row[entity]);
            if (exists) {
                duplicate_errors.push({
                    row: i + 2,
                    message: `"${row[entity]}" exists in database`
                });
            }
        }));
    }

    if (entity === "State") {
        function checkExistsState(value) {
            return new Promise((resolve, reject) => {
                db.query(`SELECT COUNT(*) AS count FROM state WHERE state_name = ?`, [value], (err, results) => {
                    if (err) return reject(err);
                    resolve(results[0].count > 0);
                });
            });
        }

        await Promise.all(data.map(async (row, i) => {
            const exists = await checkExistsState(row["State"]);
            if (exists) {
                duplicate_errors.push({
                    row: i + 2,
                    message: `"${row["State"]}" exists in database`
                });
            }
        }));
    }

    if (entity === "City") {
        function checkExistsCity(value) {
            return new Promise((resolve, reject) => {
                db.query(`SELECT COUNT(*) AS count FROM city WHERE city_name = ?`, [value], (err, results) => {
                    if (err) return reject(err);
                    resolve(results[0].count > 0);
                });
            });
        }

        await Promise.all(data.map(async (row, i) => {
            const exists = await checkExistsCity(row["City"]);
            if (exists) {
                duplicate_errors.push({
                    row: i + 2,
                    message: `"${row["City"]}" exists in database`
                });
            }
        }));
    }

    if (entity === "Test") {
        function checkExistsTest(value) {
            return new Promise((resolve, reject) => {
                db.query(`SELECT COUNT(*) AS count FROM test WHERE test_name = ?`, [value], (err, results) => {
                    if (err) return reject(err);
                    resolve(results[0].count > 0);
                });
            });
        }

        await Promise.all(data.map(async (row, i) => {
            const exists = await checkExistsCity(row["Test"]);
            if (exists) {
                duplicate_errors.push({
                    row: i + 2,
                    message: `"${row["Test"]}" exists in database`
                });
            }
        }));
    }

    if (duplicate_errors.length > 0) {
        const errorMessages = duplicate_errors.map(e => `Row ${e.row}: ${e.message}`).join('\n');
        return res.status(400).json({ success: false, message: errorMessages });
    }

    if (entity === "Country") {
        try {
            for (let row of data) {
                await new Promise((resolve, reject) => {
                    db.query(`INSERT INTO country (country_name) VALUES (?)`, [row[entity]], (err) => {
                        if (err) return reject(err);
                        resolve();
                    });
                });
            }
            return res.status(200).json({ success: true, message: "Data inserted successfully." });
        } catch (err) {
            return res.status(500).json({ success: false, message: "Database insert error.", error: err });
        }
    } else if (entity === "Service") {
        try {
            for (let row of data) {
                await new Promise((resolve, reject) => {
                    db.query(`INSERT INTO service (service_name) VALUES (?)`, [row[entity]], (err) => {
                        if (err) return reject(err);
                        resolve();
                    });
                });
            }
            return res.status(200).json({ success: true, message: "Data inserted successfully." });
        } catch (err) {
            return res.status(500).json({ success: false, message: "Database insert error.", error: err });
        }
    } else if (entity === "State") {
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
                    db.query("INSERT INTO state (country_id, state_name) VALUES (?, ?)", [countryId, stateName], (err) => {
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
                    errors.push({ row: row.__rowNum__, message: `State '${stateName}' does not exist.` });
                    continue;
                }

                const stateId = state.state_id;

                await new Promise((resolve, reject) => {
                    db.query("INSERT INTO city (state_id, city_name) VALUES (?, ?)", [stateId, cityName], (err) => {
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
            return res.status(500).json({ success: false, message: "Database insert error.", error: err });
        }
    } else if(entity == "Test"){
        try {
            for (let row of data) {
                const {
                    Test,
                    Specimen,
                    Category,
                    ResultType,
                    RefValue,
                    RefFrom,
                    RefTo,
                    Unit,
                    Charge,
                    LongName
                } = row;

                let category_id = null;
                if (Category) {
                    const [category] = await new Promise((resolve, reject) => {
                        db.query("SELECT test_category_id FROM test_category WHERE test_category_name = ?", [Category], (err, results) => {
                            if (err) return reject(err);
                            resolve(results);
                        });
                    });

                    if (category) {
                        category_id = category.test_category_id;
                    } else {
                        errors.push({ row: row.__rowNum__, message: `Category '${Category}' does not exist.` });
                        continue;
                    }
                }

                await new Promise((resolve, reject) => {
                    db.query(
                        `INSERT INTO test (test_name, specimen_type, test_category_id, result_type, reference_value, reference_range_from, reference_range_to, test_unit, test_charge, test_long_name)
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                        [Test, Specimen || null, category_id, ResultType || null, RefValue || null, RefFrom || null, RefTo || null, Unit || null, Charge, LongName],
                        (err) => {
                            if (err) return reject(err);
                            resolve();
                        }
                    );
                });
            }

            if (errors.length > 0) {
                const errorMessages = errors.map(e => `Row ${e.row}: ${e.message}`).join('\n');
                return res.status(400).json({ success: false, message: errorMessages });
            }

            return res.status(200).json({ success: true, message: "Test data inserted successfully." });
        } catch (err) {
            return res.status(500).json({ success: false, message: "Database insert error.", error: err });
        }
    }
});

module.exports = router;
