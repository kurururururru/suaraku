import crypto from 'node:crypto';
import { getDatabase } from '../database/init';
import { encryptAES, generateHMAC, verifyRSASignature } from '../modules/crypto';
import { logAudit } from './audit.service';

export interface VoteSubmission {
  ciphertext: string;
  iv: string;
  rsaSignature: string;
  encryptedAesKey: string;
  electionId: string;
}

export async function submitVote(
  voterId: string,
  submission: VoteSubmission,
  ipAddress?: string
): Promise<{ success: boolean; message: string; verificationCode?: string }> {
  const db = await getDatabase();

  // 1. Check election status
  const election = await db.get<any>('SELECT * FROM elections WHERE id = ?', submission.electionId);
  if (!election) {
    return { success: false, message: 'Pemilihan tidak ditemukan' };
  }
  if (election.status !== 'ACTIVE') {
    return { success: false, message: 'Voting belum dimulai atau sudah ditutup' };
  }

  // 2. Check user hasn't voted
  const user = await db.get<any>('SELECT * FROM users WHERE id = ?', voterId);
  if (!user) {
    return { success: false, message: 'Pemilih tidak ditemukan' };
  }
  if (user.has_voted === 1) {
    return { success: false, message: 'Anda sudah memberikan suara' };
  }

  // 3. Get user's public key (needed for RSA signature validation)
  if (!user.public_key) {
    return { success: false, message: 'Kunci publik belum terdaftar. Silakan login ulang.' };
  }

  // 4. Verify RSA signature FIRST before decrypting
  console.log('[VOTE] Verifying RSA digital signature...');
  const rsaValid = verifyRSASignature(submission.ciphertext, submission.rsaSignature, user.public_key);
  if (!rsaValid) {
    await logAudit('VOTE_SIGNATURE_INVALID', voterId, { electionId: submission.electionId }, ipAddress);
    return { success: false, message: 'Tanda tangan digital tidak valid' };
  }

  // 5. Decrypt AES Key using Server's RSA Private Key
  console.log('[VOTE] Decrypting AES key with Server Private Key...');
  const serverPrivateKey = process.env.SERVER_PRIVATE_KEY?.replace(/\\n/g, '\\n') || '';
  if (!serverPrivateKey) {
    return { success: false, message: 'Konfigurasi server bermasalah (Kunci Privat)' };
  }

  let aesKeyBuffer: Buffer;
  try {
    aesKeyBuffer = crypto.privateDecrypt(
      {
        key: serverPrivateKey.replace(/\\n/g, '\n'),
        padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
        oaepHash: 'sha256',
      },
      Buffer.from(submission.encryptedAesKey, 'base64')
    );
  } catch (error: any) {
    console.error('[VOTE] Failed to decrypt AES key:', error.message);
    return { success: false, message: 'Gagal mendekripsi kunci sesi' };
  }

  // 6. Decrypt Payload using AES-GCM
  console.log('[VOTE] Decrypting payload with session AES key...');
  let candidateId: string;
  try {
    const decipher = crypto.createDecipheriv('aes-256-gcm', aesKeyBuffer, Buffer.from(submission.iv, 'base64'));
    // The auth tag is usually the last 16 bytes of the ciphertext in WebCrypto
    const ciphertextBuffer = Buffer.from(submission.ciphertext, 'base64');
    const tag = ciphertextBuffer.subarray(ciphertextBuffer.length - 16);
    const encrypted = ciphertextBuffer.subarray(0, ciphertextBuffer.length - 16);
    
    decipher.setAuthTag(tag);
    let decrypted = decipher.update(encrypted, undefined, 'utf8');
    decrypted += decipher.final('utf8');
    
    const payload = JSON.parse(decrypted);
    candidateId = payload.candidateId;
  } catch (error: any) {
    console.error('[VOTE] Failed to decrypt AES payload:', error.message);
    return { success: false, message: 'Gagal mendekripsi data suara' };
  }

  // 7. Check candidate exists
  const candidate = await db.get<any>('SELECT * FROM candidates WHERE id = ? AND election_id = ?', candidateId, submission.electionId);
  if (!candidate) {
    return { success: false, message: 'Kandidat tidak ditemukan' };
  }

  // At this point, we have validated the vote securely.

  // 7. Generate verification code
  const verificationCode = 'SVK-' + crypto.randomBytes(4).toString('hex').toUpperCase();
  console.log('[VOTE] Verification code generated:', verificationCode);

  // 8. Re-encrypt for server storage
  const serverPayload = JSON.stringify({
    candidateId: candidateId,
    voterId: voterId,
    electionId: submission.electionId,
    timestamp: new Date().toISOString(),
    clientCiphertext: submission.ciphertext,
  });
  const { ciphertext: serverCiphertext, iv: serverIv } = encryptAES(serverPayload);

  // 9. Generate HMAC over: serverCiphertext + serverIv + voterId + electionId
  const hmacData = serverCiphertext + serverIv + voterId + submission.electionId;
  console.log('[DEBUG-VOTE] hmacData length:', hmacData.length, 'preview:', hmacData.substring(0, 50));
  const hmacSignature = generateHMAC(hmacData);

  // 10. Atomic transaction
  await db.run('BEGIN TRANSACTION');
  try {
    await db.run(`
      INSERT INTO votes (voter_id, election_id, encrypted_payload, iv, hmac_signature, rsa_signature, verification_code)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, voterId, submission.electionId, serverCiphertext, serverIv, hmacSignature, submission.rsaSignature, verificationCode);

    await db.run(`
      UPDATE users SET has_voted = 1, voted_at = datetime('now') WHERE id = ?
    `, voterId);

    await db.run(`
      INSERT INTO audit_logs (action, user_id, metadata, ip_address)
      VALUES ('VOTE_SUBMITTED', ?, ?, ?)
    `, voterId, JSON.stringify({
        electionId: submission.electionId,
        verificationCode,
        cryptoOperations: ['AES-GCM', 'HMAC-SHA256', 'RSA-PSS'],
      }), ipAddress || null);

    await db.run('COMMIT');
    console.log('[VOTE] ✅ Vote submitted successfully in atomic transaction');
    console.log('[VOTE] Crypto pipeline: AES-GCM ✓ | HMAC-SHA256 ✓ | RSA-PSS ✓');
    return { success: true, message: 'Suara berhasil direkam', verificationCode };
  } catch (error: any) {
    await db.run('ROLLBACK');
    console.error('[VOTE] ❌ Transaction failed, rolling back:', error.message);
    return { success: false, message: 'Gagal menyimpan suara. Silakan coba lagi.' };
  }
}

export async function getVoteReceipt(voterId: string) {
  const db = await getDatabase();
  const vote = await db.get<any>(`
    SELECT verification_code, created_at 
    FROM votes 
    WHERE voter_id = ?
  `, voterId);

  if (!vote) return null;

  return {
    verificationCode: vote.verification_code,
    votedAt: vote.created_at,
    status: 'Terenkripsi & Tersimpan'
  };
}
