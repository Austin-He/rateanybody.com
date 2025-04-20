// Script to compare Arweave direct vs Irys bundle costs
const Arweave = require('arweave');
const Irys = require('@irys/sdk');
const fs = require('fs');

const [,, dataFile] = process.argv;

if (!dataFile) {
  console.error('Usage: node check_arweave_cost.js <DATA_FILE>');
  process.exit(1);
}

async function main() {
  try {
    const data = fs.readFileSync(dataFile);
    const sizeInKiB = data.length / 1024;

    // Check direct Arweave cost
    const arweave = Arweave.init({
      host: 'arweave.net',
      port: 443,
      protocol: 'https'
    });

    // Get Arweave direct cost
    const arweaveCost = await arweave.transactions.getPrice(data.length);
    const arweaveCostInAR = arweave.ar.winstonToAr(arweaveCost);

    // Get Irys bundle cost
    const irys = new Irys({
      url: 'https://node2.irys.xyz',
      token: 'arweave'
    });
    const irysBundleFee = await irys.getPrice(1); // minimum bundle fee
    const irysBundleFeeInAR = irys.utils.fromAtomic(irysBundleFee);

    console.log(`File size: ${sizeInKiB.toFixed(2)} KiB`);
    console.log('\nCost comparison:');
    console.log(`Direct Arweave upload: ${arweaveCostInAR} AR ($${(arweaveCostInAR * 4.44).toFixed(2)} USD)`);
    console.log(`Irys bundle fee:       ${irysBundleFeeInAR} AR ($${(irysBundleFeeInAR * 4.44).toFixed(2)} USD)`);
    console.log('\nSavings using Irys:');
    console.log(`${(arweaveCostInAR - irysBundleFeeInAR).toFixed(6)} AR ($${((arweaveCostInAR - irysBundleFeeInAR) * 4.44).toFixed(2)} USD)`);

  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

main();
