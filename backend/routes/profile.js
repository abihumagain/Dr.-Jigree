const express = require('express');
const db      = require('../db/db');
const auth    = require('../middleware/auth');
const upload  = require('../middleware/upload');

const router = express.Router();

// GET /api/profile
router.get('/', auth, async (req, res) => {
  const database = await db;
  const user = await database.get(
    `SELECT id, full_name, email, date_of_birth, gender, blood_type,
            phone, address, emergency_contact, profile_picture, created_at
     FROM users WHERE id = ?`,
    [req.user.id]
  );
  res.json(user);
});

// PUT /api/profile
router.put('/', auth, async (req, res) => {
  const { full_name, date_of_birth, gender, blood_type, phone, address, emergency_contact } = req.body;
  const database = await db;
  await database.run(
    `UPDATE users
     SET full_name=?, date_of_birth=?, gender=?, blood_type=?, phone=?, address=?, emergency_contact=?
     WHERE id=?`,
    [full_name, date_of_birth, gender, blood_type, phone, address, emergency_contact, req.user.id]
  );
  const user = await database.get(
    `SELECT id, full_name, email, date_of_birth, gender, blood_type,
            phone, address, emergency_contact, profile_picture, created_at
     FROM users WHERE id = ?`,
    [req.user.id]
  );
  res.json(user);
});

// POST /api/profile/picture
router.post('/picture', auth, upload.single('picture'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
  const url = `/uploads/${req.file.filename}`;
  const database = await db;
  await database.run('UPDATE users SET profile_picture=? WHERE id=?', [url, req.user.id]);
  res.json({ profile_picture: url });
});

module.exports = router;
