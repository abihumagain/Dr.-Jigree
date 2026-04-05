const jwt            = require('jsonwebtoken');
const { JWT_SECRET } = require('../config');
const db             = require('../db/db');

async function adminAuth(req, res, next) {
  const header = req.headers.authorization;
  if (!header) return res.status(401).json({ error: 'No token' });
  try {
    const token = header.split(' ')[1];
    const payload = jwt.verify(token, JWT_SECRET);
    const database = await db;
    const user = await database.get('SELECT id, email, is_admin FROM users WHERE id = ?', [payload.id]);
    if (!user)          return res.status(401).json({ error: 'User not found' });
    if (!user.is_admin) return res.status(403).json({ error: 'Admin access required' });
    req.user = payload;
    next();
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
}

module.exports = adminAuth;
