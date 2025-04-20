// This script injects environment variables into the build
const fs = require('fs');
const path = require('path');

// Read environment variables or fallback to local files during development
const walletRaw = process.env.ARWEAVE_WALLET_JSON || fs.readFileSync('./mywallet.json', 'utf8');

// Create a configuration file that will be bundled with the app
const configContent = `
// Auto-generated file - DO NOT EDIT DIRECTLY
window.APP_CONFIG = {
  // Only include the wallet address, not the full wallet
  walletAddress: "${process.env.WALLET_ADDRESS || ''}",
  // We'll use a separate secured endpoint for the actual wallet data
  // during deployment through Cloudflare Pages
};
`;

// Write to the src directory so it's bundled
fs.writeFileSync(path.join(__dirname, 'src', 'config.js'), configContent);
console.log('✅ Configuration generated successfully');
