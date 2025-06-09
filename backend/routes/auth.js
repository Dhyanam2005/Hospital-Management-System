const express = require('express');
const jwt = require('jsonwebtoken');
const db = require("../config/db");
const bcrypt = require('bcryptjs');
const router = express.Router();
const nodemailer = require('nodemailer');

const SECRET_KEY = "your-secret-key";

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'jdhyanam@gmail.com',
    pass: 'ansy kflc ibwc zlqm'
  }
});

async function sendOtpEmail(toEmail, otp) {
  const mailOptions = {
    from: 'jdhyanam@gmail.com',
    to: toEmail,
    subject: 'Your OTP Code',
    text: `Your OTP code is ${otp}. It is valid for 5 minutes.`
  };

  await transporter.sendMail(mailOptions);
}

router.post("/login", async (req, res) => {
  const { user_name, password } = req.body;

  try {
    const result = await new Promise((resolve, reject) => {
      db.query("SELECT * FROM user WHERE user_name = ?", [user_name], (err, results) => {
        if (err){
          console.error(err);
          reject(err)
        }
        else resolve(results);
      });
    });

    if (result.length === 0) {
      return res.status(401).json({ message: "No user found" });
    }

    const user = result[0];

    if (user.lockout_until && new Date(user.lockout_until) > new Date()) {
      const waitMinutes = Math.ceil((new Date(user.lockout_until) - new Date()) / 60000);
      return res.status(403).json({ message: `Account locked. Try again in ${waitMinutes} minutes.` });
    }
    LOCK_TIME = 60000;

    const isPasswordValid = await bcrypt.compare(password, user.password);
    let failed_attempts = user.failed_attempts;
    let lockOut = null;
    if (!isPasswordValid) {
      failed_attempts++;
      if(failed_attempts >= 3){
        lockOut = new Date(Date.now() + 60*1000);
        failed_attempts = 0; 
      }
      console.log(failed_attempts);
      console.log(lockOut);
      await new Promise((resolve, reject) => {
        db.query(
          "UPDATE user SET failed_attempts = ?, lockout_until = ? WHERE user_id = ?",
          [failed_attempts, lockOut, user.user_id],
          (err, results) => {
            if (err) reject(err);
            else resolve(results);
          }
        );
      });
      return res.status(401).json({ message: failed_attempts === 0 ? `Account locked for ${LOCK_TIME / 60000} minutes due to too many failed attempts.` : "Invalid password" });
    }

      await new Promise((resolve, reject) => {
        db.query(
          "UPDATE user SET failed_attempts = ?, lockout_until = ? WHERE user_id = ?",
          [0, null, user.user_id],
          (err, results) => {
            if (err) reject(err);
            else resolve(results);
          }
        );
      });

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiry = new Date(Date.now() + 5 * 60 * 1000);

    await new Promise((resolve, reject) => {
      db.query(
        "UPDATE user SET otp = ?, otp_expiry = ? WHERE user_id = ?",
        [otp, otpExpiry, user.user_id],
        (err, results) => {
          if (err) reject(err);
          else resolve(results);
        }
      );
    });

    await sendOtpEmail(user.user_email, otp);

    res.json({ message: "OTP sent to your registered email", userId: user.user_id });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error occurred", error });
  }
});

router.post("/verify-otp", async (req, res) => {
  const { userId, otp } = req.body;

  if (!userId || !otp) {
    return res.status(400).json({ message: "userId and otp are required" });
  }

  try {
    const result = await new Promise((resolve, reject) => {
      db.query("SELECT * FROM user WHERE user_id = ?", [userId], (err, results) => {
        if (err) reject(err);
        else resolve(results);
      });
    });

    if (result.length === 0) {
      return res.status(401).json({ message: "User not found" });
    }

    const user = result[0];

    if (!user.otp || !user.otp_expiry) {
      return res.status(400).json({ message: "No OTP found. Please login again." });
    }

    if (new Date(user.otp_expiry) < new Date()) {
      return res.status(400).json({ message: "OTP expired. Please login again." });
    }

    if (user.otp !== otp) {
      return res.status(401).json({ message: "Invalid OTP" });
    }

    // OTP is valid: clear OTP fields
    await new Promise((resolve, reject) => {
      db.query(
        "UPDATE user SET otp = NULL, otp_expiry = NULL WHERE user_id = ?",
        [userId],
        (err, results) => {
          if (err) reject(err);
          else resolve(results);
        }
      );
    });

    // Generate JWT token
    const token = jwt.sign(
      { id: user.user_id, user_name: user.user_name, type: user.user_type },
      SECRET_KEY,
      { expiresIn: "1h" }
    );

    res.json({ token });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error occurred", error });
  }
});

module.exports = router;
