const express = require('express');
const db      = require('../db/db');
const auth    = require('../middleware/auth');

const router = express.Router();

// GET /api/medications
router.get('/', auth, async (req, res) => {
  const database = await db;
  const meds = await database.all(
    'SELECT * FROM medications WHERE user_id=? ORDER BY created_at DESC',
    [req.user.id]
  );
  res.json(meds);
});

// POST /api/medications
router.post('/', auth, async (req, res) => {
  const { name, dosage, frequency, start_date, end_date, prescriber, notes } = req.body;
  if (!name) return res.status(400).json({ error: 'name required' });
  const database = await db;
  const { lastID } = await database.run(
    `INSERT INTO medications (user_id, name, dosage, frequency, start_date, end_date, prescriber, notes)
     VALUES (?,?,?,?,?,?,?,?)`,
    [req.user.id, name, dosage, frequency, start_date, end_date, prescriber, notes]
  );
  const med = await database.get('SELECT * FROM medications WHERE id=?', [lastID]);
  res.status(201).json(med);
});

// PUT /api/medications/:id
router.put('/:id', auth, async (req, res) => {
  const { name, dosage, frequency, start_date, end_date, prescriber, notes, active } = req.body;
  const database = await db;
  await database.run(
    `UPDATE medications
     SET name=?, dosage=?, frequency=?, start_date=?, end_date=?, prescriber=?, notes=?, active=?
     WHERE id=? AND user_id=?`,
    [name, dosage, frequency, start_date, end_date, prescriber, notes, active, req.params.id, req.user.id]
  );
  const med = await database.get('SELECT * FROM medications WHERE id=?', [req.params.id]);
  res.json(med);
});

// DELETE /api/medications/:id
router.delete('/:id', auth, async (req, res) => {
  const database = await db;
  await database.run(
    'DELETE FROM medications WHERE id=? AND user_id=?',
    [req.params.id, req.user.id]
  );
  res.json({ success: true });
});

module.exports = router;
