const path = require('path');
const webpack = require('webpack');
require('dotenv').config();

// Determine if we're in production mode based on NODE_ENV
const isProd = process.env.NODE_ENV === 'production';

// Get environment variables
const env = {
  'process.env.WALLET_JSON_BASE64': JSON.stringify(process.env.WALLET_JSON_BASE64)
};

module.exports = {
  mode: isProd ? 'production' : 'development',
  experiments: {
    topLevelAwait: true
  },
  entry: {
    view: './src/js/view.js',
    upload: './src/js/upload.js'
  },
  output: {
    filename: '[name].bundle.js',
    path: path.resolve(__dirname, 'public/js'),
    clean: true // Clean the output directory before emit
  },
  devtool: isProd ? 'source-map' : 'eval-source-map',
  watch: !isProd, // Only watch in development mode
  resolve: {
    extensions: ['.js'] // Automatically resolve these extensions
  },
  optimization: {
    minimize: isProd // Only minimize in production
  },
  plugins: [
    // Inject environment variables into the client code
    new webpack.DefinePlugin(env)
  ],
  devServer: {
    static: {
      directory: path.join(__dirname, 'public'),
    },
    compress: true,
    port: process.env.PORT || 3000,
    hot: true,
    open: true
  }
};
