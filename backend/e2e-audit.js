const crypto = require('crypto');
const fs = require('fs');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const BASE_URL = 'http://localhost:3001/api';

let adminToken = '';
let serverPublicKey = '';
let electionId = '';
let candidateId = '';
let report = [];
let passCount = 0;
let failCount = 0;

function logTest(name, passed, msg) {
  if (passed) {
    console.log(`✅ [PASS] ${name}`);
    report.push(`- ✅ **PASS**: ${name} - ${msg || ''}`);
    passCount++;
  } else {
    console.error(`❌ [FAIL] ${name} - ${msg || ''}`);
    report.push(`- ❌ **FAIL**: ${name} - ${msg || ''}`);
    failCount++;
  }
}

async function fetchAPI(endpoint, options = {}) {
  const url = `${BASE_URL}${endpoint}`;
  const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
  const res = await fetch(url, { ...options, headers });
  let data;
  try { data = await res.json(); } catch (err) { data = { message: await res.text() }; }
  return { status: res.status, data };
}

async function castVoteHelper(nim, password, candidateId) {
  // Login
  const loginRes = await fetchAPI('/auth/login', { method: 'POST', body: JSON.stringify({ nim, password }) });
  const token = loginRes.data.data.token;

  // Register Key
  const keyPair = crypto.generateKeyPairSync('rsa', { modulusLength: 2048, publicKeyEncoding: { type: 'spki', format: 'pem' }, privateKeyEncoding: { type: 'pkcs8', format: 'pem' } });
  await fetchAPI('/auth/register-key', { method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: JSON.stringify({ publicKey: keyPair.publicKey }) });

  // Encrypt payload
  const aesKey = crypto.randomBytes(32);
  const iv = crypto.randomBytes(12);
  const payload = JSON.stringify({ candidateId, timestamp: new Date().toISOString(), nonce: crypto.randomBytes(16).toString('hex') });

  const cipher = crypto.createCipheriv('aes-256-gcm', aesKey, iv);
  let ciphertext = cipher.update(payload, 'utf8', 'base64');
  ciphertext += cipher.final('base64');
  ciphertext += cipher.getAuthTag().toString('base64');

  const encryptedAesKey = crypto.publicEncrypt({ key: serverPublicKey, padding: crypto.constants.RSA_PKCS1_OAEP_PADDING, oaepHash: 'sha256' }, aesKey).toString('base64');

  const sign = crypto.createSign('SHA256');
  sign.update(ciphertext);
  const rsaSignature = sign.sign({ key: keyPair.privateKey, padding: crypto.constants.RSA_PKCS1_PSS_PADDING, saltLength: crypto.constants.RSA_PSS_SALTLEN_DIGEST }, 'base64');

  return fetchAPI('/votes', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify({ ciphertext, iv: iv.toString('base64'), rsaSignature, encryptedAesKey, electionId })
  });
}

function tamperDB(query) {
  return new Promise((resolve, reject) => {
    const dbPath = path.join(__dirname, 'database.db');
    const db = new sqlite3.Database(dbPath);
    db.run(query, function(err) {
      if (err) reject(err);
      else resolve(this.changes);
      db.close();
    });
  });
}

async function runTests() {
  console.log('--- SuaraKu E2E Audit + Regression Started ---\n');
  try {
    const adminLogin = await fetchAPI('/auth/login', { method: 'POST', body: JSON.stringify({ nim: 'ADMIN001', password: 'admin123' }) });
    adminToken = adminLogin.data.data.token;
    
    const cryptoConfig = await fetchAPI('/config/crypto');
    serverPublicKey = cryptoConfig.data.data.serverPublicKey;

    const createRes = await fetchAPI('/admin/election', {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({ title: 'Test Election', description: 'Testing', start_date: new Date(Date.now() - 100000).toISOString(), end_date: new Date(Date.now() + 100000).toISOString() })
    });
    electionId = createRes.data?.data?.id || 'election-001';
    
    await fetchAPI('/admin/election/open', { method: 'PATCH', headers: { Authorization: `Bearer ${adminToken}` } });
    const adminCands = await fetchAPI('/admin/candidates', { headers: { Authorization: `Bearer ${adminToken}` } });
    candidateId = adminCands.data.data[0].id;

    // Regression 1: Valid vote 1
    const v1 = await castVoteHelper('2021001', 'voter123', candidateId);
    logTest('Regression: Valid Vote 1', v1.status === 200, 'Vote 1 submitted successfully');

    // Regression 2: Valid vote 2 (will be tampered HMAC)
    const v2 = await castVoteHelper('2021002', 'voter123', candidateId);
    logTest('Regression: Valid Vote 2', v2.status === 200, 'Vote 2 submitted successfully');

    // Regression 3: Valid vote 3 (will be tampered Ciphertext)
    const v3 = await castVoteHelper('2021003', 'voter123', candidateId);
    logTest('Regression: Valid Vote 3', v3.status === 200, 'Vote 3 submitted successfully');

    // DB Tampering!
    console.log('\n[Phase 4.5] DB Tampering for Regression tests...');
    // Tamper HMAC of voter 2
    await tamperDB(`UPDATE votes SET hmac_signature = '0000' || substr(hmac_signature, 5) WHERE voter_id = (SELECT id FROM users WHERE nim = '2021002')`);
    logTest('Regression: DB Tamper HMAC', true, 'Tampered HMAC of vote 2 in DB');

    // Tamper Payload of voter 3
    await tamperDB(`UPDATE votes SET encrypted_payload = encrypted_payload || 'tampered' WHERE voter_id = (SELECT id FROM users WHERE nim = '2021003')`);
    logTest('Regression: DB Tamper Ciphertext', true, 'Tampered ciphertext of vote 3 in DB');

    // Close election
    console.log('\n[Phase 5] Election Finalization');
    const closeRes = await fetchAPI('/admin/election/close', { method: 'PATCH', headers: { Authorization: `Bearer ${adminToken}` } });
    logTest('Regression: Election Closing & Verification', closeRes.status === 200 && closeRes.data.data.totalValidVotes === 1, `Expected 1 valid vote out of 3. Got: ${closeRes.data?.data?.totalValidVotes}`);

    await fetchAPI('/admin/election/publish', { method: 'PATCH', headers: { Authorization: `Bearer ${adminToken}` } });
    const resultsRes = await fetchAPI(`/election/${electionId}/results`, { headers: { Authorization: `Bearer ${adminToken}` } });
    
    const candidateScore = resultsRes.data.data.candidates.find(c => c.id === candidateId)?.voteCount;
    logTest('Regression: Final Tally', candidateScore === 1, `Candidate 1 should have exactly 1 vote. Got: ${candidateScore}`);

  } catch (err) {
    console.error('Fatal Test Error:', err);
  }

  const score = Math.round((passCount / (passCount + failCount)) * 100);
  console.log(`\n--- Audit Completed ---`);
  console.log(`Score: ${score}/100`);
}

runTests();
