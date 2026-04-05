const express   = require('express');
const bcrypt    = require('bcryptjs');
const jwt       = require('jsonwebtoken');
const db        = require('../db/db');
const adminAuth = require('../middleware/adminAuth');
const auth      = require('../middleware/auth');
const { JWT_SECRET } = require('../config');

const router = express.Router();

// All routes below require admin token
// ─────────────────────────────────────────────────────────────────────────────

// GET /api/admin/stats  — platform-wide overview numbers
router.get('/stats', adminAuth, async (req, res) => {
  const database = await db;
  const [users, assessments, medications, appointments, documents, records] = await Promise.all([
    database.get('SELECT COUNT(*) AS total, SUM(is_admin) AS admins, SUM(CASE WHEN is_active=0 THEN 1 ELSE 0 END) AS inactive FROM users'),
    database.get('SELECT COUNT(*) AS total FROM risk_assessments'),
    database.get('SELECT COUNT(*) AS total FROM medications'),
    database.get('SELECT COUNT(*) AS total FROM appointments'),
    database.get('SELECT COUNT(*) AS total FROM documents'),
    database.get('SELECT COUNT(*) AS total FROM health_records'),
  ]);
  const recentUsers = await database.all(
    'SELECT id, full_name, email, is_admin, is_active, created_at FROM users ORDER BY created_at DESC LIMIT 5'
  );
  res.json({ users, assessments, medications, appointments, documents, records, recentUsers });
});

// GET /api/admin/users  — list all users with summary stats
router.get('/users', adminAuth, async (req, res) => {
  const database = await db;
  const users = await database.all(`
    SELECT
      u.id, u.full_name, u.email, u.gender, u.date_of_birth,
      u.phone, u.is_admin, u.is_active, u.created_at,
      (SELECT COUNT(*) FROM risk_assessments WHERE user_id = u.id) AS assessment_count,
      (SELECT COUNT(*) FROM medications       WHERE user_id = u.id) AS medication_count,
      (SELECT COUNT(*) FROM appointments      WHERE user_id = u.id) AS appointment_count,
      (SELECT risk_label FROM risk_assessments WHERE user_id = u.id ORDER BY assessed_at DESC LIMIT 1) AS latest_risk
    FROM users u
    ORDER BY u.created_at DESC
  `);
  res.json(users);
});

// GET /api/admin/users/:id  — full profile + all health data for a user
router.get('/users/:id', adminAuth, async (req, res) => {
  const database = await db;
  const user = await database.get(
    'SELECT id, full_name, email, gender, date_of_birth, phone, address, blood_type, emergency_contact, profile_picture, is_admin, is_active, created_at FROM users WHERE id = ?',
    [req.params.id]
  );
  if (!user) return res.status(404).json({ error: 'User not found' });

  const [assessments, medications, appointments, records, documents] = await Promise.all([
    database.all('SELECT * FROM risk_assessments WHERE user_id=? ORDER BY assessed_at DESC', [user.id]),
    database.all('SELECT * FROM medications       WHERE user_id=? ORDER BY created_at DESC',  [user.id]),
    database.all('SELECT * FROM appointments      WHERE user_id=? ORDER BY appointment_date DESC', [user.id]),
    database.all('SELECT * FROM health_records    WHERE user_id=? ORDER BY recorded_at DESC', [user.id]),
    database.all('SELECT * FROM documents         WHERE user_id=? ORDER BY uploaded_at DESC', [user.id]),
  ]);
  res.json({ user, assessments, medications, appointments, records, documents });
});

// PUT /api/admin/users/:id  — update role / active status / basic info
router.put('/users/:id', adminAuth, async (req, res) => {
  const { is_admin, is_active, full_name, email } = req.body;
  const database = await db;
  const user = await database.get('SELECT id FROM users WHERE id = ?', [req.params.id]);
  if (!user) return res.status(404).json({ error: 'User not found' });

  const fields = [];
  const vals   = [];
  if (is_admin  !== undefined) { fields.push('is_admin=?');  vals.push(is_admin  ? 1 : 0); }
  if (is_active !== undefined) { fields.push('is_active=?'); vals.push(is_active ? 1 : 0); }
  if (full_name !== undefined) { fields.push('full_name=?'); vals.push(full_name); }
  if (email     !== undefined) { fields.push('email=?');     vals.push(email); }
  if (!fields.length) return res.status(400).json({ error: 'Nothing to update' });

  vals.push(req.params.id);
  await database.run(`UPDATE users SET ${fields.join(',')} WHERE id=?`, vals);
  const updated = await database.get(
    'SELECT id, full_name, email, is_admin, is_active, created_at FROM users WHERE id=?',
    [req.params.id]
  );
  res.json(updated);
});

// DELETE /api/admin/users/:id  — delete user and all their data
router.delete('/users/:id', adminAuth, async (req, res) => {
  // Prevent admins from deleting themselves
  if (Number(req.params.id) === req.user.id) {
    return res.status(400).json({ error: 'You cannot delete your own account' });
  }
  const database = await db;
  const user = await database.get('SELECT id FROM users WHERE id = ?', [req.params.id]);
  if (!user) return res.status(404).json({ error: 'User not found' });

  await Promise.all([
    database.run('DELETE FROM risk_assessments WHERE user_id=?', [req.params.id]),
    database.run('DELETE FROM medications       WHERE user_id=?', [req.params.id]),
    database.run('DELETE FROM appointments      WHERE user_id=?', [req.params.id]),
    database.run('DELETE FROM health_records    WHERE user_id=?', [req.params.id]),
    database.run('DELETE FROM documents         WHERE user_id=?', [req.params.id]),
    database.run('DELETE FROM notifications     WHERE user_id=?', [req.params.id]),
  ]);
  await database.run('DELETE FROM users WHERE id=?', [req.params.id]);
  res.json({ success: true });
});

// POST /api/admin/users/:id/reset-password  — set a new password for a user
router.post('/users/:id/reset-password', adminAuth, async (req, res) => {
  const { password } = req.body;
  if (!password || password.length < 8) return res.status(400).json({ error: 'Password must be at least 8 characters' });
  const hash = await bcrypt.hash(password, 12);
  const database = await db;
  const user = await database.get('SELECT id FROM users WHERE id = ?', [req.params.id]);
  if (!user) return res.status(404).json({ error: 'User not found' });
  await database.run('UPDATE users SET password_hash=? WHERE id=?', [hash, req.params.id]);
  res.json({ success: true });
});

// POST /api/admin/users/:id/impersonate  — get a short-lived token to view app as that user
router.post('/users/:id/impersonate', adminAuth, async (req, res) => {
  const database = await db;
  const user = await database.get('SELECT id, email, full_name FROM users WHERE id=?', [req.params.id]);
  if (!user) return res.status(404).json({ error: 'User not found' });
  // 1-hour impersonation token
  const token = jwt.sign({ id: user.id, email: user.email, impersonated_by: req.user.id }, JWT_SECRET, { expiresIn: '1h' });
  res.json({ token, user });
});

// POST /api/admin/create-admin  — promote a user to admin by email (also works for first-time setup)
// Protected by regular auth (the requester must already be admin OR this is the first admin being created)
router.post('/create-admin', auth, async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Email is required' });

  const database = await db;

  // Allow if caller is already admin OR if no admins exist yet (first-time setup)
  const callerRow  = await database.get('SELECT is_admin FROM users WHERE id=?', [req.user.id]);
  const adminCount = await database.get('SELECT COUNT(*) AS cnt FROM users WHERE is_admin=1');
  const isFirstAdmin = adminCount.cnt === 0;

  if (!isFirstAdmin && !callerRow?.is_admin) {
    return res.status(403).json({ error: 'Admin access required' });
  }

  const target = await database.get('SELECT id, full_name, email FROM users WHERE email=?', [email]);
  if (!target) return res.status(404).json({ error: 'No user with that email address' });

  await database.run('UPDATE users SET is_admin=1 WHERE id=?', [target.id]);
  res.json({ success: true, message: `${target.full_name} (${target.email}) is now an admin` });
});

module.exports = router;
