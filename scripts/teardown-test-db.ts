#!/usr/bin/env tsx

/**
 * Teardown script for test database
 * This script stops and removes the test database container
 */

import { execSync } from 'child_process';

async function teardownTestDatabase() {
  console.log('🧹 Tearing down test database...');

  try {
    // Stop and remove the test database container
    console.log('🛑 Stopping test database container...');
    try {
      execSync('docker compose down postgres-test', { stdio: 'inherit' });
    } catch {
      execSync('docker-compose down postgres-test', { stdio: 'inherit' });
    }
    
    console.log('✅ Test database container stopped');
  } catch (error) {
    console.error('Failed to stop test database container:', error);
    process.exit(1);
  }

  console.log('🎉 Test database teardown complete!');
}

// Run teardown if this script is executed directly
if (require.main === module) {
  teardownTestDatabase().catch((error) => {
    console.error('Teardown failed:', error);
    process.exit(1);
  });
}

export { teardownTestDatabase };