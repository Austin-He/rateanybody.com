// Maximum data size in bytes (50 KB)
const MAX_DATA_SIZE = 50 * 1024;

// State variables
let wallet;
let arweave;
let walletAddress = '';
let walletBalance = 0;

// Import wallet configuration module
import walletConfig from './walletConfig';

// Initialize dependencies
async function init() {
    try {
        // Initialize Arweave
        arweave = window.Arweave.init({
            host: 'arweave.net',
            port: 443,
            protocol: 'https'
        });
        
        // Load our managed wallet
        await loadWallet();
        
        // Update UI with wallet status
        updateWalletStatus();
    } catch (error) {
        console.error('Initialization error:', error);
        showError('Failed to initialize: ' + error.message);
    }
}

// DOM Elements reference declaration
let uploadButton;
let uploadStatus;
let ratingForm;
let scoreInput;
let scoreDisplay;

// DOM ready function to ensure elements are loaded
function initDomElements() {
    console.log('initDomElements called');
    
    // Debug: Check all HTML elements
    const allElements = document.querySelectorAll('*');
    console.log(`Found ${allElements.length} elements in document`);
    
    uploadButton = document.getElementById('uploadButton');
    uploadStatus = document.getElementById('uploadStatus');
    ratingForm = document.getElementById('ratingForm');
    scoreInput = document.getElementById('score');
    scoreDisplay = document.getElementById('scoreDisplay');
    
    // Debug: Log exact elements
    console.log('DOM element references:', {
        uploadButton, 
        ratingForm, 
        scoreInput, 
        scoreDisplay
    });
    
    // Debug: Verify slider element
    console.log('Looking for slider:', document.querySelector('input[type="range"]'));
    
    // Set up rating score display functionality
    if (scoreInput && scoreDisplay) {
        console.log('Slider and display elements found, setting up event listeners');
        
        // Directly set some initial value to see if it works
        scoreDisplay.textContent = scoreInput.value;
        scoreDisplay.style.backgroundColor = 'lightblue';
        console.log('Set initial display:', scoreInput.value);
        
        // Add event listener with inline function for debugging
        scoreInput.addEventListener('input', function() {
            console.log('Slider moved to:', this.value);
            scoreDisplay.textContent = this.value;
            scoreDisplay.style.backgroundColor = 'lightgreen';
        });
        
        // Also add the main handler
        scoreInput.addEventListener('input', updateScoreDisplay);
        
        // Debug: Verify listener was added
        console.log('Event listeners added to slider');
    } else {
        console.error('Slider elements not found!', {
            scoreInputExists: !!scoreInput,
            scoreDisplayExists: !!scoreDisplay
        });
        
        // Try again with a delay
        setTimeout(() => {
            console.log('Trying to find slider elements again after delay...');
            scoreInput = document.getElementById('score');
            scoreDisplay = document.getElementById('scoreDisplay');
            
            if (scoreInput && scoreDisplay) {
                console.log('Found slider elements after delay, setting up...');
                scoreInput.addEventListener('input', updateScoreDisplay);
                updateScoreDisplay();
            }
        }, 1000);
    }
    
    // Handle form submission
    if (ratingForm) {
        ratingForm.addEventListener('submit', handleFormSubmit);
    } else {
        console.error('Rating form not found!');
    }
}

// Function to update the score display
function updateScoreDisplay() {
    if (!scoreInput || !scoreDisplay) return;
    
    scoreDisplay.textContent = scoreInput.value;
    
    // Update color based on score
    const score = parseInt(scoreInput.value);
    scoreDisplay.className = 'ml-3 text-xl font-bold px-3 py-1 rounded-full min-w-[3rem] text-center';
    
    if (score >= 8) {
        scoreDisplay.classList.add('bg-green-100', 'text-green-800');
    } else if (score >= 6) {
        scoreDisplay.classList.add('bg-blue-100', 'text-blue-800');
    } else if (score >= 4) {
        scoreDisplay.classList.add('bg-yellow-100', 'text-yellow-800');
    } else if (score >= 2) {
        scoreDisplay.classList.add('bg-orange-100', 'text-orange-800');
    } else {
        scoreDisplay.classList.add('bg-red-100', 'text-red-800');
    }
}

// Load our wallet using the walletConfig module
async function loadWallet() {
    try {
        // Get wallet from our config module (handles env vars in production)
        wallet = await walletConfig.getWallet();
        
        walletAddress = await arweave.wallets.jwkToAddress(wallet);
        const balance = await arweave.wallets.getBalance(walletAddress);
        walletBalance = arweave.ar.winstonToAr(balance);
        
        console.log(`Wallet loaded: ${walletAddress.substring(0, 8)}... | Balance: ${walletBalance} AR`);
        return true;
    } catch (error) {
        console.error('Error loading wallet:', error);
        return false;
    }
}

// Update wallet status in UI (if we want to show it)
function updateWalletStatus() {
    const walletStatusEl = document.createElement('div');
    walletStatusEl.className = 'fixed bottom-4 right-4 bg-white shadow-lg rounded-lg p-3 text-sm border border-gray-200';
    
    if (wallet && walletAddress) {
        walletStatusEl.innerHTML = `
            <div class="flex items-center text-gray-700">
                <div class="h-2 w-2 rounded-full bg-green-500 mr-2"></div>
                <span class="font-medium">System wallet ready</span>
                <span class="mx-1 text-gray-400">|</span>
                <span>${walletBalance} AR</span>
            </div>
        `;
    } else {
        walletStatusEl.innerHTML = `
            <div class="flex items-center text-red-600">
                <div class="h-2 w-2 rounded-full bg-red-500 mr-2"></div>
                <span>System wallet unavailable</span>
            </div>
        `;
    }
    
    document.body.appendChild(walletStatusEl);
    
    // Hide after 5 seconds
    setTimeout(() => {
        walletStatusEl.style.opacity = '0';
        walletStatusEl.style.transition = 'opacity 0.5s';
        setTimeout(() => walletStatusEl.remove(), 500);
    }, 5000);
}

// Handle form submission
async function handleFormSubmit(e) {
    e.preventDefault();
    
    if (!wallet) {
        showError('System wallet is not available. Please try again later or use the Google Form option.');
        return;
    }
    
    try {
        // Disable button and show loading state
        uploadButton.disabled = true;
        uploadButton.innerHTML = `
            <svg class="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Processing...
        `;
        
        uploadStatus.innerHTML = `
            <div class="bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
                <div class="flex items-center">
                    <svg class="animate-pulse h-5 w-5 text-blue-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    <p class="text-sm text-blue-700">Uploading your rating to Arweave...</p>
                </div>
            </div>
        `;

        // Collect form data
        const ratingData = {
            firstName: document.getElementById('firstName').value.trim(),
            middleName: document.getElementById('middleName').value.trim(),
            lastName: document.getElementById('lastName').value.trim(),
            location: document.getElementById('location').value.trim(),
            associations: document.getElementById('associations').value.trim(),
            score: parseInt(document.getElementById('score').value),
            comments: document.getElementById('comments').value.trim(),
            timestamp: Math.floor(Date.now() / 1000)
        };

        // Convert to JSON
        const jsonData = JSON.stringify(ratingData);

        // Check data size
        const dataSize = new Blob([jsonData]).size;
        if (dataSize > MAX_DATA_SIZE) {
            throw new Error(`Rating data (${formatBytes(dataSize)}) exceeds maximum allowed size (${formatBytes(MAX_DATA_SIZE)})`); 
        }

        // Create transaction
        const transaction = await arweave.createTransaction({
            data: jsonData
        }, wallet);

        // Add tags for searchability
        transaction.addTag('Content-Type', 'application/json');
        transaction.addTag('App-Name', 'RateAnybody');
        transaction.addTag('Data-Type', 'rating');
        transaction.addTag('Unix-Time', String(ratingData.timestamp));
        transaction.addTag('First-Name', ratingData.firstName);
        transaction.addTag('Middle-Name', ratingData.middleName);
        transaction.addTag('Last-Name', ratingData.lastName);
        transaction.addTag('Location', ratingData.location);
        transaction.addTag('Associations', ratingData.associations);
        transaction.addTag('Rating-Score', String(ratingData.score));

        // Get transaction fee
        const fee = arweave.ar.winstonToAr(transaction.reward);
        console.log(`Transaction fee: ${fee} AR`);

        // Check if we have enough balance
        if (parseFloat(walletBalance) < parseFloat(fee)) {
            throw new Error(`Insufficient wallet balance (${walletBalance} AR) for transaction fee (${fee} AR)`);
        }

        // Sign and post transaction
        await arweave.transactions.sign(transaction, wallet);
        const response = await arweave.transactions.post(transaction);

        if (response.status === 200 || response.status === 202) {
            uploadStatus.innerHTML = `
                <div class="bg-green-50 border-l-4 border-green-500 p-4 rounded">
                    <div class="flex">
                        <div class="flex-shrink-0">
                            <svg class="h-5 w-5 text-green-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
                            </svg>
                        </div>
                        <div class="ml-3">
                            <h3 class="text-sm font-medium text-green-800">Rating Submitted Successfully!</h3>
                            <div class="mt-2 text-sm text-green-700">
                                <p>Your rating has been permanently stored on the Arweave blockchain.</p>
                                <p class="mt-2">
                                    <a href="https://arweave.net/${transaction.id}" target="_blank" class="font-medium text-green-700 underline">
                                        View Transaction: ${transaction.id.substring(0, 8)}...${transaction.id.substring(transaction.id.length - 8)}
                                    </a>
                                </p>
                                <p class="mt-2 text-xs text-green-600">Note: It may take a few minutes for your transaction to be mined.</p>
                            </div>
                        </div>
                    </div>
                </div>
            `;

            // Reset form
            ratingForm.reset();
            
            // Update score display
            if (scoreDisplay) {
                scoreDisplay.textContent = "5"; // Reset to default
                scoreDisplay.className = 'ml-3 bg-blue-100 text-blue-800 text-xl font-bold px-3 py-1 rounded-full min-w-[3rem] text-center';
            }
            
            // Update wallet balance
            walletBalance = (parseFloat(walletBalance) - parseFloat(fee)).toFixed(6);
            updateWalletStatus();
            
        } else {
            throw new Error(`Upload failed: ${response.statusText}`);
        }
    } catch (error) {
        console.error('Error:', error);
        showError(error.message);
    } finally {
        // Reset button
        uploadButton.disabled = false;
        uploadButton.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM6.293 6.707a1 1 0 010-1.414l3-3a1 1 0 011.414 0l3 3a1 1 0 01-1.414 1.414L11 5.414V13a1 1 0 11-2 0V5.414L7.707 6.707a1 1 0 01-1.414 0z" clip-rule="evenodd" />
            </svg>
            Upload Rating to Arweave
        `;
    }
}

// Helper function to show error messages
function showError(message) {
    uploadStatus.innerHTML = `
        <div class="bg-red-50 border-l-4 border-red-500 p-4 rounded">
            <div class="flex">
                <div class="flex-shrink-0">
                    <svg class="h-5 w-5 text-red-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                        <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
                    </svg>
                </div>
                <div class="ml-3">
                    <h3 class="text-sm font-medium text-red-800">Error</h3>
                    <div class="mt-2 text-sm text-red-700">
                        <p>${message}</p>
                    </div>
                </div>
            </div>
        </div>
    `;
}

// Helper function to format bytes
function formatBytes(bytes, decimals = 2) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

// Log script execution for debugging
console.log('upload.js script executed at', new Date().toISOString());

// Initialize and set up when DOM is ready with enhanced logging
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOMContentLoaded event fired at', new Date().toISOString());
    
    // Try to find slider elements directly for debugging
    const directScoreInput = document.getElementById('score');
    const directScoreDisplay = document.getElementById('scoreDisplay');
    console.log('Direct element check:', {
        scoreInput: directScoreInput,
        scoreDisplay: directScoreDisplay
    });
    
    // Initialize DOM elements
    initDomElements();
    
    // Initialize Arweave connection
    init().catch(error => {
        console.error('Initialization error:', error);
    });
});

// Fallback initialization - sometimes DOMContentLoaded doesn't fire if script is loaded late
if (document.readyState === 'complete' || document.readyState === 'interactive') {
    console.log('Document already ready, initializing immediately');
    setTimeout(() => {
        initDomElements();
        init().catch(error => {
            console.error('Delayed initialization error:', error);
        });
    }, 100);
}
