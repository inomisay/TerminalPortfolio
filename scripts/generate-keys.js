'use strict';

/**
 * Standalone key generation script.
 * Run once: npm run keygen
 * The server also auto-generates on first start.
 */

const crypto = require('crypto');
const fs     = require('fs');
const path   = require('path');

const keysDir = path.join(__dirname, '..', 'keys');
const keyFile = path.join(keysDir, 'host.key');

if (fs.existsSync(keyFile)) {
  console.log('Key already exists at keys/host.key — delete it first to regenerate.');
  process.exit(0);
}

fs.mkdirSync(keysDir, { recursive: true });

console.log('Generating 2048-bit RSA host key…');
const { privateKey } = crypto.generateKeyPairSync('rsa', { modulusLength: 2048 });
fs.writeFileSync(keyFile, privateKey.export({ type: 'pkcs1', format: 'pem' }));
console.log('Done →  keys/host.key');
