const express = require('express');
const path    = require('path');
const fs      = require('fs');
const db      = require('../db/db');
const auth    = require('../middleware/auth');
const upload  = require('../middleware/upload');

const router = express.Router();

// GET /api/documents
router.get('/', auth, async (req, res) => {
  const database = await db;
  const docs = await database.all(
    'SELECT * FROM documents WHERE user_id=? ORDER BY uploaded_at DESC',
    [req.user.id]
  );
  res.json(docs);
});

// POST /api/documents
router.post('/', auth, upload.single('file'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
  const { doc_type = 'other', title } = req.body;
  const database = await db;
  const { lastID } = await database.run(
    `INSERT INTO documents (user_id, doc_type, title, file_path, file_name, file_size)
     VALUES (?,?,?,?,?,?)`,
    [
      req.user.id, doc_type,
      title || req.file.originalname,
      `/uploads/${req.file.filename}`,
      req.file.originalname,
      req.file.size,
    ]
  );
  const doc = await database.get('SELECT * FROM documents WHERE id=?', [lastID]);
  await database.run(
    `INSERT INTO notifications (user_id, message, type) VALUES (?,?,?)`,
    [req.user.id, `Document uploaded: "${doc.title}" (${doc_type}).`, 'info']
  );
  res.status(201).json(doc);
});

// DELETE /api/documents/:id
router.delete('/:id', auth, async (req, res) => {
  const database = await db;
  const doc = await database.get(
    'SELECT * FROM documents WHERE id=? AND user_id=?',
    [req.params.id, req.user.id]
  );
  if (doc) {
    const fp = path.join(__dirname, '..', doc.file_path);
    if (fs.existsSync(fp)) fs.unlinkSync(fp);
    await database.run('DELETE FROM documents WHERE id=?', [req.params.id]);
  }
  res.json({ success: true });
});

module.exports = router;
