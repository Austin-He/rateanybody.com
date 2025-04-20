// Script to upload data to Arweave
// Usage: node upload_to_arweave.js <JWK_PATH> <DATA_FILE> <APP_TAG>
// Requires: arweave, node.js

const fs = require('fs');
const Arweave = require('arweave');
const readline = require('readline');

const [,, jwkPath, dataFile, appTag] = process.argv;

if (!jwkPath || !dataFile || !appTag) {
  console.error('Usage: node upload_to_arweave.js <JWK_PATH> <DATA_FILE> <APP_TAG>');
  process.exit(1);
}

// Maximum file size in bytes (50 KB)
const MAX_FILE_SIZE = 50 * 1024;

async function askUser(question) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  return new Promise(resolve => {
    rl.question(question, answer => {
      rl.close();
      resolve(answer);
    });
  });
}

async function main() {
  try {
    const wallet = JSON.parse(fs.readFileSync(jwkPath));
    const data = fs.readFileSync(dataFile);
    
    // Check file size
    if (data.length > MAX_FILE_SIZE) {
      console.error(`Error: File size (${(data.length / 1024).toFixed(2)} KB) exceeds maximum allowed size (${MAX_FILE_SIZE / 1024} KB)`);
      process.exit(1);
    }

    // Initialize Arweave
    const arweave = Arweave.init({
      host: 'arweave.net',
      port: 443,
      protocol: 'https'
    });

    // Get wallet address and balance
    const address = await arweave.wallets.jwkToAddress(wallet);
    const balance = await arweave.wallets.getBalance(address);
    const balanceAr = arweave.ar.winstonToAr(balance);

    console.log('Wallet address:', address);
    console.log('Wallet balance:', balanceAr, 'AR');

    // Calculate size info
    const sizeInKiB = data.length / 1024;
    console.log('\n=== Upload Information ===');
    console.log(`File size: ${sizeInKiB.toFixed(2)} KiB`);

    // Parse and validate JSON data
    let jsonData;
    try {
      jsonData = JSON.parse(data);
    } catch (e) {
      console.error('Error: Invalid JSON file');
      process.exit(1);
    }

    // Create transaction
    const transaction = await arweave.createTransaction({
      data: data
    }, wallet);

    // Add tags
    transaction.addTag('Content-Type', 'application/json');
    transaction.addTag('App-Name', 'RateAnybody');
    transaction.addTag('Data-Type', 'rating');
    transaction.addTag('Unix-Time', String(jsonData.timestamp || Math.floor(Date.now() / 1000)));
    transaction.addTag('First-Name', jsonData.firstName || '');
    transaction.addTag('Middle-Name', jsonData.middleName || '');
    transaction.addTag('Last-Name', jsonData.lastName || '');
    transaction.addTag('Location', jsonData.location || '');
    transaction.addTag('Associations', jsonData.associations || '');
    transaction.addTag('Rating-Score', String(jsonData.score || 0));
    // Comments are stored in the transaction data, not as a tag since they can be very long

    // Get transaction fee
    const fee = arweave.ar.winstonToAr(transaction.reward);
    console.log(`\nTransaction fee: ${fee} AR`);

    const proceed = await askUser('Would you like to proceed with the upload? (y/n): ');
    if (proceed.toLowerCase() !== 'y') {
      console.log('Upload cancelled');
      process.exit(0);
    }

    console.log('\nSigning transaction...');
    await arweave.transactions.sign(transaction, wallet);

    console.log('Uploading data...');
    const response = await arweave.transactions.post(transaction);

    if (response.status === 200 || response.status === 202) {
      console.log('\nUpload successful!');
      console.log('Transaction ID:', transaction.id);
      console.log('View your rating at:', `https://arweave.net/${transaction.id}`);
      console.log('\nNote: It may take a few minutes for your transaction to be mined.');
    } else {
      console.error('Upload failed:', response.statusText);
      process.exit(1);
    }
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

main().catch(err => {
  console.error('Error uploading to Arweave:', err);
  process.exit(1);
});