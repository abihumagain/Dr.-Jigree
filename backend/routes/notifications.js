const express = require('express');
const db      = require('../db/db');
const auth    = require('../middleware/auth');

const router = express.Router();

// GET /api/notifications
router.get('/', auth, async (req, res) => {
  const database = await db;
  const notifs = await database.all(
    'SELECT * FROM notifications WHERE user_id=? ORDER BY created_at DESC LIMIT 50',
    [req.user.id]
  );
  res.json(notifs);
});

// PUT /api/notifications/:id/read
router.put('/:id/read', auth, async (req, res) => {
  const database = await db;
  await database.run(
    'UPDATE notifications SET read=1 WHERE id=? AND user_id=?',
    [req.params.id, req.user.id]
  );
  res.json({ success: true });
});

// PUT /api/notifications/read-all
router.put('/read-all', auth, async (req, res) => {
  const database = await db;
  await database.run('UPDATE notifications SET read=1 WHERE user_id=?', [req.user.id]);
  res.json({ success: true });
});

module.exports = router;
