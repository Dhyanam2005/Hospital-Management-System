'use strict';

const express = require('express');
const router  = express.Router();
const db      = require('../config/db');
const { authenticateJWT } = require('./authenticateJWT');

/*
 * GET /api/notifications/counts
 * Returns today's key counts from existing HMS tables.
 * No new tables — pure read-only aggregates.
 */
router.get('/api/notifications/counts', authenticateJWT, (req, res) => {
  const sql = `
    SELECT
      (SELECT COUNT(*) FROM appointment
       WHERE DATE(APPOINTMENT_DATE) = CURDATE())                        AS today_appointments,

      (SELECT COUNT(*) FROM admission
       WHERE DATE(ADMISSION_DATE) = CURDATE())                          AS today_admissions,

      (SELECT COUNT(*) FROM admission
       WHERE DISCHARGE_DATE IS NULL)                                    AS current_admissions,

      (SELECT COUNT(*) FROM payment
       WHERE DATE(PAYMENT_DATE) = CURDATE())                            AS today_payments,

      (SELECT COUNT(*) FROM test_detail
       WHERE DATE(test_date) = CURDATE())                               AS today_tests,

      (SELECT COUNT(*) FROM ward_room_bed
       WHERE bed_status = 'A')                                          AS available_beds,

      (SELECT COUNT(*) FROM ward_room_bed
       WHERE bed_status = 'O')                                          AS occupied_beds
  `;

  db.query(sql, (err, rows) => {
    if (err) {
      console.error('Notifications query:', err);
      return res.status(500).json({ error: 'Failed to fetch notification counts.' });
    }
    res.json(rows[0] || {});
  });
});

module.exports = router;
