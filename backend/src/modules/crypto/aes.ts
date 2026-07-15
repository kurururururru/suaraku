import crypto from 'node:crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12; // 96 bits for GCM
const AUTH_TAG_LENGTH = 16; // 128 bits

function getAESKey(): Buffer {
  const key = process.env.AES_SECRET_KEY;
  if (!key) throw new Error('AES_SECRET_KEY environment variable not set');
  // Ensure the key is exactly 32 bytes
  const keyBuffer = Buffer.from(key, 'utf-8');
  if (keyBuffer.length < 32) {
    return Buffer.concat([keyBuffer, Buffer.alloc(32 - keyBuffer.length)]);
  }
  return keyBuffer.slice(0, 32);
}

export function encryptAES(plaintext: string): { ciphertext: string; iv: string } {
  const key = getAESKey();
  const iv = crypto.randomBytes(IV_LENGTH);

  const cipher = crypto.createCipheriv(ALGORITHM, key, iv, {
    authTagLength: AUTH_TAG_LENGTH,
  });

  let encrypted = cipher.update(plaintext, 'utf8');
  encrypted = Buffer.concat([encrypted, cipher.final()]);

  const authTag = cipher.getAuthTag();

  // Append auth tag to ciphertext
  const ciphertextWithTag = Buffer.concat([encrypted, authTag]);

  console.log('[CRYPTO] AES-GCM encryption successful');
  console.log('[CRYPTO] IV length:', iv.length, 'bytes');
  console.log('[CRYPTO] Ciphertext length:', encrypted.length, 'bytes');
  console.log('[CRYPTO] Auth tag length:', authTag.length, 'bytes');

  return {
    ciphertext: ciphertextWithTag.toString('base64'),
    iv: iv.toString('base64'),
  };
}

export function decryptAES(ciphertext: string, iv: string): string {
  const key = getAESKey();
  const ivBuffer = Buffer.from(iv, 'base64');
  const ciphertextBuffer = Buffer.from(ciphertext, 'base64');

  // Extract auth tag from end of ciphertext
  const authTag = ciphertextBuffer.slice(ciphertextBuffer.length - AUTH_TAG_LENGTH);
  const encryptedData = ciphertextBuffer.slice(0, ciphertextBuffer.length - AUTH_TAG_LENGTH);

  const decipher = crypto.createDecipheriv(ALGORITHM, key, ivBuffer, {
    authTagLength: AUTH_TAG_LENGTH,
  });
  decipher.setAuthTag(authTag);

  let decrypted = decipher.update(encryptedData);
  decrypted = Buffer.concat([decrypted, decipher.final()]);

  console.log('[CRYPTO] AES-GCM decryption successful');

  return decrypted.toString('utf8');
}
