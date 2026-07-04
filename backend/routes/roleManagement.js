const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { authenticateJWT } = require('./authenticateJWT');

/* ─── helpers ─────────────────────────────────────────────────────────────── */

/** Generate next sequential ROLE_ID in the format R001, R002, … */
function nextRoleId(cb) {
  db.query(
    `SELECT COALESCE(MAX(CAST(SUBSTRING(ROLE_ID, 2) AS UNSIGNED)), 0) + 1 AS n
     FROM \`role\`
     WHERE ROLE_ID REGEXP '^R[0-9]+$'`,
    (err, rows) => {
      if (err) return cb(err);
      cb(null, 'R' + String(rows[0].n).padStart(3, '0'));
    }
  );
}

/* ─── GET /api/roles ──────────────────────────────────────────────────────── */
router.get('/api/roles', authenticateJWT, (req, res) => {
  db.query(
    'SELECT ROLE_ID, ROLE_CODE, ROLE_NAME, DISPLAY_ORDER, STATUS FROM `role` ORDER BY DISPLAY_ORDER ASC',
    (err, rows) => {
      if (err) {
        console.error('GET /api/roles error:', err);
        return res.status(500).json({ error: 'Failed to fetch roles' });
      }
      res.json(rows);
    }
  );
});

/* ─── POST /api/roles ─────────────────────────────────────────────────────── */
router.post('/api/roles', authenticateJWT, (req, res) => {
  if (!req.user.isSuperAdmin) return res.status(403).json({ error: 'Super Admin only' });
  const { ROLE_CODE, ROLE_NAME, DISPLAY_ORDER, STATUS } = req.body;

  // Server-side validation
  if (!ROLE_CODE?.trim()) return res.status(400).json({ error: 'ROLE_CODE is required' });
  if (!ROLE_NAME?.trim()) return res.status(400).json({ error: 'ROLE_NAME is required' });
  if (!Number.isInteger(Number(DISPLAY_ORDER)) || Number(DISPLAY_ORDER) < 1)
    return res.status(400).json({ error: 'DISPLAY_ORDER must be a positive integer' });
  if (!STATUS) return res.status(400).json({ error: 'STATUS is required' });

  nextRoleId((err, roleId) => {
    if (err) {
      console.error('ID generation error:', err);
      return res.status(500).json({ error: 'Failed to generate Role ID' });
    }

    db.query(
      'INSERT INTO `role` (ROLE_ID, ROLE_CODE, ROLE_NAME, DISPLAY_ORDER, STATUS) VALUES (?, ?, ?, ?, ?)',
      [roleId, ROLE_CODE.trim().toUpperCase(), ROLE_NAME.trim(), Number(DISPLAY_ORDER), STATUS],
      (err2) => {
        if (err2) {
          if (err2.code === 'ER_DUP_ENTRY')
            return res.status(409).json({ error: `Role Code "${ROLE_CODE}" already exists` });
          console.error('POST /api/roles error:', err2);
          return res.status(500).json({ error: 'Failed to create role' });
        }
        res.status(201).json({ ROLE_ID: roleId, message: 'Role created' });
      }
    );
  });
});

/* ─── PUT /api/roles/:id ──────────────────────────────────────────────────── */
router.put('/api/roles/:id', authenticateJWT, (req, res) => {
  if (!req.user.isSuperAdmin) return res.status(403).json({ error: 'Super Admin only' });
  const { id } = req.params;
  const { ROLE_CODE, ROLE_NAME, DISPLAY_ORDER, STATUS } = req.body;

  if (!ROLE_CODE?.trim()) return res.status(400).json({ error: 'ROLE_CODE is required' });
  if (!ROLE_NAME?.trim()) return res.status(400).json({ error: 'ROLE_NAME is required' });
  if (!Number.isInteger(Number(DISPLAY_ORDER)) || Number(DISPLAY_ORDER) < 1)
    return res.status(400).json({ error: 'DISPLAY_ORDER must be a positive integer' });
  if (!STATUS) return res.status(400).json({ error: 'STATUS is required' });

  db.query(
    'UPDATE `role` SET ROLE_CODE = ?, ROLE_NAME = ?, DISPLAY_ORDER = ?, STATUS = ? WHERE ROLE_ID = ?',
    [ROLE_CODE.trim().toUpperCase(), ROLE_NAME.trim(), Number(DISPLAY_ORDER), STATUS, id],
    (err, result) => {
      if (err) {
        if (err.code === 'ER_DUP_ENTRY')
          return res.status(409).json({ error: `Role Code "${ROLE_CODE}" already exists` });
        console.error(`PUT /api/roles/${id} error:`, err);
        return res.status(500).json({ error: 'Failed to update role' });
      }
      if (result.affectedRows === 0)
        return res.status(404).json({ error: 'Role not found' });
      res.json({ message: 'Role updated' });
    }
  );
});

module.exports = router;
