const express = require('express');
const db      = require('../db/db');
const auth    = require('../middleware/auth');

const router = express.Router();

// GET /api/health-records
router.get('/', auth, async (req, res) => {
  const database = await db;
  const records = await database.all(
    'SELECT * FROM health_records WHERE user_id=? ORDER BY recorded_at DESC',
    [req.user.id]
  );
  res.json(records);
});

// POST /api/health-records
router.post('/', auth, async (req, res) => {
  const {
    record_type, title, systolic_bp, diastolic_bp, heart_rate, temperature, oxygen_sat,
    glucose, cholesterol, hdl, ldl, triglycerides, hba1c, notes,
  } = req.body;
  if (!record_type || !title)
    return res.status(400).json({ error: 'record_type and title required' });
  const database = await db;
  const { lastID } = await database.run(
    `INSERT INTO health_records
     (user_id, record_type, title, systolic_bp, diastolic_bp, heart_rate, temperature,
      oxygen_sat, glucose, cholesterol, hdl, ldl, triglycerides, hba1c, notes)
     VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
    [req.user.id, record_type, title, systolic_bp, diastolic_bp, heart_rate, temperature,
     oxygen_sat, glucose, cholesterol, hdl, ldl, triglycerides, hba1c, notes]
  );
  const record = await database.get('SELECT * FROM health_records WHERE id=?', [lastID]);
  await database.run(
    `INSERT INTO notifications (user_id, message, type) VALUES (?,?,?)`,
    [req.user.id, `Health record logged: "${title}" (${record_type}).`, 'info']
  );
  res.status(201).json(record);
});

// DELETE /api/health-records/:id
router.delete('/:id', auth, async (req, res) => {
  const database = await db;
  await database.run(
    'DELETE FROM health_records WHERE id=? AND user_id=?',
    [req.params.id, req.user.id]
  );
  res.json({ success: true });
});

module.exports = router;
