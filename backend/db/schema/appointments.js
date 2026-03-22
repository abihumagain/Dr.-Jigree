module.exports = `CREATE TABLE IF NOT EXISTS appointments (
  id               INTEGER  PRIMARY KEY AUTOINCREMENT,
  user_id          INTEGER  NOT NULL,
  title            TEXT     NOT NULL,
  doctor_name      TEXT,
  specialty        TEXT,
  location         TEXT,
  appointment_date TEXT     NOT NULL,
  appointment_time TEXT,
  status           TEXT     DEFAULT 'scheduled',
  notes            TEXT,
  created_at       DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
)`;
