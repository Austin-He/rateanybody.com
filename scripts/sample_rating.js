const Irys = require("@irys/sdk");
const getIrys = require("../public/js/irysSetup");

async function createSampleRating() {
    try {
        // Sample rating data
        const data = {
            firstName: "Elon",
            middleName: "",
            lastName: "Musk",
            location: "Austin, TX",
            associations: "Tesla, SpaceX, X Corp",
            score: 8,
            comments: "Innovative leader in electric vehicles and space technology",
            timestamp: Math.floor(Date.now() / 1000)
        };

        // Get Irys instance
        const irys = await getIrys();
        console.log("Connected to Irys node");

        // Create tags
        const tags = [
            { name: 'Content-Type', value: 'application/json' },
            { name: 'App-Name', value: 'RateAnybody' },
            { name: 'Person-First-Name', value: data.firstName },
            { name: 'Person-Middle-Name', value: data.middleName },
            { name: 'Person-Last-Name', value: data.lastName },
            { name: 'Person-Location', value: data.location },
            { name: 'Person-Associations', value: data.associations },
            { name: 'Rating-Score', value: data.score.toString() },
            { name: 'Rater-Address', value: await irys.getLoadedAddress() }
        ];

        // Upload to Arweave via Irys
        const receipt = await irys.upload(JSON.stringify(data), { tags });
        
        console.log("\nSample Rating Upload:");
        console.log("Transaction ID:", receipt.id);
        console.log("\nData:", JSON.stringify(data, null, 2));
        console.log("\nTags:", JSON.stringify(tags, null, 2));
        
        // Show ViewBlock URL
        console.log("\nView on ViewBlock:");
        console.log(`https://viewblock.io/arweave/tx/${receipt.id}`);

    } catch (error) {
        console.error('Error creating sample rating:', error);
    }
}

// Run the sample
createSampleRating();
