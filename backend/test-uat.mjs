import crypto from 'crypto';

const API_URL = 'http://localhost:3001/api';

async function req(path, method = 'GET', body = null, token = null) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  
  const options = { method, headers };
  if (body) options.body = JSON.stringify(body);
  
  const res = await fetch(`${API_URL}${path}`, options);
  const data = await res.json();
  if (!data.success) {
    throw new Error(`API Error [${method} ${path}]: ${data.message}`);
  }
  return data;
}

async function simulateVoterFlow(nim, password, candidateId, electionId, serverPublicKey) {
  console.log(`\n--- Simulating Voter: ${nim} ---`);
  
  // 1. Login
  const loginRes = await req('/auth/login', 'POST', { nim, password });
  const token = loginRes.data.token;
  console.log(`[${nim}] Logged in.`);

  // 2. Register RSA Key
  const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
    modulusLength: 2048,
    publicKeyEncoding: { type: 'spki', format: 'pem' },
    privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
  });
  if (!loginRes.data.user.hasPublicKey) {
    await req('/auth/register-key', 'POST', { publicKey }, token);
    console.log(`[${nim}] Public Key Registered.`);
  }

  // 3. Encrypt & Sign Vote
  const aesKey = crypto.randomBytes(32);
  const iv = crypto.randomBytes(12);
  const payload = JSON.stringify({ candidateId, timestamp: Date.now() });
  const cipher = crypto.createCipheriv('aes-256-gcm', aesKey, iv);
  let encrypted = cipher.update(payload, 'utf8');
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  const authTag = cipher.getAuthTag();
  const ciphertextBase64 = Buffer.concat([encrypted, authTag]).toString('base64');
  const ivBase64 = iv.toString('base64');

  const encryptedAesKey = crypto.publicEncrypt(
    { key: serverPublicKey, padding: crypto.constants.RSA_PKCS1_OAEP_PADDING, oaepHash: 'sha256' },
    aesKey
  ).toString('base64');

  const sign = crypto.createSign('SHA256');
  sign.update(ciphertextBase64);
  sign.end();
  const rsaSignature = sign.sign({ key: privateKey, padding: crypto.constants.RSA_PKCS1_PSS_PADDING, saltLength: crypto.constants.RSA_PSS_SALTLEN_DIGEST }, 'base64');

  // 4. Submit Vote
  try {
    const voteRes = await req('/votes', 'POST', {
      ciphertext: ciphertextBase64,
      iv: ivBase64,
      rsaSignature,
      encryptedAesKey,
      electionId
    }, token);
    console.log(`[${nim}] Voted Successfully! Receipt: ${voteRes.data.verificationCode}`);
  } catch (err) {
    if (err.message.includes('Anda sudah memberikan suara')) {
      console.log(`[${nim}] Double vote detected and rejected correctly.`);
    } else {
      throw err;
    }
  }

  // 5. Test Double Voting
  try {
    await req('/votes', 'POST', {
      ciphertext: ciphertextBase64,
      iv: ivBase64,
      rsaSignature,
      encryptedAesKey,
      electionId
    }, token);
    throw new Error(`[${nim}] BUG: Double vote was allowed!`);
  } catch (err) {
    if (err.message.includes('Anda sudah memberikan suara')) {
      console.log(`[${nim}] Double vote test PASSED.`);
    } else {
      throw err;
    }
  }
}

async function runUAT() {
  console.log('====== STARTING FULL UAT ======');
  
  // Phase 3: Admin Flow
  console.log('\n--- Admin Flow ---');
  const adminLogin = await req('/auth/login', 'POST', { nim: 'ADMIN001', password: 'admin123' });
  const adminToken = adminLogin.data.token;
  console.log('Admin Logged In.');

  // Fetch initial candidates to get IDs
  const candsRes = await req('/admin/candidates', 'GET', null, adminToken);
  const candidates = candsRes.data;
  if (candidates.length < 2) throw new Error('Not enough candidates seeded.');
  const candA = candidates[0].id;
  const candB = candidates[1].id;
  console.log(`Candidate A: ${candidates[0].name} | Candidate B: ${candidates[1].name}`);

  // Setup Election (Open it)
  const elecRes = await req('/admin/election', 'GET', null, adminToken);
  const electionId = elecRes.data.id;
  if (elecRes.data.status === 'PENDING') {
    await req('/admin/election/open', 'PATCH', null, adminToken);
    console.log(`Election ${electionId} opened.`);
  } else {
    console.log(`Election is already ${elecRes.data.status}.`);
  }

  // Get Server Crypto Key
  const cryptoRes = await req('/config/crypto');
  const serverPublicKey = cryptoRes.data.serverPublicKey;

  // Phase 4: User Voting Flow
  // 3 Voters. User 1 -> Cand A, User 2 -> Cand A, User 3 -> Cand B
  await simulateVoterFlow('2021001', 'voter123', candA, electionId, serverPublicKey);
  await simulateVoterFlow('2021002', 'voter123', candA, electionId, serverPublicKey);
  await simulateVoterFlow('2021003', 'voter123', candB, electionId, serverPublicKey);

  // Phase 5: Tallying and Result Validation
  console.log('\n--- Result Validation ---');
  await req('/admin/election/close', 'PATCH', null, adminToken);
  console.log('Election Closed.');
  await req('/admin/election/publish', 'PATCH', null, adminToken);
  console.log('Election Results Published.');

  const results = await req(`/election/${electionId}/results`, 'GET', null, adminToken);
  console.log(`Total Votes In: ${results.data.election.votesIn}`);
  
  let candAVotes = 0;
  let candBVotes = 0;
  results.data.candidates.forEach(c => {
    console.log(` - ${c.name}: ${c.voteCount} votes`);
    if (c.id === candA) candAVotes = c.voteCount;
    if (c.id === candB) candBVotes = c.voteCount;
  });

  if (candAVotes !== 2 || candBVotes !== 1) {
    throw new Error('Tallying failed! Expected 2 for Cand A and 1 for Cand B.');
  } else {
    console.log('Tallying passed! The backend perfectly decrypted the vote payload in memory!');
  }

  console.log('\n====== FULL UAT PASSED ======');
}

runUAT().catch(err => {
  console.error('\n[UAT FAILED]', err.message);
  process.exit(1);
});
