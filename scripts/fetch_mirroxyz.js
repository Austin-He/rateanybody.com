// Fetch transactions from Arweave with the App-Name tag 'MirrorXYZ' and get their contents
// Usage: node fetch_mirroxyz.js

const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

const ARWEAVE_GRAPHQL_ENDPOINT = "https://arweave.net/graphql";
const APP_TAG = "MirrorXYZ";

async function fetchTransactionsByAppTag(appTag, maxResults = 100) {
    const query = {
        query: `
        query($appTag: String!, $max: Int!) {
          transactions(
            tags: [{name: \"App-Name\", values: [$appTag]}]
            first: $max
          ) {
            edges {
              node {
                id
              }
            }
          }
        }
        `,
        variables: {
            appTag,
            max: maxResults
        }
    };
    const response = await fetch(ARWEAVE_GRAPHQL_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(query)
    });
    const data = await response.json();
    const edges = data.data.transactions.edges;
    return edges.map(edge => edge.node.id);
}

async function fetchTransactionData(txId) {
    const response = await fetch(`https://arweave.net/${txId}`);
    return await response.text();
}

(async () => {
    console.log(`Fetching transactions with App-Name tag: ${APP_TAG}`);
    const txIds = await fetchTransactionsByAppTag(APP_TAG);
    console.log(`Found ${txIds.length} transactions:`, txIds);
    for (const txId of txIds) {
        console.log(`\n--- Content of transaction ${txId} ---`);
        const content = await fetchTransactionData(txId);
        console.log(content.substring(0, 1000)); // Print first 1000 chars
    }
})();
