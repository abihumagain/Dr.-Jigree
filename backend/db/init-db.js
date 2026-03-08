const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3');

const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
const dbFile = path.join(dataDir, 'db.sqlite');
const db = new sqlite3.Database(dbFile);

db.serialize(() => {
  // ── Users ────────────────────────────────────────────────
  db.run(`CREATE TABLE IF NOT EXISTS users (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    full_name       TEXT    NOT NULL,
    email           TEXT    NOT NULL UNIQUE,
    password_hash   TEXT    NOT NULL,
    date_of_birth   TEXT,
    gender          TEXT,
    blood_type      TEXT,
    phone           TEXT,
    address         TEXT,
    emergency_contact TEXT,
    profile_picture TEXT,
    created_at      DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // ── Health Records (vitals & lab results) ────────────────
  db.run(`CREATE TABLE IF NOT EXISTS health_records (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id       INTEGER NOT NULL,
    record_type   TEXT    NOT NULL,   -- 'vital' | 'lab'
    title         TEXT    NOT NULL,
    -- vitals
    systolic_bp   REAL,
    diastolic_bp  REAL,
    heart_rate    INTEGER,
    temperature   REAL,
    oxygen_sat    REAL,
    -- labs
    glucose       REAL,
    cholesterol   REAL,
    hdl           REAL,
    ldl           REAL,
    triglycerides REAL,
    hba1c         REAL,
    -- general
    notes         TEXT,
    recorded_at   DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  )`);

  // ── Risk Assessments ─────────────────────────────────────
  db.run(`CREATE TABLE IF NOT EXISTS risk_assessments (
    id                INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id           INTEGER NOT NULL,
    age               INTEGER,
    height_cm         REAL,
    weight_kg         REAL,
    bmi               REAL,
    smoking           INTEGER,
    alcohol           INTEGER,
    exercise_days     INTEGER,
    systolic_bp       REAL,
    diastolic_bp      REAL,
    glucose           REAL,
    cholesterol       REAL,
    family_history    INTEGER,
    stress_level      INTEGER,
    risk_score        REAL,
    risk_label        TEXT,
    recommendations   TEXT,
    assessed_at       DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  )`);

  // ── Medications ──────────────────────────────────────────
  db.run(`CREATE TABLE IF NOT EXISTS medications (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id       INTEGER NOT NULL,
    name          TEXT    NOT NULL,
    dosage        TEXT,
    frequency     TEXT,
    start_date    TEXT,
    end_date      TEXT,
    prescriber    TEXT,
    notes         TEXT,
    active        INTEGER DEFAULT 1,
    created_at    DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  )`);

  // ── Appointments ─────────────────────────────────────────
  db.run(`CREATE TABLE IF NOT EXISTS appointments (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id         INTEGER NOT NULL,
    title           TEXT    NOT NULL,
    doctor_name     TEXT,
    specialty       TEXT,
    location        TEXT,
    appointment_date TEXT   NOT NULL,
    appointment_time TEXT,
    status          TEXT    DEFAULT 'scheduled',
    notes           TEXT,
    created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  )`);

  // ── Documents ────────────────────────────────────────────
  db.run(`CREATE TABLE IF NOT EXISTS documents (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id       INTEGER NOT NULL,
    doc_type      TEXT    NOT NULL,  -- 'report' | 'prescription' | 'image' | 'other'
    title         TEXT    NOT NULL,
    file_path     TEXT    NOT NULL,
    file_name     TEXT    NOT NULL,
    file_size     INTEGER,
    uploaded_at   DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  )`);

  // ── Notifications ────────────────────────────────────────
  db.run(`CREATE TABLE IF NOT EXISTS notifications (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id     INTEGER NOT NULL,
    message     TEXT    NOT NULL,
    type        TEXT    DEFAULT 'info',
    read        INTEGER DEFAULT 0,
    created_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  )`);

  console.log('✅  DB initialised at', dbFile);
});

db.close();
