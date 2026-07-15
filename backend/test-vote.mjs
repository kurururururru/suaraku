
import crypto from 'crypto';

const API_URL = 'http://localhost:3001/api';

async function testVote() {
  console.log('--- STARTING VOTE INTEGRATION TEST ---');
  
  // 1. Login as Voter
  console.log('1. Logging in as Voter...');
  let res = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ nim: '2021001', password: 'voter123' })
  });
  let data = await res.json();
  if (!data.success) throw new Error('Login failed: ' + data.message);
  const token = data.data.token;
  console.log('   Logged in successfully.');

  // 2. Generate RSA Key Pair for Voter
  console.log('2. Generating RSA Key Pair...');
  const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
    modulusLength: 2048,
    publicKeyEncoding: { type: 'spki', format: 'pem' },
    privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
  });

  // 3. Register Public Key (if needed)
  if (!data.data.user.hasPublicKey) {
    console.log('3. Registering Public Key...');
    res = await fetch(`${API_URL}/auth/register-key`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ publicKey })
    });
    data = await res.json();
    if (!data.success) throw new Error('Key registration failed: ' + data.message);
  }

  // 4. Fetch active election
  console.log('4. Fetching active election...');
  res = await fetch(`${API_URL}/election/active`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  data = await res.json();
  if (!data.success || !data.data) throw new Error('No active election');
  const electionId = data.data.id;

  // 5. Fetch candidates
  console.log('5. Fetching candidates...');
  res = await fetch(`${API_URL}/candidates?electionId=${electionId}`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  data = await res.json();
  if (!data.success || data.data.length === 0) throw new Error('No candidates found');
  const candidateId = data.data[0].id;
  console.log(`   Selected candidate ID: ${candidateId}`);

  // 6. Encrypt Vote (Simulate Frontend logic)
  console.log('6. Encrypting vote payload...');
  // Fetch server public key
  res = await fetch(`${API_URL}/config/crypto`);
  data = await res.json();
  const serverPublicKey = data.data.serverPublicKey;

  // Generate AES Key
  const aesKey = crypto.randomBytes(32);
  const iv = crypto.randomBytes(12);
  
  // Encrypt payload with AES-GCM
  const payload = JSON.stringify({ candidateId, timestamp: Date.now() });
  const cipher = crypto.createCipheriv('aes-256-gcm', aesKey, iv);
  let encrypted = cipher.update(payload, 'utf8');
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  const authTag = cipher.getAuthTag();
  const ciphertextBase64 = Buffer.concat([encrypted, authTag]).toString('base64');
  const ivBase64 = iv.toString('base64');

  // Encrypt AES key with Server's RSA Public Key
  const encryptedAesKey = crypto.publicEncrypt(
    { key: serverPublicKey, padding: crypto.constants.RSA_PKCS1_OAEP_PADDING, oaepHash: 'sha256' },
    aesKey
  ).toString('base64');

  // Sign ciphertext with User's RSA Private Key
  const sign = crypto.createSign('SHA256');
  sign.update(ciphertextBase64);
  sign.end();
  const rsaSignature = sign.sign({ key: privateKey, padding: crypto.constants.RSA_PKCS1_PSS_PADDING, saltLength: crypto.constants.RSA_PSS_SALTLEN_DIGEST }, 'base64');

  // 7. Submit Vote
  console.log('7. Submitting vote...');
  res = await fetch(`${API_URL}/votes`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
    body: JSON.stringify({
      ciphertext: ciphertextBase64,
      iv: ivBase64,
      rsaSignature,
      encryptedAesKey,
      electionId
    })
  });
  data = await res.json();
  if (!data.success) {
    if (data.message === 'Anda sudah memberikan suara') {
       console.log('   User already voted, testing receipt instead.');
    } else {
       throw new Error('Vote submission failed: ' + data.message);
    }
  } else {
    console.log(`   Vote submitted successfully. Receipt: ${data.data.verificationCode}`);
  }

  // 8. Fetch Receipt
  console.log('8. Fetching receipt...');
  res = await fetch(`${API_URL}/votes/my-receipt`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  data = await res.json();
  if (!data.success) throw new Error('Failed to fetch receipt: ' + data.message);
  console.log(`   Receipt verified: ${data.data.verificationCode} at ${data.data.votedAt}`);

  // 9. Admin Flow to tally votes
  console.log('9. Logging in as Admin...');
  res = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ nim: 'ADMIN001', password: 'admin123' })
  });
  data = await res.json();
  const adminToken = data.data.token;

  console.log('10. Closing Election...');
  res = await fetch(`${API_URL}/admin/election/close`, {
    method: 'PATCH',
    headers: { 'Authorization': `Bearer ${adminToken}` }
  });
  data = await res.json();
  if (!data.success) throw new Error('Failed to close election: ' + data.message);

  console.log('11. Publishing Results...');
  res = await fetch(`${API_URL}/admin/election/publish`, {
    method: 'PATCH',
    headers: { 'Authorization': `Bearer ${adminToken}` }
  });
  data = await res.json();
  if (!data.success) throw new Error('Failed to publish results: ' + data.message);

  console.log('12. Fetching Results...');
  res = await fetch(`${API_URL}/election/${electionId}/results`, {
    headers: { 'Authorization': `Bearer ${adminToken}` }
  });
  data = await res.json();
  if (!data.success) throw new Error('Failed to get results: ' + data.message);
  
  console.log(`   Results fetched! Total Votes: ${data.data.election.votesIn}`);
  data.data.candidates.forEach((c) => {
    console.log(`   - ${c.name}: ${c.voteCount} votes`);
  });

  if (data.data.candidates.find(c => c.id === candidateId).voteCount !== 1) {
     throw new Error('Vote count did not increment correctly! Tallying failed.');
  }

  console.log('--- TEST SUCCESSFUL ---');
}

testVote().catch(console.error);
