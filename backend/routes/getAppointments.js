const express = require('express');
const router = express.Router();
const db = require("../config/db");
const nodemailer = require('nodemailer');
const { authenticateJWT } = require("./authenticateJWT");

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'jdhyanam@gmail.com',
    pass: 'ansy kflc ibwc zlqm'
  }
});

async function sendAppointmentEmail(toEmail, doctorName, appointmentTime, appointmentDate) {
  const mailOptions = {
    from: 'jdhyanam@gmail.com',
    to: toEmail,
    subject: 'Appointment Confirmation',
    text: `Your appointment has been booked with Dr. ${doctorName} on ${appointmentDate} at ${appointmentTime}.`,
  };

  await transporter.sendMail(mailOptions);
}


router.get("/appointmentlist",(req,res) => {
    let {doc_id,appointment_date} = req.query;
    console.log("Doc id is ",doc_id," Appointment id is",appointment_date);
    db.query(
        `WITH RECURSIVE time_slots AS (
          SELECT 
              da.doc_id,
              da.day_of_week,
              da.available_from AS slot,
              da.available_to,
              da.slot_duration_min,
              da.available_from AS start_time
          FROM doctor_availability da
          WHERE da.doc_id = ? AND da.day_of_week = DAYNAME(?)

          UNION ALL

          SELECT 
              ts.doc_id,
              ts.day_of_week,
              ADDTIME(ts.slot, SEC_TO_TIME(ts.slot_duration_min * 60)),
              ts.available_to,
              ts.slot_duration_min,
              ts.start_time
          FROM time_slots ts
          WHERE ADDTIME(ts.slot, SEC_TO_TIME(ts.slot_duration_min * 60)) <= ts.available_to
      )

      SELECT 
          ts.slot AS appointment_time,
          a.APPOINTMENT_ID,
          p.name AS patient_name,
          p.patient_id
      FROM time_slots ts
      LEFT JOIN appointment a 
          ON a.APPOINTMENT_TIME = ts.slot
          AND a.APPOINTMENT_DATE = ?
          AND a.DOCTOR_ID = ts.doc_id
      LEFT JOIN patient p 
          ON a.PATIENT_ID = p.PATIENT_ID
      ORDER BY ts.slot;
`,
        [doc_id,appointment_date,appointment_date],(err,result) => {
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

    // Send appointment confirmation email
    async function sendAppointmentEmail(toEmail, doctorName, appointmentTime, appointmentDate) {
      const mailOptions = {
        from: 'jdhyanam@gmail.com',
        to: toEmail,
        subject: 'Appointment Confirmation',
        text: `Your appointment has been booked with Dr. ${doctorName} on ${appointmentDate} at ${appointmentTime}.`,
      };

      await transporter.sendMail(mailOptions);
    }

    // INSERT new appointments
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
              db.query(
                `SELECT p.email AS patient_email, d.name AS doctor_name 
                 FROM patient p, doctor d 
                 WHERE p.patient_id = ? AND d.doc_id = ?`,
                [a.patient_id, selectedDoctor],
                async (err2, result2) => {
                  if (err2) {
                    console.error("Error fetching email:", err2);
                    return resolve();
                  }

                  const { patient_email, doctor_name } = result2[0];
                  try {
                    await sendAppointmentEmail(patient_email, doctor_name, a.appointment_time, selectedDate);
                    console.log(`Email sent to ${patient_email}`);
                  } catch (emailErr) {
                    console.error("Failed to send email:", emailErr);
                  }

                  resolve(result);
                }
              );
            }
          }
        );
      });
    });

    // UPDATE existing appointments
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
              db.query(
                `SELECT p.email AS patient_email, d.name AS doctor_name 
                 FROM patient p, doctor d 
                 WHERE p.patient_id = ? AND d.doc_id = ?`,
                [a.patient_id, selectedDoctor],
                async (err2, result2) => {
                  if (err2) {
                    console.error("Error fetching email:", err2);
                    return resolve();
                  }

                  const { patient_email, doctor_name } = result2[0];
                  try {
                    await sendAppointmentEmail(patient_email, doctor_name, a.appointment_time, selectedDate);
                    console.log(`Email sent to ${patient_email}`);
                  } catch (emailErr) {
                    console.error("Failed to send email:", emailErr);
                  }

                  resolve(result);
                }
              );
            }
          }
        );
      });
    });

    // Execute all inserts and updates
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