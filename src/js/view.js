import Arweave from 'arweave';
import ArDB from 'ardb';

// Initialize Arweave with explicit configuration for consistency across environments
const arweave = Arweave.init({
    host: 'arweave.net',  // Explicitly set the host
    port: 443,
    protocol: 'https',
    timeout: 30000,       // Increased timeout for reliability
    logging: true         // Enable logging to help debug issues
});

// Initialize ArDB with the configured Arweave instance and explicit GraphQL endpoint
// Note: GraphQL uses a different format than the main API
const ardb = new ArDB(arweave, {
    graphql: {
        host: 'arweave.net',  // Just the host domain, not the full path
        port: 443,
        protocol: 'https',
        timeout: 30000
    }
});

// Log initialization for debugging
console.log('Arweave initialized with host:', arweave.api.config.host);
console.log('Environment:', {
    production: typeof window !== 'undefined' && window.location.hostname !== 'localhost',
    hostname: typeof window !== 'undefined' ? window.location.hostname : 'unknown'
});

// DOM Elements
const nameFilter = document.getElementById('nameFilter');
const locationFilter = document.getElementById('locationFilter');
const associationsFilter = document.getElementById('associationsFilter');
const scoreFilter = document.getElementById('scoreFilter');
const applyFiltersBtn = document.getElementById('applyFilters');
const resultsDiv = document.getElementById('results');
const resultsCount = document.getElementById('resultsCount');

// Query Arweave for ratings using ArDB
async function queryRatings() {
    // Show loading state in the UI
    resultsDiv.innerHTML = `
        <div class="p-4 text-center">
            <div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mb-2"></div>
            <p>Querying the Arweave network for ratings...</p>
        </div>
    `;
    
    try {
        console.log('Starting query at:', new Date().toISOString());
        
        // Create a more lenient query - only search by App-Name
        let query = ardb.search('transactions')
            .tag('App-Name', 'RateAnybody');
            
        console.log('Query created with App-Name tag');

        // Apply filters if provided - but only as optional enhancements
        if (nameFilter.value) {
            console.log('Adding name filter:', nameFilter.value);
            const nameParts = nameFilter.value.split(' ');
            query = query.tag('First-Name', nameParts[0]);
        }

        if (locationFilter.value) {
            console.log('Adding location filter:', locationFilter.value);
            query = query.tag('Location', locationFilter.value);
        }

        if (associationsFilter.value) {
            console.log('Adding associations filter:', associationsFilter.value);
            query = query.tag('Associations', associationsFilter.value);
        }

        if (scoreFilter.value) {
            console.log('Adding score filter:', scoreFilter.value);
            query = query.tag('Rating-Score', scoreFilter.value);
        }

        // Log the full query for debugging
        console.log('Query configuration:', query);
        
        // Execute the query and get all results with timeout handling
        console.log('Executing query at:', new Date().toISOString());
        
        // Create a promise with timeout for the query
        const queryPromise = query.findAll();
        const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => reject(new Error('Query timed out after 30 seconds')), 30000);
        });
        
        // Race the query against the timeout
        const results = await Promise.race([queryPromise, timeoutPromise]);
        
        console.log('Query completed at:', new Date().toISOString());
        console.log('Query results count:', results.length);
        
        // Enhanced logging of results
        if (results.length === 0) {
            console.warn('⚠️ No results found! This might indicate:');
            console.warn('  - No ratings exist with the App-Name "RateAnybody"');
            console.warn('  - CORS issues with the Arweave gateway');
            console.warn('  - Network connectivity problems');
            
            // Add an alternative approach for debugging
            console.log('Attempting direct gateway query for diagnostics...');
            try {
                // Use direct gateway HTTP request instead of GraphQL
                // This avoids potential CORS issues with GraphQL endpoints
                const gatewayUrl = 'https://arweave.net/gateway/tags/App-Name/RateAnybody';
                console.log('Checking direct gateway URL:', gatewayUrl);
                
                const response = await fetch(gatewayUrl, {
                    method: 'GET',
                    headers: { 
                        'Accept': 'application/json'
                    }
                });
                
                if (response.ok) {
                    const data = await response.json();
                    console.log('Gateway query results:', data);
                    
                    if (data && data.length > 0) {
                        console.warn('⚠️ Gateway found results but ArDB did not - likely a CORS or library issue');
                        
                        // Add a helpful message to the UI
                        resultsDiv.innerHTML = `
                            <div class="bg-yellow-50 border-l-4 border-yellow-500 p-4 mb-4 rounded">
                                <div class="flex">
                                    <div class="flex-shrink-0">
                                        <svg class="h-5 w-5 text-yellow-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                            <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd" />
                                        </svg>
                                    </div>
                                    <div class="ml-3">
                                        <h3 class="text-sm font-medium text-yellow-800">CORS Issue Detected</h3>
                                        <div class="mt-2 text-sm text-yellow-700">
                                            <p>We detected that ratings exist but cannot be displayed due to browser security restrictions.</p>
                                            <p class="mt-2">Try visiting the official gateway directly:</p>
                                            <p class="mt-1"><a href="${gatewayUrl}" target="_blank" class="text-blue-600 hover:underline">${gatewayUrl}</a></p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        `;
                    }
                } else {
                    console.error('Gateway query failed with status:', response.status);
                }
            } catch (directError) {
                console.error('Direct gateway query failed:', directError);
            }
        } else {
            // Log actual results for debugging
            results.forEach((result, index) => {
                console.log(`Result ${index + 1}:`, {
                    id: result.id,
                    owner: result.owner?.address?.substring(0, 8) + '...',
                    tags: result.tags.map(tag => `${tag.name}: ${tag.value}`)
                });
            });
        }

        return results;
    } catch (error) {
        console.error('Error querying Arweave:', error);
        
        // Show error in the UI
        resultsDiv.innerHTML = `
            <div class="bg-red-50 border-l-4 border-red-500 p-4 rounded">
                <div class="flex">
                    <div class="flex-shrink-0">
                        <svg class="h-5 w-5 text-red-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                            <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
                        </svg>
                    </div>
                    <div class="ml-3">
                        <h3 class="text-sm font-medium text-red-800">Error Querying Arweave</h3>
                        <div class="mt-2 text-sm text-red-700">
                            <p>${error.message}</p>
                            <p class="mt-2">If you're viewing this on the Cloudflare deployment, try the following:</p>
                            <ul class="list-disc pl-5 mt-1">
                                <li>Check browser console for CORS errors</li>
                                <li>Try disabling any content blockers</li>
                                <li>Try a different browser</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        return [];
    }
}

// No need for separate filterRatings function as filtering is now done in the ArDB query

// Format and display a rating
async function displayRating(rating) {
    try {
        console.log('Displaying rating:', rating.id);
        
        // Get data from transaction
        const data = {};
        
        // Extract tags into an object for easier access
        const tags = {};
        if (rating.tags) {
            rating.tags.forEach(tag => {
                tags[tag.name] = tag.value;
                console.log(`Tag: ${tag.name} = ${tag.value}`);
            });
        }
        
        // Try to fetch transaction data content if available
        let contentData = {};
        try {
            const txDataResp = await arweave.transactions.getData(rating.id, {decode: true, string: true});
            if (txDataResp) {
                console.log('Transaction data found:', txDataResp.substring(0, 100) + '...');
                contentData = JSON.parse(txDataResp);
            }
        } catch (dataError) {
            console.log('Could not get transaction data:', dataError.message);
        }
        
        // Merge data from tags and content, with tags taking precedence
        data.firstName = tags['First-Name'] || contentData.firstName || '';
        data.middleName = tags['Middle-Name'] || contentData.middleName || '';
        data.lastName = tags['Last-Name'] || contentData.lastName || '';
        data.location = tags['Location'] || contentData.location || '';
        data.associations = tags['Associations'] || contentData.associations || '';
        data.score = parseInt(tags['Rating-Score']) || contentData.score || 0;
        data.unixTime = parseInt(tags['Unix-Time']) || contentData.timestamp || 0;
        data.comments = contentData.comments || '';
        
        // Get timestamp
        const date = data.unixTime ? new Date(data.unixTime * 1000) : null;
        const dateStr = date ? date.toLocaleString() : 'Unknown';
        
        // Generate full name
        const nameParts = [data.firstName, data.middleName, data.lastName].filter(Boolean);
        const fullName = nameParts.length > 0 ? nameParts.join(' ') : 'Anonymous';
        
        // Create rating element with fallbacks for missing data
        return `
            <div class="bg-white rounded-lg shadow-md p-6 mb-6">
                <div class="flex items-center justify-between mb-4">
                    <h3 class="text-xl font-bold">${fullName || 'Unknown Person'}</h3>
                    <div class="${getScoreColorClass(data.score)} font-bold text-xl px-3 py-1 rounded-full">
                        ${data.score || '?'}/10
                    </div>
                </div>
                
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div class="bg-gray-50 p-3 rounded border border-gray-100">
                        <h4 class="font-medium text-gray-700 mb-2">Personal Details</h4>
                        <ul class="space-y-1 text-sm">
                            <li><span class="font-semibold">First Name:</span> ${data.firstName || '<span class="text-gray-400 italic">Not provided</span>'}</li>
                            <li><span class="font-semibold">Middle Name:</span> ${data.middleName || '<span class="text-gray-400 italic">Not provided</span>'}</li>
                            <li><span class="font-semibold">Last Name:</span> ${data.lastName || '<span class="text-gray-400 italic">Not provided</span>'}</li>
                        </ul>
                    </div>
                    
                    <div class="bg-gray-50 p-3 rounded border border-gray-100">
                        <h4 class="font-medium text-gray-700 mb-2">Additional Information</h4>
                        <ul class="space-y-1 text-sm">
                            <li><span class="font-semibold">Location:</span> ${data.location || '<span class="text-gray-400 italic">Not provided</span>'}</li>
                            <li><span class="font-semibold">Associations:</span> ${data.associations || '<span class="text-gray-400 italic">Not provided</span>'}</li>
                            <li><span class="font-semibold">Date Submitted:</span> ${dateStr}</li>
                        </ul>
                    </div>
                </div>
                
                <div class="border-t pt-4">
                    <h4 class="font-bold mb-2">Comments:</h4>
                    <p class="bg-gray-50 p-3 rounded border border-gray-100">${data.comments || '<span class="text-gray-400 italic">No comments provided</span>'}</p>
                </div>
                <div class="mt-4 border-t pt-3">
                    <a href="https://arweave.net/${rating.id}" target="_blank" class="inline-block bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-sm">
                        <span class="flex items-center">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                            </svg>
                            View Transaction on Arweave
                        </span>
                    </a>
                    <div class="text-xs text-gray-500 mt-1">Transaction ID: ${rating.id.substring(0, 8)}...${rating.id.substring(rating.id.length - 8)}</div>
                </div>
            </div>
        `;
    } catch (error) {
        console.error('Error displaying rating:', error);
        return `
            <div class="bg-white rounded-lg shadow-md p-6 mb-6 border-l-4 border-yellow-500">
                <h3 class="text-lg font-semibold text-yellow-700">Transaction Found</h3>
                <p class="mb-2">This appears to be a RateAnybody transaction, but we couldn't display all the data.</p>
                <div class="mt-4 border-t pt-3">
                    <a href="https://arweave.net/${rating.id}" target="_blank" class="inline-block bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-sm">
                        <span class="flex items-center">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                            </svg>
                            View Transaction on Arweave
                        </span>
                    </a>
                    <div class="text-xs text-gray-500 mt-1">Transaction ID: ${rating.id.substring(0, 8)}...${rating.id.substring(rating.id.length - 8)}</div>
                </div>
            </div>
        `;
    }
}

// Helper function to get score color class
function getScoreColorClass(score) {
    score = parseInt(score) || 0;
    if (score >= 8) return 'bg-green-100 text-green-800';
    if (score >= 6) return 'bg-blue-100 text-blue-800';
    if (score >= 4) return 'bg-yellow-100 text-yellow-800';
    if (score >= 2) return 'bg-orange-100 text-orange-800';
    return 'bg-red-100 text-red-800';
}

// Update results
async function updateResults() {
    resultsDiv.innerHTML = '<div class="text-center">Loading...</div>';
    
    // Get all ratings
    const ratings = await queryRatings();
    
    // Update count
    resultsCount.textContent = `Found ${ratings.length} rating${ratings.length === 1 ? '' : 's'}`;
    
    // Clear results
    resultsDiv.innerHTML = '';
    
    // Display ratings
    if (ratings.length === 0) {
        resultsDiv.innerHTML = '<div class="text-gray-500 text-center">No ratings found matching your filters.</div>';
        return;
    }
    
    // Sort by timestamp descending (newest first)
    ratings.sort((a, b) => {
        const getUnixTime = (tx) => {
            if (tx.tags) {
                const timeTag = tx.tags.find(t => t.name === 'Unix-Time');
                return parseInt(timeTag?.value || '0');
            }
            return 0;
        };
        return getUnixTime(b) - getUnixTime(a);
    });
    
    // Display each rating
    for (const rating of ratings) {
        const html = await displayRating(rating);
        resultsDiv.innerHTML += html;
    }
}

// Event listeners
applyFiltersBtn.addEventListener('click', updateResults);

// Initial load
updateResults();
