const fs = require('fs');
const crypto = require('crypto');
const path = require('path');

const envPath = path.join(__dirname, '..', '.env');
const env = fs.readFileSync(envPath, 'utf8');

if (env.includes('SERVER_PUBLIC_KEY')) {
  console.log('Keys already exist in .env');
  process.exit(0);
}

const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
  modulusLength: 2048,
  publicKeyEncoding: { type: 'spki', format: 'pem' },
  privateKeyEncoding: { type: 'pkcs8', format: 'pem' }
});

const newEnv = env + `\nSERVER_PUBLIC_KEY="${publicKey.replace(/\n/g, '\\n')}"\nSERVER_PRIVATE_KEY="${privateKey.replace(/\n/g, '\\n')}"\n`;
fs.writeFileSync(envPath, newEnv);
console.log('Server keys generated and saved to .env');
