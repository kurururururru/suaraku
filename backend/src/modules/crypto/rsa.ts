import crypto from 'node:crypto';

export function verifyRSASignature(
  data: string,
  signature: string,
  publicKeyPem: string
): boolean {
  try {
    const verifier = crypto.createVerify('RSA-SHA256');
    verifier.update(data);
    verifier.end();

    // Use RSA-PSS padding with SHA-256
    const isValid = verifier.verify(
      {
        key: publicKeyPem,
        padding: crypto.constants.RSA_PKCS1_PSS_PADDING,
        saltLength: crypto.constants.RSA_PSS_SALTLEN_DIGEST,
      },
      signature,
      'base64'
    );

    console.log('[CRYPTO] RSA-PSS signature verification:', isValid ? 'VALID' : 'INVALID');

    return isValid;
  } catch (error) {
    console.error('[CRYPTO] RSA signature verification error:', error);
    return false;
  }
}
