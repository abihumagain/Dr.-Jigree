const fs      = require('fs');
const path    = require('path');
const sqlite3 = require('sqlite3');

// ── Per-table schema files ────────────────────────────────
const schemas = [
  require('./schema/users'),
  require('./schema/health-records'),
  require('./schema/assessments'),
  require('./schema/medications'),
  require('./schema/appointments'),
  require('./schema/documents'),
  require('./schema/notifications'),
];

const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

const dbFile = path.join(dataDir, 'db.sqlite');
const db     = new sqlite3.Database(dbFile);

db.serialize(() => {
  schemas.forEach(sql => db.run(sql));

  // ── Migrations: add columns to existing DBs that predate the schema change ──
  const migrations = [
    `ALTER TABLE users ADD COLUMN is_admin  INTEGER DEFAULT 0`,
    `ALTER TABLE users ADD COLUMN is_active INTEGER DEFAULT 1`,
  ];
  migrations.forEach(sql => {
    db.run(sql, err => {
      // "duplicate column name" = already applied — ignore safely
      if (err && !err.message.includes('duplicate column name')) {
        console.warn('Migration warning:', err.message);
      }
    });
  });

  console.log('✅  DB initialised at', dbFile);
});

db.close();
