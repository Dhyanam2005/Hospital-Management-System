'use strict';

/**
 * chatbot.js
 *
 * All chatbot endpoints + the full server-side conversation state machine.
 * Entry point: POST /api/chatbot/identify (no session needed)
 * All other routes require a valid chatbot session JWT (Bearer token).
 * No HMS login session is used anywhere in this file.
 */

const express = require('express');
const router  = express.Router();
const db      = require('../config/db');
const { createSession, verifySession, deleteSession } = require('../utils/chatbotSession');
const { authenticateJWT } = require('./authenticateJWT');

/* ═══════════════════════════════════════════════════════════════════════════
   UTILITY / PURE HELPER FUNCTIONS
   ═══════════════════════════════════════════════════════════════════════════ */

const pad = n => String(n).padStart(2, '0');

function toDateStr(d) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function toDisplayDate(dateStr) {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-IN', {
    weekday: 'long', day: '2-digit', month: 'long', year: 'numeric',
  });
}

/** Extract yyyy-MM-dd from natural language. Returns null if not found. */
function extractDate(text) {
  const lower = text.toLowerCase();
  const today = new Date(); today.setHours(0, 0, 0, 0);

  if (/\btoday\b/.test(lower))         return toDateStr(today);
  if (/\btomorrow\b/.test(lower))      { const d = new Date(today); d.setDate(d.getDate()+1); return toDateStr(d); }
  if (/\bday after tomorrow\b/.test(lower)) { const d = new Date(today); d.setDate(d.getDate()+2); return toDateStr(d); }

  const dnames = ['sunday','monday','tuesday','wednesday','thursday','friday','saturday'];
  for (let i = 0; i < dnames.length; i++) {
    if (lower.includes(dnames[i])) {
      const d = new Date(today);
      const diff = (i - d.getDay() + 7) % 7 || 7;
      d.setDate(d.getDate() + diff);
      return toDateStr(d);
    }
  }

  const iso = text.match(/\b(\d{4}-\d{2}-\d{2})\b/);
  if (iso) return iso[1];

  const dmy = text.match(/\b(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})\b/);
  if (dmy) return `${dmy[3]}-${dmy[2].padStart(2,'0')}-${dmy[1].padStart(2,'0')}`;

  const months = ['january','february','march','april','may','june',
                  'july','august','september','october','november','december'];
  for (let mi = 0; mi < months.length; mi++) {
    const re1 = new RegExp(`(\\d{1,2})(?:st|nd|rd|th)?\\s+${months[mi]}(?:\\s+(\\d{4}))?`, 'i');
    const re2 = new RegExp(`${months[mi]}\\s+(\\d{1,2})(?:st|nd|rd|th)?(?:\\s+(\\d{4}))?`, 'i');
    let m;
    if ((m = lower.match(re1)) || (m = lower.match(re2))) {
      const day  = parseInt(m[1]);
      const year = parseInt(m[2]) || today.getFullYear();
      return `${year}-${pad(mi + 1)}-${pad(day)}`;
    }
  }

  return null;
}

/** Extract HH:mm from natural language. Returns null if not found. */
function extractTime(text) {
  const hhmm = text.match(/\b(\d{1,2}):(\d{2})\b/);
  if (hhmm) return `${pad(parseInt(hhmm[1]))}:${hhmm[2]}`;

  const ampm = text.match(/\b(\d{1,2})\s*(am|pm)\b/i);
  if (ampm) {
    let h = parseInt(ampm[1]);
    if (/pm/i.test(ampm[2]) && h < 12) h += 12;
    if (/am/i.test(ampm[2]) && h === 12) h = 0;
    return `${pad(h)}:00`;
  }
  return null;
}

function extractTimePeriod(text) {
  const t = text.toLowerCase();
  if (/morning/.test(t))   return 'MORNING';
  if (/afternoon/.test(t)) return 'AFTERNOON';
  if (/evening/.test(t))   return 'EVENING';
  return null;
}

function filterByPeriod(slots, period) {
  return slots.filter(s => {
    const h = parseInt(s.split(':')[0]);
    if (period === 'MORNING')   return h >= 5  && h < 12;
    if (period === 'AFTERNOON') return h >= 12 && h < 17;
    if (period === 'EVENING')   return h >= 17 && h <= 21;
    return true;
  });
}

function parseNum(text, max) {
  const n = parseInt(text.trim());
  return (!isNaN(n) && n >= 1 && n <= max) ? n : null;
}

/* ─── Slot generation (reuses same CTE pattern as existing getAppointments.js) */
function getSlots(docId, dateStr) {
  return new Promise((resolve, reject) => {
    const isToday = dateStr === toDateStr(new Date());
    const sql = `
      WITH RECURSIVE ts AS (
        SELECT da.available_from AS slot, da.available_to, da.slot_duration_min
        FROM doctor_availability da
        WHERE da.doc_id = ? AND da.day_of_week = DAYNAME(?)
        UNION ALL
        SELECT ADDTIME(ts.slot, SEC_TO_TIME(ts.slot_duration_min * 60)),
               ts.available_to, ts.slot_duration_min
        FROM ts
        WHERE ADDTIME(ts.slot, SEC_TO_TIME(ts.slot_duration_min * 60)) <= ts.available_to
      )
      SELECT TIME_FORMAT(ts.slot, '%H:%i') AS slot
      FROM ts
      WHERE ts.slot NOT IN (
        SELECT a.APPOINTMENT_TIME FROM appointment a
        WHERE a.DOCTOR_ID = ? AND a.APPOINTMENT_DATE = ? AND a.status = 'BOOKED'
      )
      ${isToday ? 'AND ts.slot > CURTIME()' : ''}
      ORDER BY ts.slot
    `;
    db.query(sql, [docId, dateStr, docId, dateStr], (err, rows) => {
      if (err) return reject(err);
      resolve(rows.map(r => r.slot));
    });
  });
}

function nextAvailableDate(docId, fromDateStr) {
  return new Promise(resolve => {
    db.query(
      'SELECT DISTINCT day_of_week FROM doctor_availability WHERE doc_id = ?',
      [docId],
      (err, rows) => {
        if (err || !rows.length) return resolve(null);
        const avail = rows.map(r => r.day_of_week); // e.g. ['Monday','Wednesday']
        const dayNames = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
        const start = new Date(fromDateStr + 'T00:00:00');
        for (let i = 1; i <= 14; i++) {
          const d = new Date(start); d.setDate(d.getDate() + i);
          if (avail.includes(dayNames[d.getDay()])) return resolve(toDateStr(d));
        }
        resolve(null);
      }
    );
  });
}

/* ─── Core booking (transactional, race-condition safe) */
function bookSlot(patientId, docId, dateStr, timeStr) {
  return new Promise((resolve, reject) => {
    db.beginTransaction(err => {
      if (err) return reject(err);

      // Re-check availability inside the transaction (close race condition)
      db.query(
        `SELECT COUNT(*) AS cnt FROM appointment
         WHERE DOCTOR_ID = ? AND APPOINTMENT_DATE = ? AND APPOINTMENT_TIME = ? AND status = 'BOOKED'`,
        [docId, dateStr, timeStr],
        async (err, rows) => {
          if (err) return db.rollback(() => reject(err));

          if (rows[0].cnt > 0) {
            return db.rollback(async () => {
              const fresh = await getSlots(docId, dateStr).catch(() => []);
              resolve({ conflict: true, message: 'This slot was just taken. Please choose another.', slots: fresh });
            });
          }

          // Check duplicate booking for same patient
          db.query(
            `SELECT COUNT(*) AS cnt FROM appointment
             WHERE PATIENT_ID = ? AND DOCTOR_ID = ? AND APPOINTMENT_DATE = ? AND APPOINTMENT_TIME = ? AND status = 'BOOKED'`,
            [patientId, docId, dateStr, timeStr],
            (err2, r2) => {
              if (err2) return db.rollback(() => reject(err2));
              if (r2[0].cnt > 0) {
                return db.rollback(() => resolve({
                  conflict: true,
                  message: 'You already have a booking with this doctor at this time.',
                  slots: [],
                }));
              }

              db.query(
                `INSERT INTO appointment (PATIENT_ID, DOCTOR_ID, APPOINTMENT_DATE, APPOINTMENT_TIME, USER_ID, status)
                 VALUES (?, ?, ?, ?, NULL, 'BOOKED')`,
                [patientId, docId, dateStr, timeStr],
                (err3, result) => {
                  if (err3) return db.rollback(() => reject(err3));
                  db.commit(errC => {
                    if (errC) return db.rollback(() => reject(errC));
                    db.query('SELECT name FROM doctor WHERE doc_id = ?', [docId], (e, r) => {
                      resolve({
                        conflict: false,
                        appointmentId: result.insertId,
                        docName: r?.[0]?.name || 'Doctor',
                        date: dateStr, time: timeStr, status: 'BOOKED',
                      });
                    });
                  });
                }
              );
            }
          );
        }
      );
    });
  });
}

/* ═══════════════════════════════════════════════════════════════════════════
   SESSION MIDDLEWARE
   ═══════════════════════════════════════════════════════════════════════════ */

function requireChatbotSession(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Chatbot session token required.' });
  }
  const result = verifySession(auth.slice(7));
  if (!result) return res.status(401).json({ error: 'Invalid or expired chatbot session.' });
  req.chatbot = result;
  next();
}

/* ═══════════════════════════════════════════════════════════════════════════
   4.1  POST /api/chatbot/identify
   ═══════════════════════════════════════════════════════════════════════════ */
router.post('/api/chatbot/identify', authenticateJWT, (req, res) => {
  const { patientId, phone } = req.body;
  if (!patientId && !phone) {
    return res.status(400).json({ error: 'Provide patientId or phone.' });
  }

  const sql    = patientId
    ? 'SELECT patient_id, name FROM patient WHERE patient_id = ?'
    : 'SELECT patient_id, name FROM patient WHERE phone = ?';
  const params = [patientId || phone];

  db.query(sql, params, (err, rows) => {
    if (err) {
      console.error('/api/chatbot/identify:', err);
      return res.status(500).json({ error: 'Database error.' });
    }

    if (rows.length === 0) {
      return res.json({ matchCount: 0, message: 'No matching patient found.' });
    }

    if (rows.length === 1) {
      const token = createSession(rows[0].patient_id, rows[0].name);
      return res.json({
        matchCount: 1,
        patientId: rows[0].patient_id,
        name: rows[0].name,
        chatbotSessionToken: token,
      });
    }

    // Multiple patients on the same phone
    return res.json({
      matchCount: rows.length,
      requiresPatientSelection: true,
      patients: rows.map(r => ({ patientId: r.patient_id, name: r.name })),
    });
  });
});

/* ═══════════════════════════════════════════════════════════════════════════
   4.8  POST /api/chatbot/session/close
   ═══════════════════════════════════════════════════════════════════════════ */
router.post('/api/chatbot/session/close', (req, res) => {
  const auth = req.headers.authorization;
  if (auth?.startsWith('Bearer ')) deleteSession(auth.slice(7));
  res.json({ message: 'Session closed.' });
});

/* ═══════════════════════════════════════════════════════════════════════════
   MAIN CONVERSATION ENDPOINT
   POST /api/chatbot/message  — receives free-text, returns structured reply
   ═══════════════════════════════════════════════════════════════════════════ */
router.post('/api/chatbot/message', requireChatbotSession, async (req, res) => {
  const { message } = req.body;
  if (!message?.trim()) return res.json({ reply: 'Please type a message.', type: 'text' });

  const { session } = req.chatbot;
  try {
    const response = await processMessage(session, message.trim());
    return res.json({ ...response, stage: session.stage });
  } catch (err) {
    console.error('/api/chatbot/message:', err);
    return res.json({ reply: 'Something went wrong. Please try again.', type: 'text' });
  }
});

/* ═══════════════════════════════════════════════════════════════════════════
   4.2  GET /api/chatbot/doctors
   ═══════════════════════════════════════════════════════════════════════════ */
router.get('/api/chatbot/doctors', requireChatbotSession, (req, res) => {
  const { search = '', specializationId } = req.query;
  let sql, params;

  if (specializationId) {
    sql    = `SELECT d.doc_id,d.name,d.doc_fee,ds.specialization FROM doctor d JOIN doctor_specialization ds ON ds.doc_spe_id=d.doc_spe_id WHERE d.doc_type='I' AND d.doc_spe_id=? ORDER BY d.name`;
    params = [specializationId];
  } else if (search) {
    sql    = `SELECT d.doc_id,d.name,d.doc_fee,ds.specialization FROM doctor d JOIN doctor_specialization ds ON ds.doc_spe_id=d.doc_spe_id WHERE d.doc_type='I' AND (d.name LIKE ? OR ds.specialization LIKE ?) ORDER BY d.name`;
    params = [`%${search}%`, `%${search}%`];
  } else {
    sql    = `SELECT d.doc_id,d.name,d.doc_fee,ds.specialization FROM doctor d JOIN doctor_specialization ds ON ds.doc_spe_id=d.doc_spe_id WHERE d.doc_type='I' ORDER BY d.name`;
    params = [];
  }

  db.query(sql, params, (err, rows) => {
    if (err) return res.status(500).json({ error: 'Failed to fetch doctors.' });
    res.json(rows.map(r => ({ docId: r.doc_id, name: r.name, specialization: r.specialization, docFee: r.doc_fee })));
  });
});

/* ═══════════════════════════════════════════════════════════════════════════
   4.3  GET /api/chatbot/doctors/:docId/slots?date=yyyy-MM-dd
   ═══════════════════════════════════════════════════════════════════════════ */
router.get('/api/chatbot/doctors/:docId/slots', requireChatbotSession, async (req, res) => {
  const { date } = req.query;
  if (!date) return res.status(400).json({ error: 'date param required.' });
  try {
    const slots = await getSlots(req.params.docId, date);
    const nxt   = slots.length === 0 ? await nextAvailableDate(req.params.docId, date) : null;
    res.json({ docId: parseInt(req.params.docId), date, slots, nextAvailableDate: nxt });
  } catch {
    res.status(500).json({ error: 'Failed to fetch slots.' });
  }
});

/* ═══════════════════════════════════════════════════════════════════════════
   4.4  POST /api/chatbot/appointments
   ═══════════════════════════════════════════════════════════════════════════ */
router.post('/api/chatbot/appointments', requireChatbotSession, async (req, res) => {
  const { docId, date, time } = req.body;
  const { patientId } = req.chatbot;
  if (!docId || !date || !time) return res.status(400).json({ error: 'docId, date, time required.' });
  if (new Date(`${date}T${time}:00`) <= new Date()) return res.status(400).json({ error: 'Cannot book in the past.' });

  try {
    const r = await bookSlot(patientId, docId, date, time);
    if (r.conflict) return res.status(409).json({ message: r.message, slots: r.slots });
    res.status(201).json(r);
  } catch {
    res.status(500).json({ error: 'Booking failed.' });
  }
});

/* ═══════════════════════════════════════════════════════════════════════════
   4.5  GET /api/chatbot/appointments?type=upcoming|history
   ═══════════════════════════════════════════════════════════════════════════ */
router.get('/api/chatbot/appointments', requireChatbotSession, (req, res) => {
  const { type = 'upcoming' } = req.query;
  const { patientId } = req.chatbot;
  const where = type === 'upcoming'
    ? `a.status='BOOKED' AND (a.APPOINTMENT_DATE > CURDATE() OR (a.APPOINTMENT_DATE=CURDATE() AND a.APPOINTMENT_TIME>=CURTIME()))`
    : `(a.status!='BOOKED' OR a.APPOINTMENT_DATE<CURDATE() OR (a.APPOINTMENT_DATE=CURDATE() AND a.APPOINTMENT_TIME<CURTIME()))`;

  db.query(
    `SELECT a.APPOINTMENT_ID as appointmentId, d.name as docName,
            DATE_FORMAT(a.APPOINTMENT_DATE,'%Y-%m-%d') as date,
            TIME_FORMAT(a.APPOINTMENT_TIME,'%H:%i') as time, a.status
     FROM appointment a JOIN doctor d ON d.doc_id=a.DOCTOR_ID
     WHERE a.PATIENT_ID=? AND ${where}
     ORDER BY a.APPOINTMENT_DATE, a.APPOINTMENT_TIME`,
    [patientId],
    (err, rows) => {
      if (err) return res.status(500).json({ error: 'Failed to fetch appointments.' });
      res.json(rows);
    }
  );
});

/* ═══════════════════════════════════════════════════════════════════════════
   4.6  PUT /api/chatbot/appointments/:id/reschedule
   ═══════════════════════════════════════════════════════════════════════════ */
router.put('/api/chatbot/appointments/:id/reschedule', requireChatbotSession, async (req, res) => {
  const { date, time } = req.body;
  const { patientId } = req.chatbot;
  if (!date || !time) return res.status(400).json({ error: 'date and time required.' });
  if (new Date(`${date}T${time}:00`) <= new Date()) return res.status(400).json({ error: 'Cannot reschedule to the past.' });

  db.query('SELECT * FROM appointment WHERE APPOINTMENT_ID=? AND PATIENT_ID=?', [req.params.id, patientId], async (err, rows) => {
    if (err) return res.status(500).json({ error: 'DB error.' });
    if (!rows.length) return res.status(403).json({ error: 'Appointment not found or not yours.' });
    const a = rows[0];
    if (a.status !== 'BOOKED') return res.status(409).json({ error: 'Only BOOKED appointments can be rescheduled.' });
    if (new Date(`${toDateStr(a.APPOINTMENT_DATE)}T${a.APPOINTMENT_TIME}`) <= new Date())
      return res.status(409).json({ error: 'Cannot reschedule a past appointment.' });

    try {
      const slots = await getSlots(a.DOCTOR_ID, date);
      if (!slots.includes(time)) return res.status(409).json({ message: 'Slot not available.', slots });
      db.query('UPDATE appointment SET APPOINTMENT_DATE=?, APPOINTMENT_TIME=?, updated_at=NOW() WHERE APPOINTMENT_ID=?',
        [date, time, req.params.id], (e) => {
          if (e) return res.status(500).json({ error: 'Update failed.' });
          db.query('SELECT name FROM doctor WHERE doc_id=?', [a.DOCTOR_ID], (e2, r) => {
            res.json({ appointmentId: parseInt(req.params.id), docName: r?.[0]?.name || '', date, time, status: 'BOOKED' });
          });
        });
    } catch { res.status(500).json({ error: 'Reschedule failed.' }); }
  });
});

/* ═══════════════════════════════════════════════════════════════════════════
   4.7  DELETE /api/chatbot/appointments/:id
   ═══════════════════════════════════════════════════════════════════════════ */
router.delete('/api/chatbot/appointments/:id', requireChatbotSession, (req, res) => {
  const { patientId } = req.chatbot;
  db.query('SELECT * FROM appointment WHERE APPOINTMENT_ID=? AND PATIENT_ID=?', [req.params.id, patientId], (err, rows) => {
    if (err) return res.status(500).json({ error: 'DB error.' });
    if (!rows.length) return res.status(403).json({ error: 'Appointment not found or not yours.' });
    const a = rows[0];
    if (a.status !== 'BOOKED') return res.status(409).json({ error: 'Only BOOKED appointments can be cancelled.' });
    if (new Date(`${toDateStr(a.APPOINTMENT_DATE)}T${a.APPOINTMENT_TIME}`) <= new Date())
      return res.status(409).json({ error: 'Cannot cancel past appointments.' });
    db.query("UPDATE appointment SET status='CANCELLED', updated_at=NOW() WHERE APPOINTMENT_ID=?", [req.params.id], (e) => {
      if (e) return res.status(500).json({ error: 'Cancellation failed.' });
      res.json({ message: 'Appointment cancelled.' });
    });
  });
});

/* ═══════════════════════════════════════════════════════════════════════════
   CONVERSATION STATE MACHINE
   ═══════════════════════════════════════════════════════════════════════════ */

async function processMessage(session, message) {
  const text  = message.toLowerCase().trim();
  const stage = session.stage;

  /* ── IDLE ─────────────────────────────────────────────────────────────── */
  if (stage === 'IDLE') {
    if (/^(hi|hello|hey|good\s+(morning|afternoon|evening)|greetings)\b/.test(text)) {
      return menuReply(session.patientName);
    }
    if (/\b(book|schedule|make|fix|want.*appoint|need.*doctor|see.*doctor|consult|new appoint)\b/.test(text) || text === 'book') {
      session.stage = 'BOOKING_DOCTOR';
      return { reply: `Sure! Which doctor would you like to see?\n\nYou can type:\n• A **doctor's name** (e.g., "Dr. Sharma")\n• A **specialization** (e.g., "cardiologist")\n• "**show all**" to list all doctors`, type: 'text' };
    }
    if (/\b(upcoming|my appoint|next|future|scheduled)\b/.test(text) || text === 'upcoming') {
      return fetchApptList(session.patientId, 'upcoming');
    }
    if (/\b(history|past|previous|old|completed)\b/.test(text) || text === 'history') {
      return fetchApptList(session.patientId, 'history');
    }
    if (/\b(reschedule|change.*appoint|move.*appoint|shift)\b/.test(text) || text === 'reschedule') {
      return startAction(session, 'reschedule');
    }
    if (/\bcancel\b/.test(text) && !/^no\b/.test(text) || text === 'cancel') {
      return startAction(session, 'cancel');
    }
    if (/\bhelp\b/.test(text)) return menuReply(session.patientName);
    return menuReply(session.patientName);
  }

  /* ── BOOKING_DOCTOR ───────────────────────────────────────────────────── */
  if (stage === 'BOOKING_DOCTOR') {
    const n = parseNum(text, session.pendingList.length);
    if (n !== null) {
      const picked = session.pendingList[n - 1];
      session.pendingDoctorId   = picked.id;
      session.pendingDoctorName = picked.label.split('(')[0].trim();
      session.pendingList       = [];
      session.stage             = 'BOOKING_DATE';
      return { reply: `Great! When would you like to see **${session.pendingDoctorName}**?\n\nProvide a date (e.g., "tomorrow", "next Monday", "2026-07-10")`, type: 'text' };
    }
    return searchDoctors(session, text, message);
  }

  /* ── BOOKING_DATE ─────────────────────────────────────────────────────── */
  if (stage === 'BOOKING_DATE') {
    const dateStr = extractDate(text);
    if (!dateStr) return { reply: 'Please provide a valid date (e.g., "tomorrow", "next Friday", "2026-07-10").', type: 'text' };
    if (dateStr < toDateStr(new Date())) return { reply: '⚠️ That date is in the past. Please choose a future date.', type: 'text' };
    return showSlots(session, dateStr, 'BOOKING_SLOT');
  }

  /* ── BOOKING_SLOT ─────────────────────────────────────────────────────── */
  if (stage === 'BOOKING_SLOT') {
    // Time period filter
    const period = extractTimePeriod(text);
    if (period && session.pendingSlotList?.length) {
      const filtered = filterByPeriod(session.pendingSlotList, period);
      if (!filtered.length) return { reply: `No ${period.toLowerCase()} slots available. Try another period or date.`, type: 'text' };
      session.pendingSlotList = filtered;
      return fmtSlots(filtered, session.pendingDate);
    }
    // Number pick
    const n = parseNum(text, session.pendingSlotList?.length);
    if (n !== null) return confirmBookingReply(session, session.pendingSlotList[n - 1]);
    // Direct time
    const t = extractTime(text);
    if (t) {
      if (session.pendingSlotList && !session.pendingSlotList.includes(t)) {
        return { reply: `⚠️ ${t} is not in the available slots. Please choose from the list.`, type: 'text' };
      }
      return confirmBookingReply(session, t);
    }
    // User might type a new date
    const newDate = extractDate(text);
    if (newDate) {
      if (newDate < toDateStr(new Date())) return { reply: '⚠️ Past date. Please choose a future date.', type: 'text' };
      return showSlots(session, newDate, 'BOOKING_SLOT');
    }
    return { reply: 'Please select a slot by number or type the time (e.g., "09:20"). Say "morning"/"afternoon"/"evening" to filter.', type: 'text' };
  }

  /* ── BOOKING_CONFIRM ──────────────────────────────────────────────────── */
  if (stage === 'BOOKING_CONFIRM') {
    if (/^(yes|y|ok|okay|sure|confirm|yep|yeah|go ahead|proceed)$/.test(text)) {
      try {
        const r = await bookSlot(session.patientId, session.pendingDoctorId, session.pendingDate, session.pendingSlot);
        clearBookingState(session);
        session.stage = 'IDLE';
        if (r.conflict) {
          return { reply: `❌ ${r.message}`, type: 'text' };
        }
        return {
          reply: `✅ **Appointment Booked!**\n\n🆔 ID: ${r.appointmentId}\n👨‍⚕️ Doctor: ${r.docName}\n📅 Date: ${toDisplayDate(r.date)}\n🕐 Time: ${r.time}\n\nIs there anything else I can help you with?`,
          type: 'success',
        };
      } catch {
        clearBookingState(session); session.stage = 'IDLE';
        return { reply: 'Booking failed. Please try again.', type: 'text' };
      }
    }
    if (/^(no|nope|n|back|cancel|stop)$/.test(text)) {
      clearBookingState(session); session.stage = 'IDLE';
      return { reply: 'Booking cancelled. How else can I help you?', type: 'text' };
    }
    return { reply: 'Please reply "Yes" to confirm or "No" to cancel.', type: 'text' };
  }

  /* ── RESCHEDULE_SELECT ────────────────────────────────────────────────── */
  if (stage === 'RESCHEDULE_SELECT') {
    const n = parseNum(text, session.pendingList.length);
    if (n === null) return { reply: 'Please enter the appointment number from the list above.', type: 'text' };
    const picked = session.pendingList[n - 1];
    session.pendingAppointmentId = picked.id;
    session.pendingList = [];
    session.stage = 'RESCHEDULE_DATE';
    return { reply: `New date for:\n*${picked.label}*\n\nPlease provide the new date:`, type: 'text' };
  }

  /* ── RESCHEDULE_DATE ──────────────────────────────────────────────────── */
  if (stage === 'RESCHEDULE_DATE') {
    const dateStr = extractDate(text);
    if (!dateStr) return { reply: 'Please provide a valid date.', type: 'text' };
    if (dateStr < toDateStr(new Date())) return { reply: '⚠️ Past date. Choose a future date.', type: 'text' };
    const docId = await apptDoctorId(session.pendingAppointmentId);
    if (!docId) { session.stage = 'IDLE'; return { reply: 'Appointment not found.', type: 'text' }; }
    session.pendingDoctorId = docId;
    return showSlots(session, dateStr, 'RESCHEDULE_SLOT');
  }

  /* ── RESCHEDULE_SLOT ──────────────────────────────────────────────────── */
  if (stage === 'RESCHEDULE_SLOT') {
    const n = parseNum(text, session.pendingSlotList?.length);
    const t = n !== null ? session.pendingSlotList[n - 1] : extractTime(text);
    if (!t) return { reply: 'Please select a slot by number or type the time.', type: 'text' };
    if (session.pendingSlotList && !session.pendingSlotList.includes(t))
      return { reply: `⚠️ ${t} is not available. Choose from the list.`, type: 'text' };
    session.pendingSlot = t;
    session.stage = 'RESCHEDULE_CONFIRM';
    return {
      reply: `Reschedule to **${toDisplayDate(session.pendingDate)}** at **${t}**?\n\nType "Yes" to confirm or "No" to cancel.`,
      type: 'text',
    };
  }

  /* ── RESCHEDULE_CONFIRM ───────────────────────────────────────────────── */
  if (stage === 'RESCHEDULE_CONFIRM') {
    if (/^(yes|y|ok|okay|sure|confirm|yep|yeah)$/.test(text)) {
      try {
        const slots = await getSlots(session.pendingDoctorId, session.pendingDate);
        if (!slots.includes(session.pendingSlot)) {
          session.stage = 'IDLE';
          return { reply: `❌ Slot ${session.pendingSlot} is no longer available. Please try rescheduling again.`, type: 'text' };
        }
        await new Promise((res, rej) => db.query(
          'UPDATE appointment SET APPOINTMENT_DATE=?, APPOINTMENT_TIME=?, updated_at=NOW() WHERE APPOINTMENT_ID=?',
          [session.pendingDate, session.pendingSlot, session.pendingAppointmentId],
          err => err ? rej(err) : res()
        ));
        const date = session.pendingDate, time = session.pendingSlot;
        clearBookingState(session); session.stage = 'IDLE';
        return { reply: `✅ **Rescheduled!**\n📅 New Date: ${toDisplayDate(date)}\n🕐 New Time: ${time}\n\nAnything else?`, type: 'success' };
      } catch {
        session.stage = 'IDLE';
        return { reply: 'Reschedule failed. Please try again.', type: 'text' };
      }
    }
    if (/^(no|nope|n|back|cancel)$/.test(text)) {
      clearBookingState(session); session.stage = 'IDLE';
      return { reply: 'Reschedule cancelled. How can I help you?', type: 'text' };
    }
    return { reply: 'Please reply "Yes" to confirm or "No" to cancel.', type: 'text' };
  }

  /* ── CANCEL_SELECT ────────────────────────────────────────────────────── */
  if (stage === 'CANCEL_SELECT') {
    const n = parseNum(text, session.pendingList.length);
    if (n === null) return { reply: 'Please enter the appointment number from the list.', type: 'text' };
    const picked = session.pendingList[n - 1];
    session.pendingAppointmentId = picked.id;
    session.pendingList = [];
    session.stage = 'CANCEL_CONFIRM';
    return { reply: `Cancel this appointment?\n*${picked.label}*\n\nType "Yes" to confirm or "No" to keep it.`, type: 'text' };
  }

  /* ── CANCEL_CONFIRM ───────────────────────────────────────────────────── */
  if (stage === 'CANCEL_CONFIRM') {
    if (/^(yes|y|ok|okay|sure|confirm|yep|yeah)$/.test(text)) {
      try {
        await new Promise((res, rej) => db.query(
          `UPDATE appointment SET status='CANCELLED', updated_at=NOW()
           WHERE APPOINTMENT_ID=? AND PATIENT_ID=? AND status='BOOKED'`,
          [session.pendingAppointmentId, session.patientId],
          (err, r) => {
            if (err) return rej(err);
            if (r.affectedRows === 0) return rej(new Error('not_cancellable'));
            res();
          }
        ));
        session.stage = 'IDLE';
        return { reply: '✅ Appointment cancelled.\n\nAnything else I can help with?', type: 'success' };
      } catch (e) {
        session.stage = 'IDLE';
        return { reply: e.message === 'not_cancellable' ? 'This appointment cannot be cancelled (already cancelled or past).' : 'Cancellation failed. Please try again.', type: 'text' };
      }
    }
    if (/^(no|nope|n|back)$/.test(text)) {
      session.stage = 'IDLE';
      return { reply: 'Cancellation aborted. Your appointment is still booked.', type: 'text' };
    }
    return { reply: 'Please reply "Yes" to confirm or "No" to keep the appointment.', type: 'text' };
  }

  // Unknown stage fallback
  session.stage = 'IDLE';
  return menuReply(session.patientName);
}

/* ─── State machine helpers ─────────────────────────────────────────────── */

function menuReply(name) {
  return {
    reply: `Hello, **${name}**! How can I help you today?`,
    type: 'options',
    options: [
      { id: 'book',       label: '📅 Book Appointment' },
      { id: 'upcoming',   label: '📋 View Upcoming' },
      { id: 'history',    label: '🕐 View History' },
      { id: 'reschedule', label: '🔄 Reschedule' },
      { id: 'cancel',     label: '❌ Cancel' },
    ],
  };
}

function fetchApptList(patientId, type) {
  return new Promise(resolve => {
    const where = type === 'upcoming'
      ? `a.status='BOOKED' AND (a.APPOINTMENT_DATE>CURDATE() OR (a.APPOINTMENT_DATE=CURDATE() AND a.APPOINTMENT_TIME>=CURTIME()))`
      : `(a.status='CANCELLED' OR a.APPOINTMENT_DATE<CURDATE() OR (a.APPOINTMENT_DATE=CURDATE() AND a.APPOINTMENT_TIME<CURTIME()))`;

    db.query(
      `SELECT a.APPOINTMENT_ID as id, d.name as docName,
              DATE_FORMAT(a.APPOINTMENT_DATE,'%Y-%m-%d') as date,
              TIME_FORMAT(a.APPOINTMENT_TIME,'%H:%i') as time, a.status
       FROM appointment a JOIN doctor d ON d.doc_id=a.DOCTOR_ID
       WHERE a.PATIENT_ID=? AND ${where}
       ORDER BY a.APPOINTMENT_DATE DESC, a.APPOINTMENT_TIME DESC LIMIT 10`,
      [patientId],
      (err, rows) => {
        if (err || !rows.length) {
          return resolve({ reply: type === 'upcoming' ? 'You have no upcoming appointments. Would you like to book one?' : 'No appointment history found.', type: 'text' });
        }
        const items = rows.map(r => ({ id: r.id, label: `Dr. ${r.docName} — ${toDisplayDate(r.date)} at ${r.time} [${r.status}]` }));
        resolve({
          reply: type === 'upcoming' ? `📋 Upcoming appointments (${rows.length}):` : `🕐 Appointment history (${rows.length}):`,
          type: 'appointment_list',
          items,
        });
      }
    );
  });
}

async function startAction(session, action) {
  const list = await fetchApptList(session.patientId, 'upcoming');
  if (!list.items?.length) {
    return { reply: `You have no upcoming appointments to ${action}.`, type: 'text' };
  }
  session.pendingList = list.items;
  session.stage = action === 'reschedule' ? 'RESCHEDULE_SELECT' : 'CANCEL_SELECT';
  return {
    reply: `Which appointment would you like to ${action}?\n\n${list.items.map((it, i) => `${i+1}. ${it.label}`).join('\n')}\n\nEnter the number:`,
    type: 'numbered_list',
    items: list.items,
  };
}

function searchDoctors(session, text, originalMessage) {
  return new Promise(resolve => {
    const showAll = /\b(all|any|show|list)\b/.test(text);
    let sql, params;
    if (showAll) {
      sql = `SELECT d.doc_id,d.name,d.doc_fee,ds.specialization FROM doctor d JOIN doctor_specialization ds ON ds.doc_spe_id=d.doc_spe_id WHERE d.doc_type='I' ORDER BY d.name`;
      params = [];
    } else {
      sql = `SELECT d.doc_id,d.name,d.doc_fee,ds.specialization FROM doctor d JOIN doctor_specialization ds ON ds.doc_spe_id=d.doc_spe_id WHERE d.doc_type='I' AND (d.name LIKE ? OR ds.specialization LIKE ?) ORDER BY d.name`;
      params = [`%${originalMessage}%`, `%${originalMessage}%`];
    }
    db.query(sql, params, (err, rows) => {
      if (err || !rows.length) {
        return resolve({ reply: 'No doctors found. Try "show all doctors" to see the full list.', type: 'text' });
      }
      if (rows.length === 1) {
        session.pendingDoctorId   = rows[0].doc_id;
        session.pendingDoctorName = `Dr. ${rows[0].name}`;
        session.stage = 'BOOKING_DATE';
        return resolve({ reply: `Found: **Dr. ${rows[0].name}** (${rows[0].specialization}) — ₹${rows[0].doc_fee}\n\nWhat date would you like?`, type: 'text' });
      }
      const items = rows.slice(0, 10).map(r => ({
        id: r.doc_id,
        label: `Dr. ${r.name} (${r.specialization}) — ₹${r.doc_fee}`,
      }));
      session.pendingList = items;
      resolve({
        reply: `Here are the available doctors:\n\n${items.map((d, i) => `${i+1}. ${d.label}`).join('\n')}\n\nEnter the number to select:`,
        type: 'numbered_list',
        items,
      });
    });
  });
}

async function showSlots(session, dateStr, nextStage) {
  try {
    const slots = await getSlots(session.pendingDoctorId, dateStr);
    if (!slots.length) {
      const nxt = await nextAvailableDate(session.pendingDoctorId, dateStr);
      if (nxt) return { reply: `No slots on ${toDisplayDate(dateStr)}.\n\nNext available: **${toDisplayDate(nxt)}**. Type that date to see slots.`, type: 'text' };
      return { reply: `No available slots on ${toDisplayDate(dateStr)} or in the next 14 days.`, type: 'text' };
    }
    session.pendingDate     = dateStr;
    session.pendingSlotList = slots;
    session.stage           = nextStage;
    return fmtSlots(slots, dateStr);
  } catch {
    return { reply: 'Failed to fetch slots. Please try again.', type: 'text' };
  }
}

function fmtSlots(slots, dateStr) {
  return {
    reply: `Available slots on **${toDisplayDate(dateStr)}**:\n\nSelect a number or type the time. Say "morning"/"afternoon"/"evening" to filter.`,
    type: 'slots',
    slots,
    date: dateStr,
  };
}

function confirmBookingReply(session, timeStr) {
  session.pendingSlot = timeStr;
  session.stage = 'BOOKING_CONFIRM';
  return {
    reply: `Confirm appointment:\n👨‍⚕️ **Doctor:** ${session.pendingDoctorName}\n📅 **Date:** ${toDisplayDate(session.pendingDate)}\n🕐 **Time:** ${timeStr}\n\nType "Yes" to book or "No" to cancel.`,
    type: 'confirm',
  };
}

function clearBookingState(session) {
  session.pendingDoctorId   = null;
  session.pendingDoctorName = null;
  session.pendingDate       = null;
  session.pendingSlot       = null;
  session.pendingSlotList   = null;
  session.pendingList       = [];
  session.pendingAppointmentId = null;
}

function apptDoctorId(appointmentId) {
  return new Promise(resolve => {
    db.query('SELECT DOCTOR_ID FROM appointment WHERE APPOINTMENT_ID=?', [appointmentId],
      (err, r) => resolve(r?.[0]?.DOCTOR_ID || null));
  });
}

module.exports = router;
