/**
 * Usage:  node scripts/make-admin.js <email>
 * Run from the backend/ directory.
 * Directly promotes a registered user to admin in the SQLite database.
 */
const path = require('path');
const sqlite3 = require('sqlite3');
const { open } = require('sqlite');

const email = process.argv[2];

if (!email) {
  console.error('Usage: node scripts/make-admin.js <email>');
  process.exit(1);
}

(async () => {
  const dbPath = path.join(__dirname, '..', 'db', 'data', 'db.sqlite');
  const db = await open({ filename: dbPath, driver: sqlite3.Database });

  // Ensure columns exist (migration may not have run yet)
  for (const col of ['is_admin INTEGER DEFAULT 0', 'is_active INTEGER DEFAULT 1']) {
    try { await db.run(`ALTER TABLE users ADD COLUMN ${col}`); } catch (_) {}
  }

  const user = await db.get('SELECT id, full_name, email, is_admin FROM users WHERE email = ?', [email]);

  if (!user) {
    console.error(`No user found with email: ${email}`);
    await db.close();
    process.exit(1);
  }

  if (user.is_admin) {
    console.log(`${user.full_name} (${user.email}) is already an admin.`);
    await db.close();
    process.exit(0);
  }

  await db.run('UPDATE users SET is_admin = 1 WHERE id = ?', [user.id]);
  console.log(`✓ ${user.full_name} (${user.email}) has been promoted to admin.`);
  console.log('  Log out and log back in for the change to take effect.');
  await db.close();
})();
