const express = require('express');
const router = express.Router();
const db = require('../config/db');

router.get('/api/menus', (req, res) => {
  const sql = `
    SELECT
      MENU_ID,
      MENU_TYPE,
      MENU_CODE,
      MENU_NAME,
      MENU_URL,
      PARENT_MENU_ID,
      DISPLAY_ORDER,
      STATUS
    FROM MENU_MASTER
    WHERE STATUS = 'ACTIVE'
    ORDER BY DISPLAY_ORDER ASC
  `;

  db.query(sql, (err, results) => {
    if (err) {
      console.error('Error fetching menus:', err);
      return res.status(500).json({ error: 'Failed to fetch menus' });
    }
    res.json(results);
  });
});

module.exports = router;
