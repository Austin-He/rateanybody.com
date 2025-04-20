// Script to upload data to Arweave using Irys for free tier
// Usage: node upload_to_arweave.js <JWK_PATH> <DATA_FILE> <APP_TAG>
// Requires: @irys/sdk, arweave, node.js

const fs = require('fs');
const Irys = require('@irys/sdk');
const Arweave = require('arweave');
const readline = require('readline');

const [,, jwkPath, dataFile, appTag] = process.argv;

if (!jwkPath || !dataFile || !appTag) {
  console.error('Usage: node upload_to_arweave.js <JWK_PATH> <DATA_FILE> <APP_TAG>');
  process.exit(1);
}

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
    
    // Initialize Arweave
    const arweave = Arweave.init({
      host: 'arweave.net',
      port: 443,
      protocol: 'https'
    });

    // Get wallet address and balance using Arweave SDK
    const address = await arweave.wallets.jwkToAddress(wallet);
    const balance = await arweave.wallets.getBalance(address);
    const balanceAr = arweave.ar.winstonToAr(balance);

    console.log('Wallet address:', address);
    console.log('Wallet balance:', balanceAr, 'AR');

    // Initialize Irys just for upload
    const irys = new Irys({
      url: 'https://node2.irys.xyz',
      token: 'arweave',
      key: wallet
    });

    // Calculate size info
    const sizeInKiB = data.length / 1024;
    console.log('\n=== Upload Information ===');
    console.log(`File size: ${sizeInKiB.toFixed(2)} KiB`);
    if (sizeInKiB < 100) {
        console.log('\nYour upload qualifies for Irys\'s bundling system:');
        console.log('1. Your transaction will be bundled with others for efficiency');
        console.log('2. You\'ll see a small fee deducted (your share of the bundle cost)');
        console.log('3. The transaction itself will show as 0 AR fee');
        console.log('\nThis is normal - Irys bundles small transactions together');
        console.log('to make uploading more cost-effective for everyone!');
    }
    
    // Since we're using Irys bundling system and have AR in wallet, we can proceed

    const proceed = await askUser('Would you like to proceed with the upload? (y/n): ');
    if (proceed.toLowerCase() !== 'y') {
      console.log('Upload cancelled');
      process.exit(0);
    }

    console.log('Uploading data...'); 
    // Parse and validate JSON data
    let jsonData;
    try {
      jsonData = JSON.parse(data);
    } catch (e) {
      console.error('Error: Invalid JSON file');
      process.exit(1);
    }

    // Create tags from rating data
    const tags = [
      { name: 'Content-Type', value: 'application/json' },
      { name: 'App-Name', value: 'RateAnybody' },
      { name: 'Data-Type', value: 'rating' },
      { name: 'Unix-Time', value: String(jsonData.timestamp || Math.floor(Date.now() / 1000)) },
      // Rating specific tags
      { name: 'First-Name', value: jsonData.firstName || '' },
      { name: 'Middle-Name', value: jsonData.middleName || '' },
      { name: 'Last-Name', value: jsonData.lastName || '' },
      { name: 'Location', value: jsonData.location || '' },
      { name: 'Associations', value: jsonData.associations || '' },
      { name: 'Rating-Score', value: String(jsonData.score || 0) }
    ].filter(tag => tag.value !== ''); // Remove empty tags

    console.log('\nUploading with tags:');
    console.log(tags.map(t => `${t.name}: ${t.value}`).join('\n'));
    
    const receipt = await irys.upload(data, { tags });

    console.log('\n=== Upload Status ===');
    console.log('✓ Data uploaded successfully to Irys!');
    console.log('✓ Transaction ID:', receipt.id);
    console.log('\nIMPORTANT: Your transaction is now being processed by the Arweave network.');
    console.log('This can take several hours due to Arweave\'s block confirmation process.');
    console.log('\nTo check your transaction status:');
    console.log(`1. Visit: https://viewblock.io/arweave/tx/${receipt.id}`);
    console.log('2. If you see "Transaction not found", this is normal - it means the transaction');
    console.log('   is still being processed. Check back in a few hours.');
    console.log('3. Once confirmed, your data will be permanently stored on Arweave!');
    console.log('\nNote: This delay is normal and ensures your data is properly secured');
    console.log('on the Arweave network. Your upload has been received and is being processed.');
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

main().catch(err => {
  console.error('Error uploading to Arweave:', err);
  process.exit(1);
});