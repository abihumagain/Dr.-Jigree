module.exports = `CREATE TABLE IF NOT EXISTS medications (
  id         INTEGER  PRIMARY KEY AUTOINCREMENT,
  user_id    INTEGER  NOT NULL,
  name       TEXT     NOT NULL,
  dosage     TEXT,
  frequency  TEXT,
  start_date TEXT,
  end_date   TEXT,
  prescriber TEXT,
  notes      TEXT,
  active     INTEGER  DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
)`;
