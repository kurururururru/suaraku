// Client-Side Cryptography using Web Crypto API

/**
 * Generates an RSA-PSS key pair (2048-bit, SHA-256)
 * Returns the public key in PEM format and stores the private key in sessionStorage.
 */
export async function generateRSAKeyPair(): Promise<{ publicKeyPem: string }> {
  const keyPair = await window.crypto.subtle.generateKey(
    {
      name: 'RSA-PSS',
      modulusLength: 2048,
      publicExponent: new Uint8Array([1, 0, 1]),
      hash: 'SHA-256',
    },
    true,
    ['sign', 'verify']
  );

  const exportedPublicKey = await window.crypto.subtle.exportKey('spki', keyPair.publicKey);
  const exportedPrivateKey = await window.crypto.subtle.exportKey('pkcs8', keyPair.privateKey);

  const publicKeyPem = formatAsPem(exportedPublicKey, 'PUBLIC KEY');
  const privateKeyPem = formatAsPem(exportedPrivateKey, 'PRIVATE KEY');

  sessionStorage.setItem('rsa_private_key', privateKeyPem);

  return { publicKeyPem };
}

/**
 * Signs a string payload using the RSA private key from sessionStorage.
 */
export async function signWithRSA(data: string, privateKeyPem: string): Promise<string> {
  const privateKey = await importPrivateKey(privateKeyPem);
  const encoder = new TextEncoder();
  const dataBuffer = encoder.encode(data);

  const signature = await window.crypto.subtle.sign(
    {
      name: 'RSA-PSS',
      saltLength: 32,
    },
    privateKey,
    dataBuffer
  );

  return arrayBufferToBase64(signature);
}

/**
 * Encrypts a JSON payload using AES-GCM (256-bit key, 96-bit IV).
 * Generates a random key for the operation.
 */
export async function encryptVotePayload(payload: object, serverPublicKeyPem: string): Promise<{ ciphertext: string; iv: string; encryptedAesKey: string }> {
  const key = await window.crypto.subtle.generateKey(
    {
      name: 'AES-GCM',
      length: 256,
    },
    true,
    ['encrypt', 'decrypt']
  );

  const iv = window.crypto.getRandomValues(new Uint8Array(12));
  const encoder = new TextEncoder();
  const encodedPayload = encoder.encode(JSON.stringify(payload));

  const ciphertextBuffer = await window.crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv: iv,
    },
    key,
    encodedPayload
  );

  // 3. Export AES Key
  const rawAesKey = await window.crypto.subtle.exportKey('raw', key);

  // 4. Import Server Public Key for RSA-OAEP
  const serverPublicKey = await importPublicKey(serverPublicKeyPem);

  // 5. Encrypt AES Key with Server Public Key
  const encryptedAesKeyBuffer = await window.crypto.subtle.encrypt(
    { name: 'RSA-OAEP' },
    serverPublicKey,
    rawAesKey
  );

  const ciphertext = arrayBufferToBase64(ciphertextBuffer);
  const ivBase64 = arrayBufferToBase64(iv.buffer);
  const encryptedAesKeyBase64 = arrayBufferToBase64(encryptedAesKeyBuffer);

  return { 
    ciphertext, 
    iv: ivBase64,
    encryptedAesKey: encryptedAesKeyBase64
  };
}

async function importPublicKey(pem: string): Promise<CryptoKey> {
  const pemHeader = '-----BEGIN PUBLIC KEY-----';
  const pemFooter = '-----END PUBLIC KEY-----';
  const pemContents = pem.substring(
    pem.indexOf(pemHeader) + pemHeader.length,
    pem.indexOf(pemFooter)
  ).replace(/\s/g, '');
  
  const binaryDer = base64ToArrayBuffer(pemContents);
  
  return await window.crypto.subtle.importKey(
    'spki',
    binaryDer,
    {
      name: 'RSA-OAEP',
      hash: 'SHA-256',
    },
    true,
    ['encrypt']
  );
}

// --- Helper Functions ---

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  let binary = '';
  const bytes = new Uint8Array(buffer);
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
}

function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binaryString = window.atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
}

function formatAsPem(buffer: ArrayBuffer, label: string): string {
  const base64 = arrayBufferToBase64(buffer);
  let pem = `-----BEGIN ${label}-----\n`;
  for (let i = 0; i < base64.length; i += 64) {
    pem += base64.substring(i, i + 64) + '\n';
  }
  pem += `-----END ${label}-----\n`;
  return pem;
}

async function importPrivateKey(pem: string): Promise<CryptoKey> {
  const pemHeader = '-----BEGIN PRIVATE KEY-----';
  const pemFooter = '-----END PRIVATE KEY-----';
  const pemContents = pem.substring(
    pem.indexOf(pemHeader) + pemHeader.length,
    pem.indexOf(pemFooter)
  ).replace(/\s/g, '');
  
  const binaryDer = base64ToArrayBuffer(pemContents);
  
  return await window.crypto.subtle.importKey(
    'pkcs8',
    binaryDer,
    {
      name: 'RSA-PSS',
      hash: 'SHA-256',
    },
    true,
    ['sign']
  );
}
