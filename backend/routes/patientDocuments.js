'use strict';

const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { authenticateJWT } = require('./authenticateJWT');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

const uploadsDir = path.join(__dirname, '..', 'uploads', 'patient-documents');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const ALLOWED_MIME_TYPES = new Set([
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/bmp',
  'image/tiff',
  'image/x-tiff',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
]);

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase().slice(1);
    const generatedName = `${Date.now()}_${crypto.randomUUID().replace(/-/g, '')}.${ext}`;
    cb(null, generatedName);
  },
});

const fileFilter = (req, file, cb) => {
  if (ALLOWED_MIME_TYPES.has(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`File type not allowed: ${file.mimetype}`), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 50 * 1024 * 1024 },
});

// 1. GET /api/patient-documents/file/:id/preview
router.get('/api/patient-documents/file/:id/preview', authenticateJWT, (req, res) => {
  const { id } = req.params;
  db.query(
    `SELECT * FROM PATIENT_DOCUMENT WHERE PATIENT_DOCUMENT_ID = ? AND STATUS = 'ACTIVE'`,
    [id],
    (err, rows) => {
      if (err) {
        console.error('Preview lookup error:', err);
        return res.status(500).json({ error: 'Database error.' });
      }
      if (!rows || rows.length === 0) {
        return res.status(404).json({ error: 'Document not found.' });
      }
      const row = rows[0];
      const filePath = row.FILE_PATH;
      if (!fs.existsSync(filePath)) {
        return res.status(404).json({ error: 'File not found on disk.' });
      }
      res.setHeader('Content-Type', row.MIME_TYPE);
      res.setHeader('Content-Disposition', 'inline');
      fs.createReadStream(filePath).pipe(res);
    }
  );
});

// 2. GET /api/patient-documents/file/:id/download
router.get('/api/patient-documents/file/:id/download', authenticateJWT, (req, res) => {
  const { id } = req.params;
  db.query(
    `SELECT * FROM PATIENT_DOCUMENT WHERE PATIENT_DOCUMENT_ID = ? AND STATUS = 'ACTIVE'`,
    [id],
    (err, rows) => {
      if (err) {
        console.error('Download lookup error:', err);
        return res.status(500).json({ error: 'Database error.' });
      }
      if (!rows || rows.length === 0) {
        return res.status(404).json({ error: 'Document not found.' });
      }
      const row = rows[0];
      const filePath = row.FILE_PATH;
      if (!fs.existsSync(filePath)) {
        return res.status(404).json({ error: 'File not found on disk.' });
      }
      res.setHeader('Content-Type', row.MIME_TYPE);
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="${encodeURIComponent(row.FILE_NAME)}"`
      );
      fs.createReadStream(filePath).pipe(res);
    }
  );
});

// 3. DELETE /api/patient-documents/:id
router.delete('/api/patient-documents/:id', authenticateJWT, (req, res) => {
  const { id } = req.params;
  db.query(
    `UPDATE PATIENT_DOCUMENT
     SET STATUS = 'DELETED', UPDATED_BY = ?, UPDATED_DATE = NOW()
     WHERE PATIENT_DOCUMENT_ID = ? AND STATUS = 'ACTIVE'`,
    [req.user.id, id],
    (err, result) => {
      if (err) {
        console.error('Delete document error:', err);
        return res.status(500).json({ error: 'Database error.' });
      }
      if (result.affectedRows === 0) {
        return res.status(404).json({ error: 'Document not found or already deleted.' });
      }
      res.json({ message: 'Document deleted.' });
    }
  );
});

// 4. GET /api/patient-documents/:patientId
router.get('/api/patient-documents/:patientId', authenticateJWT, (req, res) => {
  const { patientId } = req.params;
  const { docId, title } = req.query;

  let sql = `
    SELECT pd.*,
           dm.DOCUMENT_NAME,
           dm.DOCUMENT_CODE,
           u.user_name AS UPLOADED_BY_NAME,
           DATE_FORMAT(pd.UPLOADED_DATE, '%Y-%m-%dT%H:%i:%s') AS UPLOADED_DATE,
           DATE_FORMAT(pd.DOCUMENT_DATE, '%Y-%m-%d') AS DOCUMENT_DATE
    FROM PATIENT_DOCUMENT pd
    JOIN DOCUMENT_MASTER dm ON dm.DOCUMENT_ID = pd.DOCUMENT_ID
    LEFT JOIN user u ON u.user_id = pd.UPLOADED_BY
    WHERE pd.PATIENT_ID = ?
      AND pd.STATUS = 'ACTIVE'
  `;
  const params = [patientId];

  if (docId) {
    sql += ' AND dm.DOCUMENT_ID = ?';
    params.push(parseInt(docId, 10));
  }
  if (title) {
    sql += ' AND pd.DOCUMENT_TITLE LIKE ?';
    params.push(`%${title}%`);
  }
  sql += ' ORDER BY pd.UPLOADED_DATE DESC';

  db.query(sql, params, (err, rows) => {
    if (err) {
      console.error('Fetch documents error:', err);
      return res.status(500).json({ error: 'Database error.' });
    }
    res.json(rows);
  });
});

// 5. POST /api/patient-documents/upload
router.post('/api/patient-documents/upload', authenticateJWT, (req, res) => {
  upload.single('file')(req, res, (multerErr) => {
    if (multerErr) {
      return res.status(400).json({ error: multerErr.message });
    }

    const { patientId, documentId, documentTitle, documentDate, remarks } = req.body;

    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded.' });
    }
    if (!patientId || !documentId) {
      fs.unlink(req.file.path, () => {});
      return res.status(400).json({ error: 'patientId and documentId are required.' });
    }

    // Check patient exists
    db.query(
      'SELECT patient_id FROM patient WHERE patient_id = ?',
      [patientId],
      (err1, patRows) => {
        if (err1) {
          fs.unlink(req.file.path, () => {});
          console.error('Patient check error:', err1);
          return res.status(500).json({ error: 'Database error checking patient.' });
        }
        if (!patRows || patRows.length === 0) {
          fs.unlink(req.file.path, () => {});
          return res.status(400).json({ error: 'Patient not found.' });
        }

        // Check document category exists and is ACTIVE
        db.query(
          `SELECT * FROM DOCUMENT_MASTER WHERE DOCUMENT_ID = ? AND STATUS = 'ACTIVE'`,
          [documentId],
          (err2, dmRows) => {
            if (err2) {
              fs.unlink(req.file.path, () => {});
              console.error('Document master check error:', err2);
              return res.status(500).json({ error: 'Database error checking document category.' });
            }
            if (!dmRows || dmRows.length === 0) {
              fs.unlink(req.file.path, () => {});
              return res.status(400).json({ error: 'Document category not found or inactive.' });
            }

            const dm = dmRows[0];
            const fileExt = path.extname(req.file.originalname).toLowerCase().slice(1);

            // Validate file extension against allowed types for this category
            const allowedTypes = dm.ALLOWED_FILE_TYPES
              ? dm.ALLOWED_FILE_TYPES.split(',').map((t) => t.trim().toLowerCase())
              : [];
            if (allowedTypes.length > 0 && !allowedTypes.includes(fileExt)) {
              fs.unlink(req.file.path, () => {});
              return res.status(400).json({
                error: `File type '${fileExt}' not allowed for this document category. Allowed: ${allowedTypes.join(', ')}`,
              });
            }

            // Validate file size against category limit
            if (dm.MAX_FILE_SIZE_MB && req.file.size > dm.MAX_FILE_SIZE_MB * 1024 * 1024) {
              fs.unlink(req.file.path, () => {});
              return res.status(400).json({
                error: `File size exceeds the maximum allowed size of ${dm.MAX_FILE_SIZE_MB} MB for this category.`,
              });
            }

            const storedFileName = req.file.filename;
            const filePath = req.file.path;
            const mimeType = req.file.mimetype;
            const fileSize = req.file.size;
            const originalFileName = req.file.originalname;
            const docDateVal =
              documentDate && documentDate.trim() !== '' ? documentDate : null;

            db.query(
              `INSERT INTO PATIENT_DOCUMENT
                 (PATIENT_ID, DOCUMENT_ID, DOCUMENT_TITLE, FILE_NAME, STORED_FILE_NAME,
                  FILE_PATH, FILE_EXTENSION, MIME_TYPE, FILE_SIZE, DOCUMENT_DATE,
                  REMARKS, STATUS, UPLOADED_BY, UPLOADED_DATE)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'ACTIVE', ?, NOW())`,
              [
                patientId,
                documentId,
                documentTitle || null,
                originalFileName,
                storedFileName,
                filePath,
                fileExt,
                mimeType,
                fileSize,
                docDateVal,
                remarks || null,
                req.user.id,
              ],
              (err3, result) => {
                if (err3) {
                  console.error('Insert document error:', err3);
                  fs.unlink(req.file.path, () => {});
                  return res.status(500).json({ error: 'Database error saving document.' });
                }
                res.status(201).json({
                  message: 'Document uploaded.',
                  documentId: result.insertId,
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
