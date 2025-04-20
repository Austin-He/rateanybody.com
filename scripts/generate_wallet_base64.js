#!/usr/bin/env node

/**
 * Utility to generate a base64 encoded wallet string for environment variables
 * Usage: node generate_wallet_base64.js [path_to_wallet.json]
 */

const fs = require('fs');
const path = require('path');

// Default wallet path if not provided
const defaultWalletPath = path.join(__dirname, '..', 'public', 'mywallet.json');

// Get wallet path from arguments or use default
const walletPath = process.argv[2] || defaultWalletPath;

try {
  // Read the wallet file
  console.log(`Reading wallet from: ${walletPath}`);
  const walletJson = fs.readFileSync(walletPath, 'utf8');
  
  // Parse to ensure it's valid JSON
  const wallet = JSON.parse(walletJson);
  
  // Convert to base64
  const base64Wallet = Buffer.from(walletJson).toString('base64');
  
  console.log('\nBase64 encoded wallet for environment variable:');
  console.log('===============================================');
  console.log(base64Wallet);
  console.log('===============================================');
  console.log('\nUse this value for the WALLET_JSON_BASE64 environment variable in Cloudflare Pages.');
  console.log('Instructions:');
  console.log('1. Go to your Cloudflare Pages project');
  console.log('2. Navigate to Settings > Environment variables');
  console.log('3. Add a new variable named "WALLET_JSON_BASE64"');
  console.log('4. Paste the above base64 string as the value');
  console.log('5. Make sure to set it for "Production" environment');
  
} catch (error) {
  console.error('Error generating base64 wallet:', error.message);
  process.exit(1);
}
