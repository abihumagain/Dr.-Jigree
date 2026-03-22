const express = require('express');
const db      = require('../db/db');
const auth    = require('../middleware/auth');

const router = express.Router();

// GET /api/dashboard
router.get('/', auth, async (req, res) => {
  const database = await db;
  const uid = req.user.id;
  const [user, latestAssessment, recentRecords, activeMeds, upcomingAppts, unreadNotifs] =
    await Promise.all([
      database.get('SELECT full_name, profile_picture FROM users WHERE id=?', [uid]),
      database.get(
        'SELECT * FROM risk_assessments WHERE user_id=? ORDER BY assessed_at DESC LIMIT 1',
        [uid]
      ),
      database.all(
        'SELECT * FROM health_records WHERE user_id=? ORDER BY recorded_at DESC LIMIT 5',
        [uid]
      ),
      database.all(
        "SELECT * FROM medications WHERE user_id=? AND active=1 ORDER BY name",
        [uid]
      ),
      database.all(
        `SELECT * FROM appointments
         WHERE user_id=? AND status='scheduled' AND appointment_date >= date('now')
         ORDER BY appointment_date LIMIT 3`,
        [uid]
      ),
      database.get(
        'SELECT COUNT(*) as count FROM notifications WHERE user_id=? AND read=0',
        [uid]
      ),
    ]);

  res.json({
    user,
    latestAssessment,
    recentRecords,
    activeMeds,
    upcomingAppts,
    unreadCount: unreadNotifs?.count || 0,
  });
});

module.exports = router;
