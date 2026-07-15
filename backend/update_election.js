const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./database.db');

db.serialize(() => {
  db.run("UPDATE elections SET status = 'ACTIVE' WHERE status = 'PENDING'", function(err) {
    if (err) {
      console.error(err.message);
    } else {
      console.log(`Row(s) updated: ${this.changes}`);
    }
  });
});

db.close();
