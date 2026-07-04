'use strict';

const express = require('express');
const router  = express.Router();
const db      = require('../config/db');
const { authenticateJWT } = require('./authenticateJWT');

// ---------------------------------------------------------------------------
// Utility
// ---------------------------------------------------------------------------
/** Returns today's date as YYYY-MM-DD (local server time). */
function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

// ===========================================================================
// COUNTER MANAGEMENT
// ===========================================================================

/**
 * GET /api/queue/counters
 * List all counters with joined doctor name and specialization.
 */
router.get('/api/queue/counters', authenticateJWT, (req, res) => {
  const sql = `
    SELECT  tcm.*,
            d.name            AS doctor_name,
            ds.specialization
    FROM    TOKEN_COUNTER_MASTER  tcm
    LEFT JOIN doctor               d   ON tcm.DOCTOR_ID  = d.doc_id
    LEFT JOIN doctor_specialization ds  ON d.doc_spe_id   = ds.doc_spe_id
    ORDER BY tcm.COUNTER_CODE ASC
  `;
  db.query(sql, (err, rows) => {
    if (err) { res.status(500).json({ error: err.message }); return; }
    res.json(rows);
  });
  return;
});

/**
 * POST /api/queue/counters
 * Create a new counter.
 * Body: { counterCode, counterName, departmentId, doctorId, tokenPrefix, avgConsultTimeMin }
 */
router.post('/api/queue/counters', authenticateJWT, (req, res) => {
  const { counterCode, counterName, departmentId, doctorId,
          tokenPrefix, avgConsultTimeMin } = req.body;

  if (!counterCode || !counterName || !tokenPrefix) {
    res.status(400).json({ error: 'counterCode, counterName and tokenPrefix are required' });
    return;
  }

  const sql = `
    INSERT INTO TOKEN_COUNTER_MASTER
      (COUNTER_CODE, COUNTER_NAME, DEPARTMENT_ID, DOCTOR_ID,
       TOKEN_PREFIX, AVG_CONSULT_TIME_MIN, CREATED_BY)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `;
  const params = [
    counterCode,
    counterName,
    departmentId   || null,
    doctorId       || null,
    tokenPrefix,
    avgConsultTimeMin != null ? avgConsultTimeMin : 10,
    req.user.id
  ];

  db.query(sql, params, (err, result) => {
    if (err) {
      if (err.code === 'ER_DUP_ENTRY') {
        res.status(409).json({ error: 'Counter code already exists' });
        return;
      }
      res.status(500).json({ error: err.message });
      return;
    }
    res.status(201).json({ message: 'Counter created', counterId: result.insertId });
  });
  return;
});

/**
 * PUT /api/queue/counters/:id
 * Update an existing counter.
 * Body: { counterCode, counterName, departmentId, doctorId, tokenPrefix, avgConsultTimeMin, status }
 */
router.put('/api/queue/counters/:id', authenticateJWT, (req, res) => {
  const { id } = req.params;
  const { counterCode, counterName, departmentId, doctorId,
          tokenPrefix, avgConsultTimeMin, status } = req.body;

  const sql = `
    UPDATE TOKEN_COUNTER_MASTER
    SET    COUNTER_CODE         = ?,
           COUNTER_NAME         = ?,
           DEPARTMENT_ID        = ?,
           DOCTOR_ID            = ?,
           TOKEN_PREFIX         = ?,
           AVG_CONSULT_TIME_MIN = ?,
           STATUS               = ?,
           UPDATED_BY           = ?,
           UPDATED_DATE         = NOW()
    WHERE  COUNTER_ID = ?
  `;
  const params = [
    counterCode,
    counterName,
    departmentId   || null,
    doctorId       || null,
    tokenPrefix,
    avgConsultTimeMin != null ? avgConsultTimeMin : 10,
    status         || 'ACTIVE',
    req.user.id,
    id
  ];

  db.query(sql, params, (err, result) => {
    if (err) { res.status(500).json({ error: err.message }); return; }
    if (result.affectedRows === 0) {
      res.status(404).json({ error: 'Counter not found' });
      return;
    }
    res.json({ message: 'Counter updated successfully' });
  });
  return;
});

// ===========================================================================
// TOKEN GENERATION
// ===========================================================================

/**
 * POST /api/queue/token
 * Generate a queue token for a patient.
 * Body: { patientId, regId, counterId, doctorId, appointmentId? }
 *
 * Logic:
 *   1. Duplicate check — 409 if patient already active for same doctor today
 *   2. Fetch active counter details
 *   3. Compute next sequential token number for counter+date
 *   4. Count active patients to estimate wait time
 *   5. Insert PATIENT_QUEUE row and return token info
 */
router.post('/api/queue/token', authenticateJWT, (req, res) => {
  const { patientId, regId, counterId, doctorId, appointmentId } = req.body;

  if (!patientId || !regId || !counterId || !doctorId) {
    res.status(400).json({ error: 'patientId, regId, counterId and doctorId are required' });
    return;
  }

  // ── Step 1: duplicate check ──────────────────────────────────────────────
  const dupSql = `
    SELECT QUEUE_ID, TOKEN_NO, EST_WAIT_MIN, QUEUE_STATUS
    FROM   PATIENT_QUEUE
    WHERE  PATIENT_ID   = ?
      AND  DOCTOR_ID    = ?
      AND  TOKEN_DATE   = CURDATE()
      AND  QUEUE_STATUS IN ('WAITING', 'CALLED', 'WITH_DOCTOR')
    LIMIT 1
  `;
  db.query(dupSql, [patientId, doctorId], (err, existing) => {
    if (err) { res.status(500).json({ error: err.message }); return; }
    if (existing.length > 0) {
      res.status(409).json({
        message: 'Patient already has an active token for this doctor today',
        token:   existing[0]
      });
      return;
    }

    // ── Step 2: get counter info ─────────────────────────────────────────
    const counterSql = `
      SELECT COUNTER_ID, TOKEN_PREFIX, AVG_CONSULT_TIME_MIN, DEPARTMENT_ID
      FROM   TOKEN_COUNTER_MASTER
      WHERE  COUNTER_ID = ?
        AND  STATUS     = 'ACTIVE'
    `;
    db.query(counterSql, [counterId], (err, counters) => {
      if (err) { res.status(500).json({ error: err.message }); return; }
      if (counters.length === 0) {
        res.status(404).json({ error: 'Counter not found or inactive' });
        return;
      }
      const counter = counters[0];
      const prefix  = counter.TOKEN_PREFIX;

      // ── Step 3: today's max token number for this counter ──────────────
      const maxSql = `
        SELECT MAX(CAST(SUBSTRING(TOKEN_NO, LENGTH(?) + 1) AS UNSIGNED)) AS maxNum
        FROM   PATIENT_QUEUE
        WHERE  COUNTER_ID = ?
          AND  TOKEN_DATE = CURDATE()
      `;
      db.query(maxSql, [prefix, counterId], (err, maxRows) => {
        if (err) { res.status(500).json({ error: err.message }); return; }
        const nextNum = (maxRows[0].maxNum || 0) + 1;
        const tokenNo = prefix + String(nextNum).padStart(3, '0');

        // ── Step 4: count active patients to estimate wait ───────────────
        const activeSql = `
          SELECT COUNT(*) AS cnt
          FROM   PATIENT_QUEUE
          WHERE  COUNTER_ID   = ?
            AND  TOKEN_DATE   = CURDATE()
            AND  QUEUE_STATUS IN ('WAITING', 'CALLED', 'WITH_DOCTOR')
        `;
        db.query(activeSql, [counterId], (err, countRows) => {
          if (err) { res.status(500).json({ error: err.message }); return; }
          const estWait = countRows[0].cnt * counter.AVG_CONSULT_TIME_MIN;

          // ── Step 5: insert queue entry ─────────────────────────────────
          const insertSql = `
            INSERT INTO PATIENT_QUEUE
              (TOKEN_NO, TOKEN_DATE, COUNTER_ID, PATIENT_ID, REG_ID, APPOINTMENT_ID,
               DOCTOR_ID, DEPARTMENT_ID, QUEUE_STATUS, GENERATED_TIME,
               EST_WAIT_MIN, CREATED_BY, CREATED_DATE)
            VALUES (?, CURDATE(), ?, ?, ?, ?, ?, ?, 'WAITING', NOW(), ?, ?, NOW())
          `;
          const insParams = [
            tokenNo,
            counterId,
            patientId,
            regId,
            appointmentId  || null,
            doctorId,
            counter.DEPARTMENT_ID,
            estWait,
            req.user.id
          ];

          db.query(insertSql, insParams, (err, result) => {
            if (err) { res.status(500).json({ error: err.message }); return; }
            res.status(201).json({
              queueId:    result.insertId,
              tokenNo,
              estWaitMin: estWait,
              message:    'Token generated successfully'
            });
          });
        });
      });
    });
  });
  return;
});

// ===========================================================================
// LIVE QUEUE VIEW
// ===========================================================================

/**
 * GET /api/queue/live
 * Live queue list, optionally filtered.
 * Query params: counterId?, doctorId?, status?, date? (default today)
 */
router.get('/api/queue/live', authenticateJWT, (req, res) => {
  const { counterId, doctorId, status, date } = req.query;
  const conditions = ['pq.TOKEN_DATE = ?'];
  const params     = [date || todayStr()];

  if (counterId) { conditions.push('pq.COUNTER_ID   = ?'); params.push(counterId); }
  if (doctorId)  { conditions.push('pq.DOCTOR_ID    = ?'); params.push(doctorId); }
  if (status)    { conditions.push('pq.QUEUE_STATUS = ?'); params.push(status); }

  const sql = `
    SELECT  pq.*,
            p.name            AS patient_name,
            d.name            AS doctor_name,
            ds.specialization
    FROM    PATIENT_QUEUE         pq
    LEFT JOIN patient               p   ON pq.PATIENT_ID = p.patient_id
    LEFT JOIN doctor                d   ON pq.DOCTOR_ID  = d.doc_id
    LEFT JOIN doctor_specialization ds  ON d.doc_spe_id  = ds.doc_spe_id
    WHERE   ${conditions.join(' AND ')}
    ORDER BY pq.TOKEN_NO ASC
  `;

  db.query(sql, params, (err, rows) => {
    if (err) { res.status(500).json({ error: err.message }); return; }
    res.json(rows);
  });
  return;
});

/**
 * GET /api/queue/doctor/:doctorId/today
 * Doctor-centric view of today's queue.
 * Returns: { current, next, waiting[], completed_count, total_count }
 */
router.get('/api/queue/doctor/:doctorId/today', authenticateJWT, (req, res) => {
  const { doctorId } = req.params;

  const sql = `
    SELECT  pq.*,
            p.name AS patient_name
    FROM    PATIENT_QUEUE  pq
    JOIN    patient         p   ON pq.PATIENT_ID = p.patient_id
    WHERE   pq.DOCTOR_ID   = ?
      AND   pq.TOKEN_DATE  = CURDATE()
    ORDER BY pq.QUEUE_ID ASC
  `;

  db.query(sql, [doctorId], (err, rows) => {
    if (err) { res.status(500).json({ error: err.message }); return; }

    // Current: prefer WITH_DOCTOR; fall back to most-recent CALLED
    const current = rows.find(r => r.QUEUE_STATUS === 'WITH_DOCTOR')
                 || rows.filter(r => r.QUEUE_STATUS === 'CALLED').pop()
                 || null;

    const waiting         = rows.filter(r => r.QUEUE_STATUS === 'WAITING');
    const completed_count = rows.filter(r => r.QUEUE_STATUS === 'COMPLETED').length;
    const total_count     = rows.length;

    res.json({
      current,
      next: waiting[0] || null,
      waiting,
      completed_count,
      total_count
    });
  });
  return;
});

// ===========================================================================
// STATUS TRANSITIONS
// ===========================================================================

/**
 * PUT /api/queue/:queueId/status
 * Advance a token's status. Timestamps are set automatically.
 * Body: { status } — CALLED | WITH_DOCTOR | COMPLETED | SKIPPED | CANCELLED | NO_SHOW
 */
router.put('/api/queue/:queueId/status', authenticateJWT, (req, res) => {
  const { queueId } = req.params;
  const { status }  = req.body;

  const VALID_TRANSITIONS = {
    WAITING:     ['CALLED', 'SKIPPED', 'CANCELLED'],
    CALLED:      ['WITH_DOCTOR', 'NO_SHOW'],
    WITH_DOCTOR: ['COMPLETED'],
    SKIPPED:     ['WAITING'],
    COMPLETED:   [],
    CANCELLED:   [],
    NO_SHOW:     [],
  };

  // Map each status to the timing column it stamps
  const timingClauses = {
    CALLED:      ', CALLED_TIME = NOW()',
    WITH_DOCTOR: ', START_TIME  = NOW()',
    COMPLETED:   ', END_TIME    = NOW()'
  };
  const timing = timingClauses[status] || '';

  // Fetch current status first, then validate transition
  db.query('SELECT QUEUE_STATUS FROM PATIENT_QUEUE WHERE QUEUE_ID = ?', [queueId], (err, rows) => {
    if (err) { res.status(500).json({ error: err.message }); return; }
    if (rows.length === 0) { res.status(404).json({ error: 'Queue entry not found' }); return; }

    const currentStatus = rows[0].QUEUE_STATUS;
    const allowed = VALID_TRANSITIONS[currentStatus] || [];
    if (!allowed.includes(status)) {
      res.status(409).json({
        error: `Invalid transition: ${currentStatus} → ${status}. Allowed: ${allowed.join(', ') || 'none'}`
      });
      return;
    }

  const updateSql = `UPDATE PATIENT_QUEUE SET QUEUE_STATUS = ?${timing} WHERE QUEUE_ID = ?`;

  db.query(updateSql, [status, queueId], (err, result) => {
    if (err) { res.status(500).json({ error: err.message }); return; }
    if (result.affectedRows === 0) {
      res.status(409).json({ error: 'Status already finalised — no update made' });
      return;
    }

    // Return the freshly updated row
    const fetchSql = `
      SELECT  pq.*,
              p.name  AS patient_name,
              d.name  AS doctor_name
      FROM    PATIENT_QUEUE  pq
      LEFT JOIN patient        p  ON pq.PATIENT_ID = p.patient_id
      LEFT JOIN doctor         d  ON pq.DOCTOR_ID  = d.doc_id
      WHERE   pq.QUEUE_ID = ?
    `;
    db.query(fetchSql, [queueId], (err2, rows) => {
      if (err2) { res.status(500).json({ error: err2.message }); return; }
      res.json(rows[0] || {});
    });
  });
  }); // end current-status fetch
  return;
});

// ===========================================================================
// PUBLIC DISPLAY BOARD  (no auth required)
// ===========================================================================

/**
 * GET /api/queue/display/:counterId
 * Public token display board — no authentication.
 * Returns: { counter, current, next: [up to 4 WAITING] }
 *   current = WITH_DOCTOR token, or most-recently-called CALLED token
 */
router.get('/api/queue/display/:counterId', (req, res) => {
  const { counterId } = req.params;

  // Fetch counter metadata
  const counterSql = `
    SELECT COUNTER_ID, COUNTER_CODE, COUNTER_NAME,
           TOKEN_PREFIX, AVG_CONSULT_TIME_MIN, STATUS
    FROM   TOKEN_COUNTER_MASTER
    WHERE  COUNTER_ID = ?
  `;
  db.query(counterSql, [counterId], (err, counters) => {
    if (err) { res.status(500).json({ error: err.message }); return; }
    if (counters.length === 0) {
      res.status(404).json({ error: 'Counter not found' });
      return;
    }
    const counter = counters[0];

    // Current token: WITH_DOCTOR preferred, else most-recent CALLED
    const currentSql = `
      SELECT  pq.QUEUE_ID, pq.TOKEN_NO, pq.QUEUE_STATUS,
              pq.CALLED_TIME, pq.START_TIME,
              p.name AS patient_name
      FROM    PATIENT_QUEUE  pq
      LEFT JOIN patient        p  ON pq.PATIENT_ID = p.patient_id
      WHERE   pq.COUNTER_ID   = ?
        AND   pq.TOKEN_DATE   = CURDATE()
        AND   pq.QUEUE_STATUS IN ('WITH_DOCTOR', 'CALLED')
      ORDER BY FIELD(pq.QUEUE_STATUS, 'WITH_DOCTOR', 'CALLED'),
               pq.QUEUE_ID DESC
      LIMIT 1
    `;
    db.query(currentSql, [counterId], (err, curRows) => {
      if (err) { res.status(500).json({ error: err.message }); return; }
      const current = curRows[0] || null;

      // Next 4 WAITING tokens in queue order
      const nextSql = `
        SELECT  pq.QUEUE_ID, pq.TOKEN_NO, pq.QUEUE_STATUS, pq.EST_WAIT_MIN,
                p.name AS patient_name
        FROM    PATIENT_QUEUE  pq
        LEFT JOIN patient        p  ON pq.PATIENT_ID = p.patient_id
        WHERE   pq.COUNTER_ID   = ?
          AND   pq.TOKEN_DATE   = CURDATE()
          AND   pq.QUEUE_STATUS = 'WAITING'
        ORDER BY pq.QUEUE_ID ASC
        LIMIT 4
      `;
      db.query(nextSql, [counterId], (err, nextRows) => {
        if (err) { res.status(500).json({ error: err.message }); return; }
        res.json({ counter, current, next: nextRows });
      });
    });
  });
  return;
});

// ===========================================================================
// REPORTS
// ===========================================================================

/**
 * GET /api/queue/reports/dashboard
 * Today's aggregate summary across all counters.
 */
router.get('/api/queue/reports/dashboard', authenticateJWT, (req, res) => {
  const sql = `
    SELECT
      COUNT(*)                                                                AS total_generated,
      SUM(QUEUE_STATUS = 'WAITING')                                          AS waiting,
      SUM(QUEUE_STATUS = 'CALLED')                                           AS called,
      SUM(QUEUE_STATUS = 'WITH_DOCTOR')                                      AS with_doctor,
      SUM(QUEUE_STATUS = 'COMPLETED')                                        AS completed,
      SUM(QUEUE_STATUS IN ('SKIPPED','CANCELLED','NO_SHOW'))                 AS dropped,
      ROUND(
        AVG(CASE WHEN QUEUE_STATUS = 'COMPLETED'
                 THEN TIMESTAMPDIFF(MINUTE, GENERATED_TIME, START_TIME) END),
        1)                                                                    AS avg_wait_min,
      ROUND(
        AVG(CASE WHEN QUEUE_STATUS = 'COMPLETED'
                 THEN TIMESTAMPDIFF(MINUTE, START_TIME, END_TIME) END),
        1)                                                                    AS avg_consult_min
    FROM PATIENT_QUEUE
    WHERE TOKEN_DATE = CURDATE()
  `;
  db.query(sql, (err, rows) => {
    if (err) { res.status(500).json({ error: err.message }); return; }
    res.json(rows[0] || {});
  });
  return;
});

/**
 * GET /api/queue/reports/daily
 * Full daily report with all patient/doctor/counter details.
 * Query param: date (default today)
 */
router.get('/api/queue/reports/daily', authenticateJWT, (req, res) => {
  const date = req.query.date || todayStr();

  const sql = `
    SELECT  pq.*,
            p.name             AS patient_name,
            d.name             AS doctor_name,
            ds.specialization,
            tcm.COUNTER_NAME,
            TIMESTAMPDIFF(MINUTE, pq.GENERATED_TIME, pq.START_TIME) AS wait_min,
            TIMESTAMPDIFF(MINUTE, pq.START_TIME,     pq.END_TIME)   AS consult_min
    FROM    PATIENT_QUEUE          pq
    LEFT JOIN patient               p    ON pq.PATIENT_ID  = p.patient_id
    LEFT JOIN doctor                d    ON pq.DOCTOR_ID   = d.doc_id
    LEFT JOIN doctor_specialization ds   ON d.doc_spe_id   = ds.doc_spe_id
    LEFT JOIN TOKEN_COUNTER_MASTER  tcm  ON pq.COUNTER_ID  = tcm.COUNTER_ID
    WHERE   pq.TOKEN_DATE = ?
    ORDER BY pq.QUEUE_ID ASC
  `;
  db.query(sql, [date], (err, rows) => {
    if (err) { res.status(500).json({ error: err.message }); return; }
    res.json(rows);
  });
  return;
});

/**
 * GET /api/queue/reports/doctor-wise
 * Doctor-wise summary grouped by doctor for a date range.
 * Query params: from, to (both default today)
 */
router.get('/api/queue/reports/doctor-wise', authenticateJWT, (req, res) => {
  const t    = todayStr();
  const from = req.query.from || t;
  const to   = req.query.to   || t;

  const sql = `
    SELECT  d.doc_id,
            d.name                                                            AS doctor_name,
            ds.specialization,
            COUNT(*)                                                           AS total,
            SUM(pq.QUEUE_STATUS = 'COMPLETED')                                AS completed,
            SUM(pq.QUEUE_STATUS = 'SKIPPED')                                  AS skipped,
            SUM(pq.QUEUE_STATUS IN ('CANCELLED','NO_SHOW'))                   AS no_show,
            ROUND(
              AVG(CASE WHEN pq.QUEUE_STATUS = 'COMPLETED'
                       THEN TIMESTAMPDIFF(MINUTE, pq.START_TIME, pq.END_TIME)
                  END),
              1)                                                               AS avg_consult_min
    FROM    PATIENT_QUEUE          pq
    LEFT JOIN doctor                d   ON pq.DOCTOR_ID = d.doc_id
    LEFT JOIN doctor_specialization ds  ON d.doc_spe_id = ds.doc_spe_id
    WHERE   pq.TOKEN_DATE BETWEEN ? AND ?
    GROUP BY pq.DOCTOR_ID, d.doc_id, d.name, ds.specialization
    ORDER BY d.name ASC
  `;
  db.query(sql, [from, to], (err, rows) => {
    if (err) { res.status(500).json({ error: err.message }); return; }
    res.json(rows);
  });
  return;
});

/**
 * GET /api/queue/reports/waiting-time
 * Per-patient wait and consultation time for COMPLETED tokens.
 * Query param: date (default today)
 */
router.get('/api/queue/reports/waiting-time', authenticateJWT, (req, res) => {
  const date = req.query.date || todayStr();

  const sql = `
    SELECT  p.name   AS patient_name,
            d.name   AS doctor_name,
            pq.TOKEN_NO,
            pq.GENERATED_TIME,
            pq.CALLED_TIME,
            pq.START_TIME,
            pq.END_TIME,
            TIMESTAMPDIFF(MINUTE, pq.GENERATED_TIME, pq.START_TIME) AS wait_min,
            TIMESTAMPDIFF(MINUTE, pq.START_TIME,     pq.END_TIME)   AS consult_min
    FROM    PATIENT_QUEUE  pq
    LEFT JOIN patient        p  ON pq.PATIENT_ID = p.patient_id
    LEFT JOIN doctor         d  ON pq.DOCTOR_ID  = d.doc_id
    WHERE   pq.TOKEN_DATE   = ?
      AND   pq.QUEUE_STATUS = 'COMPLETED'
    ORDER BY pq.QUEUE_ID ASC
  `;
  db.query(sql, [date], (err, rows) => {
    if (err) { res.status(500).json({ error: err.message }); return; }
    res.json(rows);
  });
  return;
});

// ---------------------------------------------------------------------------
module.exports = router;
