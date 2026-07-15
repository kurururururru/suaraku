const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./database.db');

db.serialize(() => {
  db.all("SELECT id, title, status, created_at FROM elections ORDER BY created_at DESC", [], (err, rows) => {
    if (err) {
      throw err;
    }
    console.log("ELECTIONS:");
    rows.forEach((row) => {
      console.log(row);
    });
  });
});

db.close();
