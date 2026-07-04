const express  = require('express');
const router   = express.Router();
const db       = require('../config/db');
const { authenticateJWT } = require('./authenticateJWT');

/* ─── GET /api/users ─────────────────────────────────────────────────────── */
router.get('/api/users', authenticateJWT, (req, res) => {
  db.query(
    `SELECT user_id AS USER_ID, user_name AS USER_NAME
     FROM \`user\`
     ORDER BY user_name ASC`,
    (err, rows) => {
      if (err) {
        console.error('GET /api/users:', err);
        return res.status(500).json({ error: 'Failed to fetch users' });
      }
      res.json(rows);
    }
  );
});

/* ─── GET /api/users/:userId/roles ──────────────────────────────────────── */
router.get('/api/users/:userId/roles', authenticateJWT, (req, res) => {
  db.query(
    'SELECT ROLE_ID FROM urm_user_role_mapping WHERE USER_ID = ?',
    [req.params.userId],
    (err, rows) => {
      if (err) {
        console.error(`GET /api/users/${req.params.userId}/roles:`, err);
        return res.status(500).json({ error: 'Failed to fetch user roles' });
      }
      res.json(rows.map(r => r.ROLE_ID));
    }
  );
});

/* ─── POST /api/users/:userId/roles ─────────────────────────────────────── */
router.post('/api/users/:userId/roles', authenticateJWT, (req, res) => {
  if (!req.user.isSuperAdmin) return res.status(403).json({ error: 'Super Admin only' });
  const { userId }  = req.params;
  const { roleIds } = req.body;   // array of ROLE_IDs

  if (!Array.isArray(roleIds)) {
    return res.status(400).json({ error: 'roleIds must be an array' });
  }

  db.beginTransaction(err => {
    if (err) return res.status(500).json({ error: 'Transaction failed' });

    // Step 1: remove existing assignments
    db.query(
      'DELETE FROM urm_user_role_mapping WHERE USER_ID = ?',
      [userId],
      err => {
        if (err) {
          return db.rollback(() => res.status(500).json({ error: 'Delete failed' }));
        }

        if (roleIds.length === 0) {
          return db.commit(err => {
            if (err) return db.rollback(() => res.status(500).json({ error: 'Commit failed' }));
            res.json({ message: 'Role assignments cleared', count: 0 });
          });
        }

        // Step 2: generate sequential URM IDs from global max
        db.query(
          `SELECT COALESCE(MAX(CAST(SUBSTRING(URM_ID, 4) AS UNSIGNED)), 0) AS max_num
           FROM urm_user_role_mapping
           WHERE URM_ID REGEXP '^URM[0-9]+$'`,
          (err, results) => {
            if (err) {
              return db.rollback(() => res.status(500).json({ error: 'ID generation failed' }));
            }

            let counter = results[0].max_num;
            const values = roleIds.map(roleId => [
              'URM' + String(++counter).padStart(4, '0'),
              userId,
              roleId,
              'ACTIVE',
            ]);

            // Step 3: batch insert
            db.query(
              'INSERT INTO urm_user_role_mapping (URM_ID, USER_ID, ROLE_ID, STATUS) VALUES ?',
              [values],
              err => {
                if (err) {
                  return db.rollback(() => res.status(500).json({ error: 'Insert failed' }));
                }
                db.commit(err => {
                  if (err) return db.rollback(() => res.status(500).json({ error: 'Commit failed' }));
                  res.json({ message: 'Role assignments saved', count: roleIds.length });
                });
              }
            );
          }
        );
      }
    );
  });
});

module.exports = router;
