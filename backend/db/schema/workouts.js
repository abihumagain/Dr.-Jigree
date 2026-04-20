module.exports = [
  `CREATE TABLE IF NOT EXISTS workout_plans (
    id              INTEGER  PRIMARY KEY AUTOINCREMENT,
    user_id         INTEGER  NOT NULL,
    goal            TEXT     NOT NULL,
    fitness_level   TEXT     NOT NULL,
    days_per_week   INTEGER  NOT NULL,
    timeline_weeks  INTEGER  NOT NULL,
    weight_kg       REAL,
    height_cm       REAL,
    age             INTEGER,
    gender          TEXT,
    activity_level  TEXT,
    daily_calories  INTEGER,
    protein_g       INTEGER,
    carbs_g         INTEGER,
    fat_g           INTEGER,
    weekly_schedule TEXT,
    is_active       INTEGER  DEFAULT 1,
    created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  )`,
  `CREATE TABLE IF NOT EXISTS workout_logs (
    id           INTEGER  PRIMARY KEY AUTOINCREMENT,
    user_id      INTEGER  NOT NULL,
    plan_id      INTEGER  NOT NULL,
    week_number  INTEGER  NOT NULL,
    day_number   INTEGER  NOT NULL,
    day_name     TEXT,
    completed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (plan_id) REFERENCES workout_plans(id) ON DELETE CASCADE
  )`,
];
