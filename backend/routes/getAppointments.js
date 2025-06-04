const express = require('express');
const router = express.Router();
const db = require("../config/db");
const { authenticateJWT } = require("./authenticateJWT");

router.get("/appointmentlist",(req,res) => {
    let {doc_id,appointment_date} = req.query;
    console.log("Doc id is ",doc_id," Appointment id is",appointment_date);
    db.query(
        `WITH RECURSIVE time_slots AS (
        SELECT TIME('09:00:00') AS slot
        UNION ALL
        SELECT ADDTIME(slot, '00:30:00')
        FROM time_slots
        WHERE slot < '17:30:00' 
        )
SELECT 
    ts.slot AS appointment_time,
    a.APPOINTMENT_ID,
    p.name AS patient_name,
    p.patient_id as patient_id
FROM time_slots ts
LEFT JOIN appointment a 
    ON a.APPOINTMENT_TIME = ts.slot
    AND a.APPOINTMENT_DATE = ?  
    AND a.DOCTOR_ID = ?                
LEFT JOIN patient p 
    ON a.PATIENT_ID = p.PATIENT_ID
ORDER BY ts.slot`,
        [appointment_date,doc_id],(err,result) => {
            if(err) return res.json({ message : "Error in getting appointments"});
            res.json(result);
        }
    )
})

router.post("/appointment", authenticateJWT, async (req, res) => {
   console.log("Request Body:", req.body);
  console.log("Called");
  try {
    const { appointment, selectedDoctor, selectedDate } = req.body;
    const userId = req.user.id;

    console.log("Appointment", appointment, "SelectDate", selectedDate, " selectdoc", selectedDoctor, " userid", userId);

    const appointmentsArr = appointment || [];

    const newAppointments = appointmentsArr.filter(a => a.APPOINTMENT_ID === null && a.patient_id !== null);
    console.log("New Appointments:", newAppointments);

    const newAppointmentsPromises = newAppointments.map(a => {
      return new Promise((resolve, reject) => {
        db.query(
          `INSERT INTO appointment
           (patient_id, doctor_id, appointment_date, appointment_time, user_id)
           VALUES (?, ?, ?, ?, ?)`,
          [a.patient_id, selectedDoctor, selectedDate, a.appointment_time, userId],
          (err, result) => {
            if (err) {
              console.error("Insert Error:", err);
              reject(err);
            } else {
              resolve(result);
            }
          }
        );
      });
    });

    const updateAppointments = appointmentsArr.filter(a => a.APPOINTMENT_ID !== null && a.patient_id !== null);
    console.log("Update Appointments:", updateAppointments);

    const updateAppointmentsPromises = updateAppointments.map(a => {
      return new Promise((resolve, reject) => {
        db.query(
          `UPDATE appointment
           SET patient_id = ?,
               doctor_id = ?,
               appointment_date = ?,
               appointment_time = ?,
               user_id = ?
           WHERE appointment_id = ?`,
          [a.patient_id, selectedDoctor, selectedDate, a.appointment_time, userId, a.APPOINTMENT_ID],
          (err, result) => {
            if (err) {
              console.error("Update Error:", err);
              reject(err);
            } else {
              resolve(result);
            }
          }
        );
      });
    });

    await Promise.all([...newAppointmentsPromises, ...updateAppointmentsPromises]);

    res.json({ message: "All data saved successfully" });
  } catch (err) {
    console.error("Error is ", err);
    res.status(500).json({ message: "Internal Server Error" });
  }
});


router.delete("/appointment/:id",(req,res) => {
    let id = req.params.id;
    console.log(id);
    if(id !== null){
        db.query(
            `DELETE FROM appointment where appointment_id = ?`,[id],(err,result) => {
                if(err) return res.json({ message : "Not able to delete" });
                return res.json(result);
            }
        )
    }
})

module.exports = router;