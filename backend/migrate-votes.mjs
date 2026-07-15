import sqlite3 from 'sqlite3';
import path from 'path';

const dbPath = path.resolve(process.cwd(), 'database.db');
const db = new sqlite3.Database(dbPath);

db.serialize(() => {
  db.run('DROP TABLE IF EXISTS votes', (err) => {
    if (err) {
      console.error('Error dropping table:', err);
    } else {
      console.log('votes table dropped successfully.');
    }
  });

  db.run(`
    CREATE TABLE IF NOT EXISTS votes (
      id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
      voter_id TEXT UNIQUE NOT NULL,
      election_id TEXT NOT NULL,
      encrypted_payload TEXT NOT NULL,
      iv TEXT NOT NULL,
      hmac_signature TEXT NOT NULL,
      rsa_signature TEXT NOT NULL,
      verification_code TEXT UNIQUE NOT NULL,
      is_valid INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (voter_id) REFERENCES users(id),
      FOREIGN KEY (election_id) REFERENCES elections(id)
    )
  `, (err) => {
    if (err) {
      console.error('Error creating table:', err);
    } else {
      console.log('votes table recreated successfully.');
    }
    
    // Also reset all users has_voted = 0 to allow them to test voting again!
    db.run('UPDATE users SET has_voted = 0, voted_at = NULL', (err2) => {
       if (err2) console.error(err2);
       else console.log('Reset all users has_voted = 0 successfully.');
       db.close();
    });
  });
});
