'use strict';

const express = require('express');
const router  = express.Router();
const db      = require('../config/db');
const { authenticateJWT } = require('./authenticateJWT');
const { updateLogoutTime } = require('../utils/auditHelper');

/* ─── GET /api/login-audit ─────────────────────────────────────────────────
   Query params: page, pageSize, dateFrom, dateTo, username, status
   Returns:      { rows: [...], total: N }
   ─────────────────────────────────────────────────────────────────────────── */
router.get('/api/login-audit', authenticateJWT, (req, res) => {
  const page     = Math.max(0, parseInt(req.query.page     || '0'));
  const pageSize = Math.min(500, Math.max(1, parseInt(req.query.pageSize || '25')));
  const offset   = page * pageSize;

  const { dateFrom, dateTo, username, status } = req.query;
  const conditions = [];
  const params     = [];

  if (dateFrom) { conditions.push('LOGIN_TIME >= ?'); params.push(dateFrom + ' 00:00:00'); }
  if (dateTo)   { conditions.push('LOGIN_TIME <= ?'); params.push(dateTo   + ' 23:59:59'); }
  if (username) { conditions.push('USERNAME LIKE ?'); params.push(`%${username}%`); }
  if (status && (status === 'SUCCESS' || status === 'FAILED')) {
    conditions.push('LOGIN_STATUS = ?');
    params.push(status);
  }

  const where = conditions.length ? 'WHERE ' + conditions.join(' AND ') : '';

  db.query(
    `SELECT COUNT(*) AS total FROM LOGIN_AUDIT ${where}`,
    params,
    (err, countRows) => {
      if (err) {
        console.error('/api/login-audit count error:', err);
        return res.status(500).json({ error: 'Database error.' });
      }

      const total = countRows[0].total;

      db.query(
        `SELECT AUDIT_ID, USER_ID, USERNAME,
                DATE_FORMAT(LOGIN_TIME,  '%Y-%m-%dT%H:%i:%s') AS LOGIN_TIME,
                DATE_FORMAT(LOGOUT_TIME, '%Y-%m-%dT%H:%i:%s') AS LOGOUT_TIME,
                LOGIN_STATUS, FAILURE_REASON, IP_ADDRESS, USER_AGENT,
                SESSION_ID,
                DATE_FORMAT(CREATED_DATE, '%Y-%m-%dT%H:%i:%s') AS CREATED_DATE
         FROM LOGIN_AUDIT
         ${where}
         ORDER BY LOGIN_TIME DESC
         LIMIT ? OFFSET ?`,
        [...params, pageSize, offset],
        (err2, rows) => {
          if (err2) {
            console.error('/api/login-audit data error:', err2);
            return res.status(500).json({ error: 'Database error.' });
          }
          res.json({ rows, total });
        }
      );
    }
  );
});

/* ─── POST /api/login-audit/logout ─────────────────────────────────────────
   Body: { sessionId }
   Called by the frontend on logout (best-effort; no auth required so it can
   fire even after the JWT is cleared from localStorage).
   ─────────────────────────────────────────────────────────────────────────── */
router.post('/api/login-audit/logout', (req, res) => {
  const { sessionId } = req.body;
  if (!sessionId) return res.status(400).json({ error: 'sessionId required.' });
  updateLogoutTime(sessionId);
  res.json({ message: 'Logout recorded.' });
});

module.exports = router;
