const express  = require('express');
const jwt      = require('jsonwebtoken');
const db       = require('../config/db');
const bcrypt   = require('bcryptjs');
const crypto   = require('crypto');
const router   = express.Router();
const nodemailer = require('nodemailer');
const { insertLoginAudit } = require('../utils/auditHelper');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_PASS,
  },
});

async function sendOtpEmail(toEmail, otp) {
  const mailOptions = {
    from: 'jdhyanam@gmail.com',
    to: toEmail,
    subject: 'Your OTP Code',
    text: `Your OTP code is ${otp}. It is valid for 5 minutes.`,
  };
  await transporter.sendMail(mailOptions);
}

/* ═══════════════════════════════════════════════════════════════════════════
   POST /login  — credential check + OTP dispatch
   ═══════════════════════════════════════════════════════════════════════════ */
router.post('/login', async (req, res) => {
  const { user_name, password } = req.body;

  try {
    const result = await new Promise((resolve, reject) => {
      db.query('SELECT * FROM user WHERE user_name = ?', [user_name], (err, results) => {
        if (err) reject(err); else resolve(results);
      });
    });

    if (result.length === 0) {
      insertLoginAudit({ username: user_name, status: 'FAILED', failureReason: 'User Not Found', req });
      return res.status(401).json({ message: 'No user found' });
    }

    const user = result[0];

    if (user.lockout_until && new Date(user.lockout_until) > new Date()) {
      const waitMinutes = Math.ceil((new Date(user.lockout_until) - new Date()) / 60000);
      insertLoginAudit({ username: user_name, userId: user.user_id, status: 'FAILED', failureReason: 'Account Locked', req });
      return res.status(403).json({ message: `Account locked. Try again in ${waitMinutes} minutes.` });
    }

    const LOCK_TIME = 60000;
    const isPasswordValid = await bcrypt.compare(password, user.password);
    let failed_attempts = user.failed_attempts;
    let lockOut = null;

    if (!isPasswordValid) {
      failed_attempts++;
      if (failed_attempts >= 3) {
        lockOut = new Date(Date.now() + LOCK_TIME);
        failed_attempts = 0;
      }
      await new Promise((resolve, reject) => {
        db.query(
          'UPDATE user SET failed_attempts = ?, lockout_until = ? WHERE user_id = ?',
          [failed_attempts, lockOut, user.user_id],
          (err, results) => { if (err) reject(err); else resolve(results); }
        );
      });
      insertLoginAudit({ username: user_name, userId: user.user_id, status: 'FAILED', failureReason: 'Invalid Password', req });
      return res.status(401).json({
        message: failed_attempts === 0
          ? `Account locked for ${LOCK_TIME / 60000} minutes due to too many failed attempts.`
          : 'Invalid password',
      });
    }

    // Password valid — reset counters
    await new Promise((resolve, reject) => {
      db.query(
        'UPDATE user SET failed_attempts = ?, lockout_until = ? WHERE user_id = ?',
        [0, null, user.user_id],
        (err, results) => { if (err) reject(err); else resolve(results); }
      );
    });

    const otp       = String(crypto.randomInt(100000, 1000000));
    const otpExpiry = new Date(Date.now() + 5 * 60 * 1000);

    await new Promise((resolve, reject) => {
      db.query(
        'UPDATE user SET otp = ?, otp_expiry = ? WHERE user_id = ?',
        [otp, otpExpiry, user.user_id],
        (err, results) => { if (err) reject(err); else resolve(results); }
      );
    });

    await sendOtpEmail(user.user_email, otp);

    res.json({
      message: 'OTP sent to your registered email',
      userId: user.user_id,
      password_expiry_days: user.password_expiry_days,
      updated_at: user.updated_at,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

/* ═══════════════════════════════════════════════════════════════════════════
   POST /verify-otp  — OTP validation + JWT issuance
   Audit SUCCESS is recorded here (JWT issued = session started).
   ═══════════════════════════════════════════════════════════════════════════ */
router.post('/verify-otp', async (req, res) => {
  const { userId, otp } = req.body;

  if (!userId || !otp) {
    return res.status(400).json({ message: 'userId and otp are required' });
  }

  try {
    const result = await new Promise((resolve, reject) => {
      db.query('SELECT * FROM user WHERE user_id = ?', [userId], (err, results) => {
        if (err) reject(err); else resolve(results);
      });
    });

    if (result.length === 0) {
      return res.status(401).json({ message: 'User not found' });
    }

    const user = result[0];

    if (!user.otp || !user.otp_expiry) {
      return res.status(400).json({ message: 'No OTP found. Please login again.' });
    }

    if (new Date(user.otp_expiry) < new Date()) {
      insertLoginAudit({ username: user.user_name, userId: user.user_id, status: 'FAILED', failureReason: 'OTP Expired', req });
      return res.status(400).json({ message: 'OTP expired. Please login again.' });
    }

    if (user.otp !== otp) {
      insertLoginAudit({ username: user.user_name, userId: user.user_id, status: 'FAILED', failureReason: 'Invalid OTP', req });
      return res.status(401).json({ message: 'Invalid OTP' });
    }

    // OTP valid — clear OTP fields
    await new Promise((resolve, reject) => {
      db.query(
        'UPDATE user SET otp = NULL, otp_expiry = NULL WHERE user_id = ?',
        [userId],
        (err, results) => { if (err) reject(err); else resolve(results); }
      );
    });

    // Generate session ID for audit trail (used to match logout later)
    const sessionId = crypto.randomUUID();

    // Record successful login (fire-and-forget — must not block token response)
    insertLoginAudit({ username: user.user_name, userId: user.user_id, status: 'SUCCESS', sessionId, req });

    // Fetch user's active role IDs
    const assignedRoles = await new Promise((resolve, reject) => {
      db.query(
        "SELECT ROLE_ID FROM urm_user_role_mapping WHERE USER_ID = ? AND STATUS = 'ACTIVE'",
        [userId],
        (err, rows) => { if (err) reject(err); else resolve(rows); }
      );
    });
    const roleIds = assignedRoles.map(r => r.ROLE_ID);

    // Determine superadmin: user's roles must cover ALL active menus
    let isSuperAdmin = false;
    if (roleIds.length > 0) {
      const coverageRows = await new Promise((resolve, reject) => {
        db.query(
          `SELECT
             (SELECT COUNT(*) FROM MENU_MASTER WHERE STATUS = 'ACTIVE') AS total_menus,
             COUNT(DISTINCT rmm.MENU_ID) AS user_menus
           FROM rmm_role_menu_mapping rmm
           WHERE rmm.ROLE_ID IN (?) AND rmm.STATUS = 'ACTIVE'`,
          [roleIds],
          (err, rows) => { if (err) reject(err); else resolve(rows); }
        );
      });
      const cov = coverageRows[0];
      isSuperAdmin = cov.total_menus > 0 && cov.user_menus >= cov.total_menus;
    }

    const token = jwt.sign(
      { id: user.user_id, user_name: user.user_name, isSuperAdmin, roles: roleIds },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({ token, isSuperAdmin, audit_session_id: sessionId });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

module.exports = router;
