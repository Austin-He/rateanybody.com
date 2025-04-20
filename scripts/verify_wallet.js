#!/usr/bin/env node

/**
 * Utility to verify that the base64-encoded wallet in .env 
 * decodes to the same content as mywallet.json
 */

const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Path to wallet
const walletPath = path.join(__dirname, '..', 'mywallet.json');

try {
  // Read the original wallet file
  console.log(`Reading original wallet from: ${walletPath}`);
  const originalWalletStr = fs.readFileSync(walletPath, 'utf8');
  const originalWallet = JSON.parse(originalWalletStr);
  
  // Get wallet from environment variable
  const base64Wallet = process.env.WALLET_JSON_BASE64;
  
  if (!base64Wallet) {
    throw new Error('WALLET_JSON_BASE64 environment variable not found in .env');
  }
  
  console.log('Decoding base64 wallet from WALLET_JSON_BASE64...');
  const decodedWalletStr = Buffer.from(base64Wallet, 'base64').toString('utf8');
  const decodedWallet = JSON.parse(decodedWalletStr);
  
  // Compare wallet properties
  let areEqual = true;
  const keyProperties = ['kty', 'n', 'e', 'd', 'p', 'q', 'dp', 'dq', 'qi'];
  
  console.log('\nComparing wallet properties:');
  console.log('============================');
  
  keyProperties.forEach(prop => {
    const originalValue = originalWallet[prop];
    const decodedValue = decodedWallet[prop];
    const isMatch = originalValue === decodedValue;
    
    console.log(`${prop}: ${isMatch ? '✓ Match' : '✗ MISMATCH'}`);
    
    if (!isMatch) {
      areEqual = false;
      console.log(`  Original: ${originalValue?.substring(0, 20)}...`);
      console.log(`  Decoded:  ${decodedValue?.substring(0, 20)}...`);
    }
  });
  
  console.log('\nVerdict:');
  if (areEqual) {
    console.log('✅ SUCCESS: The base64 wallet in .env decodes to the same content as mywallet.json');
  } else {
    console.log('❌ FAILURE: The wallets do not match! Check .env file and regenerate if needed.');
  }
  
} catch (error) {
  console.error('Error verifying wallet:', error.message);
  process.exit(1);
}
