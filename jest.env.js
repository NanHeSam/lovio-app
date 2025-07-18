// Load test environment variables
const { config } = require('dotenv');
const path = require('path');

// Load .env.test file for test environment
config({ path: path.resolve(__dirname, '.env.test') });

// Set NODE_ENV to test if not already set
if (!process.env.NODE_ENV) {
  process.env.NODE_ENV = 'test';
}