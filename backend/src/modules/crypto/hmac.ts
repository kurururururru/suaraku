import crypto from 'node:crypto';

function getHMACKey(): string {
  const key = process.env.HMAC_SECRET_KEY;
  if (!key) throw new Error('HMAC_SECRET_KEY environment variable not set');
  return key;
}

export function generateHMAC(data: string): string {
  const key = getHMACKey();
  const hmac = crypto.createHmac('sha256', key);
  hmac.update(data);
  const digest = hmac.digest('hex');

  console.log('[CRYPTO] HMAC-SHA256 generated');
  console.log('[CRYPTO] HMAC digest (first 16 chars):', digest.substring(0, 16) + '...');

  return digest;
}

export function verifyHMAC(data: string, signature: string): boolean {
  const key = getHMACKey();
  const hmac = crypto.createHmac('sha256', key);
  hmac.update(data);
  const expected = hmac.digest('hex');

  // Constant-time comparison to prevent timing attacks
  const expectedBuffer = Buffer.from(expected, 'hex');
  const signatureBuffer = Buffer.from(signature, 'hex');

  if (expectedBuffer.length !== signatureBuffer.length) {
    console.log('[CRYPTO] HMAC verification FAILED - length mismatch');
    return false;
  }

  const isValid = crypto.timingSafeEqual(expectedBuffer, signatureBuffer);
  console.log('[CRYPTO] HMAC verification:', isValid ? 'PASSED' : 'FAILED');

  return isValid;
}
