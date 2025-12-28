const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3');

const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
const dbFile = path.join(dataDir, 'db.sqlite');
const db = new sqlite3.Database(dbFile);

db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    age INTEGER,
    height_cm REAL,
    weight_kg REAL,
    smoking INTEGER,
    meta TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  console.log('DB initialized at', dbFile);
});

db.close();
