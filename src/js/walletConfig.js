// walletConfig.js - Simplified wallet management system
// Uses environment variable WALLET_JSON_BASE64 exclusively, injected by webpack

/**
 * New simplified wallet management:
 * - Uses Base64 encoded wallet from environment variable WALLET_JSON_BASE64
 * - Environment variable is injected at build time via webpack
 * - Works the same in both development and production
 * 
 * SECURITY NOTE: Never commit the actual wallet to the repository.
 * Always use the environment variable approach.
 */

// Wallet utilities
const walletConfig = {
  // Get the wallet data - returns a Promise that resolves to the wallet JSON
  getWallet: async function() {
    try {
      console.log('Loading wallet from environment variable');
      
      // Check for environment variable (injected by webpack)
      if (!process.env.WALLET_JSON_BASE64) {
        throw new Error('No WALLET_JSON_BASE64 environment variable found');
      }
      
      // Decode base64 wallet
      const walletData = atob(process.env.WALLET_JSON_BASE64);
      const wallet = JSON.parse(walletData);
      console.log('✓ Successfully loaded wallet from environment variable');
      
      // Verify wallet structure
      if (!wallet.kty || !wallet.n || !wallet.e || !wallet.d) {
        console.error('WARNING: Wallet loaded from environment variable appears incomplete');
      }
      
      return wallet;
    } catch (error) {
      console.error('ERROR: Failed to load wallet from environment variable:', error);
      throw new Error(`Wallet loading failed: ${error.message}`);
    }
  },
  
  // Helper to convert a wallet JSON to base64 for environment variable
  walletToBase64: function(walletJson) {
    try {
      const walletStr = JSON.stringify(walletJson);
      return btoa(walletStr);
    } catch (error) {
      console.error('Failed to convert wallet to base64:', error);
      throw error;
    }
  },
  
  // Get wallet environment info (for debugging)
  getEnvironmentInfo: function() {
    return {
      hasEnvVar: typeof process !== 'undefined' && 
                process.env && 
                !!process.env[WALLET_ENV_VAR],
      envVarName: WALLET_ENV_VAR
    };
  }
};

export default walletConfig;
