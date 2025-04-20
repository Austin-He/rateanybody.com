// Script to create a new Arweave wallet (JWK key file)
// Usage: node create_wallet.js <OUTPUT_PATH>
// Requires: arweave (installed), node.js

const fs = require('fs');
const Arweave = require('arweave');

const [,, outputPath] = process.argv;

if (!outputPath) {
  console.error('Usage: node create_wallet.js <OUTPUT_PATH>');
  process.exit(1);
}

const arweave = Arweave.init({
  host: 'arweave.net',
  port: 443,
  protocol: 'https',
});

async function main() {
  const key = await arweave.wallets.generate();
  fs.writeFileSync(outputPath, JSON.stringify(key, null, 2));
  console.log('Wallet created and saved to', outputPath);
}

main().catch(err => {
  console.error('Error creating wallet:', err);
  process.exit(1);
});
