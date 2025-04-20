// Fetch ratings from Arweave
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

const ARWEAVE_GRAPHQL_ENDPOINT = "https://arweave.net/graphql";
const APP_NAME = "RateAnybody";

async function fetchRatingsByTarget(targetAddress, maxResults = 100) {
    const query = {
        query: `
        query($appName: String!, $targetAddress: String!, $max: Int!) {
          transactions(
            tags: [
              {name: "App-Name", values: [$appName]},
              {name: "Target-Address", values: [$targetAddress]}
            ]
            first: $max
          ) {
            edges {
              node {
                id
                tags {
                  name
                  value
                }
                block {
                  timestamp
                }
              }
            }
          }
        }
        `,
        variables: {
            appName: APP_NAME,
            targetAddress,
            max: maxResults
        }
    };

    const response = await fetch(ARWEAVE_GRAPHQL_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(query)
    });
    
    const data = await response.json();
    return data.data.transactions.edges.map(edge => ({
        id: edge.node.id,
        timestamp: edge.node.block.timestamp,
        tags: edge.node.tags.reduce((acc, tag) => {
            acc[tag.name] = tag.value;
            return acc;
        }, {})
    }));
}

async function fetchRatingData(txId) {
    const response = await fetch(`https://arweave.net/${txId}`);
    return await response.json();
}

async function fetchRatings({ firstName, middleName, lastName }) {
    try {
        const response = await fetch(`http://localhost:3000/api/ratings/person/${encodeURIComponent(firstName)}/${encodeURIComponent(lastName)}`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error fetching ratings:', error);
        return [];
    }
}

async function getRatingsForAddress(address) {
    console.log(`Fetching ratings for address: ${address}`);
    const transactions = await fetchRatingsByTarget(address);
    console.log(`Found ${transactions.length} ratings`);
    
    const ratings = [];
    for (const tx of transactions) {
        try {
            const data = await fetchRatingData(tx.id);
            ratings.push({
                ...data,
                timestamp: tx.timestamp,
                transactionId: tx.id,
                raterAddress: tx.tags['Rater-Address'] || 'anonymous'
            });
        } catch (error) {
            console.error(`Error fetching rating ${tx.id}:`, error);
        }
    }
    
    return ratings;
}

// If running directly (not imported)
if (require.main === module) {
    const address = process.argv[2];
    if (!address) {
        console.error('Please provide an address to fetch ratings for.');
        console.error('Usage: node fetch_ratings.js ADDRESS');
        process.exit(1);
    }

    getRatingsForAddress(address)
        .then(ratings => {
            console.log('\nRatings:');
            ratings.forEach(rating => {
                const date = new Date(rating.timestamp * 1000).toLocaleString();
                console.log(`\n--- Rating from ${rating.raterAddress} on ${date} ---`);
                console.log(`Score: ${rating.score}/10`);
                console.log(`Comment: ${rating.comment}`);
                console.log(`Transaction: https://viewblock.io/arweave/tx/${rating.transactionId}`);
            });
        })
        .catch(error => {
            console.error('Error:', error);
            process.exit(1);
        });
}
