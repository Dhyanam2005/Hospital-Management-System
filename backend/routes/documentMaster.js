'use strict';

const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { authenticateJWT } = require('./authenticateJWT');

// GET all (active only) — used by patient documents upload dialog
router.get('/api/document-master', authenticateJWT, (req, res) => {
  db.query(
    `SELECT * FROM DOCUMENT_MASTER WHERE STATUS = 'ACTIVE' ORDER BY DISPLAY_ORDER`,
    (err, results) => {
      if (err) return res.status(500).json({ error: 'Error fetching document categories.' });
      res.json(results);
    }
  );
});

// GET all including inactive — used by the master management page
router.get('/api/document-master/all', authenticateJWT, (req, res) => {
  db.query(
    `SELECT * FROM DOCUMENT_MASTER ORDER BY DISPLAY_ORDER`,
    (err, results) => {
      if (err) return res.status(500).json({ error: 'Error fetching document categories.' });
      res.json(results);
    }
  );
});

// POST — create new category
router.post('/api/document-master', authenticateJWT, (req, res) => {
  const { DOCUMENT_CODE, DOCUMENT_NAME, ALLOWED_FILE_TYPES, MAX_FILE_SIZE_MB, DISPLAY_ORDER, STATUS } = req.body;

  if (!DOCUMENT_CODE || !DOCUMENT_NAME) {
    return res.status(400).json({ error: 'DOCUMENT_CODE and DOCUMENT_NAME are required.' });
  }

  db.query(
    `INSERT INTO DOCUMENT_MASTER (DOCUMENT_CODE, DOCUMENT_NAME, ALLOWED_FILE_TYPES, MAX_FILE_SIZE_MB, DISPLAY_ORDER, STATUS, CREATED_DATE)
     VALUES (?, ?, ?, ?, ?, ?, NOW())`,
    [
      DOCUMENT_CODE.trim().toUpperCase(),
      DOCUMENT_NAME.trim(),
      ALLOWED_FILE_TYPES || 'pdf,jpg,jpeg,png',
      MAX_FILE_SIZE_MB || 10,
      DISPLAY_ORDER || 0,
      STATUS || 'ACTIVE',
    ],
    (err, result) => {
      if (err) {
        if (err.code === 'ER_DUP_ENTRY')
          return res.status(409).json({ error: `Document code "${DOCUMENT_CODE}" already exists.` });
        return res.status(500).json({ error: 'Failed to create document category.' });
      }
      res.status(201).json({ DOCUMENT_ID: result.insertId, message: 'Document category created.' });
    }
  );
});

// PUT — update existing category
router.put('/api/document-master/:id', authenticateJWT, (req, res) => {
  const { id } = req.params;
  const { DOCUMENT_CODE, DOCUMENT_NAME, ALLOWED_FILE_TYPES, MAX_FILE_SIZE_MB, DISPLAY_ORDER, STATUS } = req.body;

  if (!DOCUMENT_CODE || !DOCUMENT_NAME) {
    return res.status(400).json({ error: 'DOCUMENT_CODE and DOCUMENT_NAME are required.' });
  }

  db.query(
    `UPDATE DOCUMENT_MASTER
     SET DOCUMENT_CODE=?, DOCUMENT_NAME=?, ALLOWED_FILE_TYPES=?, MAX_FILE_SIZE_MB=?, DISPLAY_ORDER=?, STATUS=?, UPDATED_DATE=NOW()
     WHERE DOCUMENT_ID=?`,
    [
      DOCUMENT_CODE.trim().toUpperCase(),
      DOCUMENT_NAME.trim(),
      ALLOWED_FILE_TYPES || 'pdf,jpg,jpeg,png',
      MAX_FILE_SIZE_MB || 10,
      DISPLAY_ORDER || 0,
      STATUS || 'ACTIVE',
      id,
    ],
    (err, result) => {
      if (err) {
        if (err.code === 'ER_DUP_ENTRY')
          return res.status(409).json({ error: `Document code "${DOCUMENT_CODE}" already exists.` });
        return res.status(500).json({ error: 'Failed to update document category.' });
      }
      if (result.affectedRows === 0) return res.status(404).json({ error: 'Category not found.' });
      res.json({ message: 'Document category updated.' });
    }
  );
});

module.exports = router;
