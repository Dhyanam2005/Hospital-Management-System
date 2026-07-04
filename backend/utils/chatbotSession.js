'use strict';

/**
 * In-memory chatbot session store.
 *
 * Sessions are keyed by a random UUID that is embedded inside a short-lived
 * JWT.  Invalidating a session just removes it from the Map; the JWT may
 * still be cryptographically valid but the missing Map entry causes the
 * middleware to reject it.
 *
 * Sessions expire automatically after INACTIVITY_MS ms of silence and are
 * also destroyed when the chatbot window calls POST /api/chatbot/session/close.
 */

const jwt    = require('jsonwebtoken');
const crypto = require('crypto');

const CHATBOT_SECRET  = 'chatbot-hms-session-secret-2026';
const INACTIVITY_MS   = 15 * 60 * 1000;   // 15 minutes
const JWT_TTL         = '2h';

/** @type {Map<string, Object>} sessionId -> session object */
const sessions = new Map();

/**
 * Create a new session for an identified patient.
 * @returns {string} chatbot JWT
 */
function createSession(patientId, patientName) {
  const sessionId = crypto.randomUUID();

  sessions.set(sessionId, {
    patientId,
    patientName,
    stage: 'IDLE',               // IDLE | BOOKING_DOCTOR | BOOKING_DATE | BOOKING_SLOT | BOOKING_CONFIRM
                                 //       | RESCHEDULE_SELECT | RESCHEDULE_DATE | RESCHEDULE_SLOT | RESCHEDULE_CONFIRM
                                 //       | CANCEL_SELECT | CANCEL_CONFIRM
    pendingDoctorId:   null,
    pendingDoctorName: null,
    pendingDate:       null,
    pendingSlot:       null,
    pendingSlotList:   null,
    pendingList:       [],       // numbered list shown to user (doctors / appointments)
    pendingAppointmentId: null,
    lastActivity: Date.now(),
  });

  return jwt.sign(
    { type: 'chatbot', patientId, sessionId },
    CHATBOT_SECRET,
    { expiresIn: JWT_TTL }
  );
}

/**
 * Verify a chatbot JWT and return the live session, or null if invalid.
 */
function verifySession(token) {
  try {
    const decoded = jwt.verify(token, CHATBOT_SECRET);
    if (decoded.type !== 'chatbot') return null;

    const session = sessions.get(decoded.sessionId);
    if (!session) return null;

    // Refresh inactivity timer
    session.lastActivity = Date.now();

    return { session, sessionId: decoded.sessionId, patientId: decoded.patientId };
  } catch {
    return null;
  }
}

/**
 * Destroy a session (called on window close or explicit logout).
 */
function deleteSession(token) {
  try {
    const decoded = jwt.verify(token, CHATBOT_SECRET, { ignoreExpiration: true });
    if (decoded?.sessionId) sessions.delete(decoded.sessionId);
  } catch { /* ignore */ }
}

// Sweep expired sessions every 5 minutes (.unref() so it doesn't block exit)
setInterval(() => {
  const cutoff = Date.now() - INACTIVITY_MS;
  for (const [id, sess] of sessions.entries()) {
    if (sess.lastActivity < cutoff) sessions.delete(id);
  }
}, 5 * 60 * 1000).unref();

module.exports = { createSession, verifySession, deleteSession };
