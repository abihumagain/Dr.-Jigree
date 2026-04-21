const express = require('express');
const db      = require('../db/db');
const auth    = require('../middleware/auth');

const router = express.Router();

// GET /api/appointments
router.get('/', auth, async (req, res) => {
  const database = await db;
  const appts = await database.all(
    'SELECT * FROM appointments WHERE user_id=? ORDER BY appointment_date, appointment_time',
    [req.user.id]
  );
  res.json(appts);
});

// POST /api/appointments
router.post('/', auth, async (req, res) => {
  const { title, doctor_name, specialty, location, appointment_date, appointment_time, notes } = req.body;
  if (!title || !appointment_date)
    return res.status(400).json({ error: 'title and appointment_date required' });
  const database = await db;
  const { lastID } = await database.run(
    `INSERT INTO appointments
     (user_id, title, doctor_name, specialty, location, appointment_date, appointment_time, notes)
     VALUES (?,?,?,?,?,?,?,?)`,
    [req.user.id, title, doctor_name, specialty, location, appointment_date, appointment_time, notes]
  );
  const appt = await database.get('SELECT * FROM appointments WHERE id=?', [lastID]);
  await database.run(
    `INSERT INTO notifications (user_id, message, type) VALUES (?,?,?)`,
    [req.user.id, `Appointment scheduled: "${title}"${doctor_name ? ' with ' + doctor_name : ''} on ${appointment_date}.`, 'info']
  );
  res.status(201).json(appt);
});

// PUT /api/appointments/:id
router.put('/:id', auth, async (req, res) => {
  const { title, doctor_name, specialty, location, appointment_date, appointment_time, status, notes } = req.body;
  const database = await db;
  await database.run(
    `UPDATE appointments
     SET title=?, doctor_name=?, specialty=?, location=?,
         appointment_date=?, appointment_time=?, status=?, notes=?
     WHERE id=? AND user_id=?`,
    [title, doctor_name, specialty, location, appointment_date, appointment_time,
     status, notes, req.params.id, req.user.id]
  );
  const appt = await database.get('SELECT * FROM appointments WHERE id=?', [req.params.id]);
  if (status) {
    const statusLabels = { completed: 'marked as completed', cancelled: 'cancelled', scheduled: 'rescheduled' };
    await database.run(
      `INSERT INTO notifications (user_id, message, type) VALUES (?,?,?)`,
      [req.user.id, `Appointment "${title}" ${statusLabels[status] || 'updated'}.`, 'info']
    );
  }
  res.json(appt);
});

// DELETE /api/appointments/:id
router.delete('/:id', auth, async (req, res) => {
  const database = await db;
  await database.run(
    'DELETE FROM appointments WHERE id=? AND user_id=?',
    [req.params.id, req.user.id]
  );
  res.json({ success: true });
});

module.exports = router;
