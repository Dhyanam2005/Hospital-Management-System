const express = require('express');
const router  = express.Router();
const db      = require('../config/db');
const { authenticateJWT } = require('./authenticateJWT');

/* ─── helpers ─────────────────────────────────────────────────────────────── */

function buildTree(flat) {
  const map   = {};
  const roots = [];
  flat.forEach(m => { map[m.MENU_ID] = { ...m, children: [] }; });
  flat.forEach(m => {
    if (m.PARENT_MENU_ID && map[m.PARENT_MENU_ID]) {
      map[m.PARENT_MENU_ID].children.push(map[m.MENU_ID]);
    } else if (!m.PARENT_MENU_ID) {
      roots.push(map[m.MENU_ID]);
    }
  });
  return roots;
}

/* ─── GET /api/users/me/menus ────────────────────────────────────────────── *
 * Returns all menus visible to the authenticated user, derived from their
 * role assignments.  Uses a recursive CTE so parent sections are always
 * included even when only leaf menus are stored in rmm_role_menu_mapping.
 * ──────────────────────────────────────────────────────────────────────────*/
router.get('/api/users/me/menus', authenticateJWT, (req, res) => {
  const userId      = req.user.id;
  const isSuperAdmin = req.user.isSuperAdmin === true;

  // Super-admin sees every active menu with no RBAC filter
  if (isSuperAdmin) {
    db.query(
      `SELECT MENU_ID, MENU_TYPE, MENU_CODE, MENU_NAME, MENU_URL, PARENT_MENU_ID, DISPLAY_ORDER, STATUS
       FROM MENU_MASTER WHERE STATUS = 'ACTIVE' ORDER BY DISPLAY_ORDER ASC`,
      (err, rows) => {
        if (err) {
          console.error('GET /api/users/me/menus (admin):', err);
          return res.status(500).json({ error: 'Failed to fetch menus' });
        }
        res.json(rows);
      }
    );
    return;
  }

  // Step 1: get leaf menus directly assigned to the user's roles
  db.query(
    `SELECT DISTINCT rmm.MENU_ID
     FROM rmm_role_menu_mapping rmm
     INNER JOIN urm_user_role_mapping urm
            ON urm.ROLE_ID = rmm.ROLE_ID AND urm.STATUS = 'ACTIVE'
     WHERE urm.USER_ID = ? AND rmm.STATUS = 'ACTIVE'`,
    [userId],
    (err, assigned) => {
      if (err) {
        console.error('GET /api/users/me/menus (role lookup):', err);
        return res.status(500).json({ error: 'Failed to fetch user menus' });
      }

      const assignedIds = assigned.map(r => r.MENU_ID);

      // Step 2: load all active menus so we can walk parent chains in JS
      db.query(
        `SELECT MENU_ID, MENU_TYPE, MENU_CODE, MENU_NAME,
                MENU_URL, PARENT_MENU_ID, DISPLAY_ORDER, STATUS
         FROM MENU_MASTER WHERE STATUS = 'ACTIVE' ORDER BY DISPLAY_ORDER ASC`,
        (err, allMenus) => {
          if (err) {
            console.error('GET /api/users/me/menus (menu load):', err);
            return res.status(500).json({ error: 'Failed to fetch user menus' });
          }

          const menuMap = {};
          allMenus.forEach(m => { menuMap[m.MENU_ID] = m; });

          // Expand assigned IDs to include every ancestor (any depth)
          const visible = new Set(assignedIds);
          assignedIds.forEach(id => {
            let cur = menuMap[id];
            while (cur && cur.PARENT_MENU_ID) {
              visible.add(cur.PARENT_MENU_ID);
              cur = menuMap[cur.PARENT_MENU_ID];
            }
          });

          res.json(allMenus.filter(m => visible.has(m.MENU_ID)));
        }
      );
    }
  );
});

/* ─── GET /api/menus/tree ─────────────────────────────────────────────────── */
router.get('/api/menus/tree', authenticateJWT, (req, res) => {
  db.query(
    `SELECT MENU_ID, MENU_CODE, MENU_NAME, MENU_URL, PARENT_MENU_ID, DISPLAY_ORDER
     FROM MENU_MASTER
     WHERE STATUS = 'ACTIVE'
     ORDER BY DISPLAY_ORDER ASC`,
    (err, rows) => {
      if (err) {
        console.error('GET /api/menus/tree:', err);
        return res.status(500).json({ error: 'Failed to fetch menus' });
      }
      res.json(buildTree(rows));
    }
  );
});

/* ─── GET /api/roles/:roleId/menus ───────────────────────────────────────── */
router.get('/api/roles/:roleId/menus', authenticateJWT, (req, res) => {
  db.query(
    'SELECT MENU_ID FROM rmm_role_menu_mapping WHERE ROLE_ID = ?',
    [req.params.roleId],
    (err, rows) => {
      if (err) {
        console.error(`GET /api/roles/${req.params.roleId}/menus:`, err);
        return res.status(500).json({ error: 'Failed to fetch role menus' });
      }
      res.json(rows.map(r => r.MENU_ID));
    }
  );
});

/* ─── POST /api/roles/:roleId/menus ──────────────────────────────────────── */
router.post('/api/roles/:roleId/menus', authenticateJWT, (req, res) => {
  if (!req.user.isSuperAdmin) return res.status(403).json({ error: 'Super Admin only' });
  const { roleId }  = req.params;
  const { menuIds } = req.body;

  if (!Array.isArray(menuIds)) {
    return res.status(400).json({ error: 'menuIds must be an array' });
  }

  db.beginTransaction(err => {
    if (err) return res.status(500).json({ error: 'Transaction failed' });

    // Step 1: delete existing assignments for this role
    db.query('DELETE FROM rmm_role_menu_mapping WHERE ROLE_ID = ?', [roleId], err => {
      if (err) {
        return db.rollback(() => res.status(500).json({ error: 'Delete failed' }));
      }

      // If nothing to insert, just commit
      if (menuIds.length === 0) {
        return db.commit(err => {
          if (err) return db.rollback(() => res.status(500).json({ error: 'Commit failed' }));
          res.json({ message: 'Permissions cleared', count: 0 });
        });
      }

      // Step 2: find current max RMM_ID to generate new sequential IDs
      db.query(
        `SELECT COALESCE(MAX(CAST(SUBSTRING(RMM_ID, 4) AS UNSIGNED)), 0) AS max_num
         FROM rmm_role_menu_mapping
         WHERE RMM_ID REGEXP '^RMM[0-9]+$'`,
        (err, results) => {
          if (err) {
            return db.rollback(() => res.status(500).json({ error: 'ID generation failed' }));
          }

          let counter = results[0].max_num;
          const values = menuIds.map(menuId => [
            'RMM' + String(++counter).padStart(4, '0'),
            roleId,
            menuId,
            'ACTIVE',
          ]);

          // Step 3: batch insert
          db.query(
            'INSERT INTO rmm_role_menu_mapping (RMM_ID, ROLE_ID, MENU_ID, STATUS) VALUES ?',
            [values],
            err => {
              if (err) {
                return db.rollback(() => res.status(500).json({ error: 'Insert failed' }));
              }
              db.commit(err => {
                if (err) return db.rollback(() => res.status(500).json({ error: 'Commit failed' }));
                res.json({ message: 'Permissions saved', count: menuIds.length });
              });
            }
          );
        }
      );
    });
  });
});

module.exports = router;
