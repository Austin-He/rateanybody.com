// Script to view uploaded data using Irys gateway
const axios = require('axios');

const [,, txId] = process.argv;

if (!txId) {
  console.error('Usage: node view_upload.js <TRANSACTION_ID>');
  process.exit(1);
}

async function main() {
  try {
    // Using Irys gateway to fetch the data
    const response = await axios.get(`https://gateway.irys.xyz/${txId}`);
    console.log('Data retrieved successfully:');
    console.log(JSON.stringify(response.data, null, 2));
  } catch (error) {
    if (error.response?.status === 404) {
      console.log('Data not found yet. It might still be processing...');
    } else {
      console.error('Error:', error.message);
    }
  }
}

main().catch(console.error);