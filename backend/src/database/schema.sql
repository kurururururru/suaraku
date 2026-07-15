-- SuaraKu E-Voting System Database Schema
-- Hybrid Cryptography: AES-GCM + HMAC-SHA256 + RSA Digital Signature

-- USERS TABLE
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  nim TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  password TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'VOTER' CHECK(role IN ('ADMIN', 'VOTER')),
  public_key TEXT,
  has_voted INTEGER NOT NULL DEFAULT 0,
  voted_at TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- ELECTIONS TABLE
CREATE TABLE IF NOT EXISTS elections (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  title TEXT NOT NULL,
  description TEXT,
  start_date TEXT NOT NULL,
  end_date TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'PENDING' 
    CHECK(status IN ('PENDING','ACTIVE','CLOSED','RESULTS_PUBLISHED')),
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- CANDIDATES TABLE
CREATE TABLE IF NOT EXISTS candidates (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  election_id TEXT NOT NULL,
  order_number INTEGER NOT NULL,
  name TEXT NOT NULL,
  current_role TEXT NOT NULL,
  tagline TEXT,
  vision TEXT NOT NULL,
  mission TEXT NOT NULL,
  experience TEXT NOT NULL,
  photo_url TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (election_id) REFERENCES elections(id)
);

-- VOTES TABLE
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
);

-- AUDIT LOGS TABLE
CREATE TABLE IF NOT EXISTS audit_logs (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  action TEXT NOT NULL,
  user_id TEXT,
  metadata TEXT,
  ip_address TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
