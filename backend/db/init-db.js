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
  console.log('✅  DB initialised at', dbFile);
});

db.close();
