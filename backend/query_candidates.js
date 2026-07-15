const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./database.db');

db.serialize(() => {
  db.all("SELECT id, name, election_id FROM candidates", [], (err, rows) => {
    if (err) {
      throw err;
    }
    console.log("CANDIDATES:");
    rows.forEach((row) => {
      console.log(row);
    });
  });
});

db.close();
