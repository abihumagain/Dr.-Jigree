const express    = require('express');
const bcrypt     = require('bcryptjs');
const jwt        = require('jsonwebtoken');
const db         = require('../db/db');
const { JWT_SECRET } = require('../config');

const router = express.Router();

// POST /api/auth/signup
router.post('/signup', async (req, res) => {
  const { full_name, email, password, date_of_birth, gender } = req.body;
  if (!full_name || !email || !password)
    return res.status(400).json({ error: 'full_name, email and password are required' });
  try {
    const database = await db;
    const exists = await database.get('SELECT id FROM users WHERE email = ?', [email]);
    if (exists) return res.status(409).json({ error: 'Email already registered' });
    const hash = await bcrypt.hash(password, 10);
    const { lastID } = await database.run(
      `INSERT INTO users (full_name, email, password_hash, date_of_birth, gender)
       VALUES (?, ?, ?, ?, ?)`,
      [full_name, email, hash, date_of_birth || null, gender || null]
    );
    await database.run(
      `INSERT INTO notifications (user_id, message, type) VALUES (?, ?, ?)`,
      [lastID, `Welcome to Dr. Jigree, ${full_name}! Start by completing your health assessment.`, 'welcome']
    );
    const token = jwt.sign({ id: lastID, email }, JWT_SECRET, { expiresIn: '7d' });
    res.status(201).json({ token, user: { id: lastID, full_name, email } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password)
    return res.status(400).json({ error: 'email and password required' });
  try {
    const database = await db;
    const user = await database.get('SELECT * FROM users WHERE email = ?', [email]);
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });
    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) return res.status(401).json({ error: 'Invalid credentials' });
    const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });
    const { password_hash, ...safeUser } = user;
    res.json({ token, user: safeUser });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
