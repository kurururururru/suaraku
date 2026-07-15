const sqlite3 = require('sqlite3');
const { open } = require('sqlite');
const path = require('path');

async function resetVotes() {
  const dbPath = path.join(__dirname, 'database.db');
  const db = await open({
    filename: dbPath,
    driver: sqlite3.Database
  });

  const users = await db.all('SELECT nim, has_voted, public_key FROM users WHERE role = "VOTER"');
  console.log('Current voter statuses:');
  console.table(users);

  // Reset all votes
  await db.run('UPDATE users SET has_voted = 0, public_key = NULL, voted_at = NULL WHERE role = "VOTER"');
  await db.run('DELETE FROM votes');
  
  console.log('Successfully reset all voters to has_voted = 0 and cleared public keys.');
  console.log('Successfully deleted all records from the votes table.');
  
  const usersAfter = await db.all('SELECT nim, has_voted FROM users WHERE role = "VOTER"');
  console.log('Voter statuses after reset:');
  console.table(usersAfter);
}

resetVotes().catch(console.error);
