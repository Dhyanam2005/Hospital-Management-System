'use strict';

/**
 * Shared helpers for LOGIN_AUDIT.
 * All functions are fire-and-forget — they never throw, never block a response.
 */

const db = require('../config/db');

function getClientIp(req) {
  return (req.headers['x-forwarded-for'] || '').split(',')[0].trim()
    || req.ip
    || (req.connection && req.connection.remoteAddress)
    || 'unknown';
}

/**
 * Insert a LOGIN_AUDIT record. Never awaited — errors are only logged.
 *
 * @param {object}  opts
 * @param {string}  opts.username
 * @param {*}       [opts.userId]        - null when user lookup failed
 * @param {string}  opts.status          - 'SUCCESS' | 'FAILED'
 * @param {string}  [opts.failureReason] - only for FAILED
 * @param {string}  [opts.sessionId]     - UUID generated at SUCCESS, used later for logout
 * @param {import('express').Request} opts.req
 */
function insertLoginAudit({ username, userId = null, status, failureReason = null, sessionId = null, req }) {
  const ip        = getClientIp(req);
  const userAgent = (req.headers['user-agent'] || '').slice(0, 512) || null;

  db.query(
    `INSERT INTO LOGIN_AUDIT
       (USER_ID, USERNAME, LOGIN_TIME, LOGIN_STATUS, FAILURE_REASON, IP_ADDRESS, USER_AGENT, SESSION_ID)
     VALUES (?, ?, NOW(), ?, ?, ?, ?, ?)`,
    [userId != null ? String(userId) : null, username, status, failureReason, ip, userAgent, sessionId],
    (err) => {
      if (err) console.error('[LoginAudit] insert failed:', err.message);
    }
  );
}

/**
 * Stamp LOGOUT_TIME on the SUCCESS record that matches sessionId.
 * Best-effort — errors are only logged.
 */
function updateLogoutTime(sessionId) {
  if (!sessionId) return;
  db.query(
    `UPDATE LOGIN_AUDIT
        SET LOGOUT_TIME = NOW()
      WHERE SESSION_ID = ?
        AND LOGIN_STATUS = 'SUCCESS'
        AND LOGOUT_TIME IS NULL`,
    [sessionId],
    (err) => {
      if (err) console.error('[LoginAudit] logout update failed:', err.message);
    }
  );
}

module.exports = { insertLoginAudit, updateLogoutTime };
