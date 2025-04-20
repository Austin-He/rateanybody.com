// Script to check your Arweave wallet balance
// Usage: node check_balance.js <JWK_PATH>
// Requires: arweave (installed), node.js

const fs = require('fs');
const Arweave = require('arweave');

const [,, jwkPath] = process.argv;

if (!jwkPath) {
  console.error('Usage: node check_balance.js <JWK_PATH>');
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
  const winston = await arweave.wallets.getBalance(address);
  const ar = arweave.ar.winstonToAr(winston);
  console.log('Wallet address:', address);
  console.log('Balance:', ar, 'AR');
}

main();
