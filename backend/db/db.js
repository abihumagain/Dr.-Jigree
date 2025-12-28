const sqlite3 = require('sqlite3');
const { open } = require('sqlite');
const path = require('path');

const dbPath = path.join(__dirname, 'data', 'db.sqlite');

async function init() {
  const db = await open({
    filename: dbPath,
    driver: sqlite3.Database
  });
  return db;
}

module.exports = (async () => {
  const database = await init();
  return {
    run: (sql, params) => database.run(sql, params),
    get: (sql, params) => database.get(sql, params),
    all: (sql, params) => database.all(sql, params)
  };
})();
