module.exports = `CREATE TABLE IF NOT EXISTS documents (
  id          INTEGER  PRIMARY KEY AUTOINCREMENT,
  user_id     INTEGER  NOT NULL,
  doc_type    TEXT     NOT NULL,
  title       TEXT     NOT NULL,
  file_path   TEXT     NOT NULL,
  file_name   TEXT     NOT NULL,
  file_size   INTEGER,
  uploaded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
)`;
