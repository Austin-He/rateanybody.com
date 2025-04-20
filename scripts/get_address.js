// Script to get your Arweave wallet address from a JWK file
// Usage: node get_address.js <JWK_PATH>
// Requires: arweave (installed), node.js

const fs = require('fs');
const Arweave = require('arweave');

const [,, jwkPath] = process.argv;

if (!jwkPath) {
  console.error('Usage: node get_address.js <JWK_PATH>');
  process.exit(1);
}

const arweave = Arweave.init({
  host: 'arweave.net',
  port: 443,
  protocol: 'https',
});

async function main() {
  const jwk = JSON.parse(fs.readFileSync(jwkPath, 'utf-8'));
  const address = await arweave.wallets.jwkToAddress(jwk);
  console.log('Your wallet address:', address);
}

main();
