module.exports = `CREATE TABLE IF NOT EXISTS notifications (
  id         INTEGER  PRIMARY KEY AUTOINCREMENT,
  user_id    INTEGER  NOT NULL,
  message    TEXT     NOT NULL,
  type       TEXT     DEFAULT 'info',
  read       INTEGER  DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
)`;
