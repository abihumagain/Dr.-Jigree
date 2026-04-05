module.exports = `CREATE TABLE IF NOT EXISTS users (
  id                INTEGER  PRIMARY KEY AUTOINCREMENT,
  full_name         TEXT     NOT NULL,
  email             TEXT     NOT NULL UNIQUE,
  password_hash     TEXT     NOT NULL,
  date_of_birth     TEXT,
  gender            TEXT,
  blood_type        TEXT,
  phone             TEXT,
  address           TEXT,
  emergency_contact TEXT,
  profile_picture   TEXT,
  is_admin          INTEGER  DEFAULT 0,
  is_active         INTEGER  DEFAULT 1,
  created_at        DATETIME DEFAULT CURRENT_TIMESTAMP
)`;
