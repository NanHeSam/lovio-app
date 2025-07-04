#!/usr/bin/env tsx

/**
 * Test runner that automatically sets up and tears down the test database
 * Usage: npm run test:with-db [jest-options]
 */

import { execSync } from 'child_process';
import { setupTestDatabase } from './setup-test-db';
import { teardownTestDatabase } from './teardown-test-db';

async function runTestsWithDatabase() {
  const jestArgs = process.argv.slice(2);
  
  try {
    // Setup test database
    await setupTestDatabase();
    
    console.log('🧪 Running tests...');
    
    // Run Jest with provided arguments
    const jestCommand = `jest ${jestArgs.join(' ')}`;
    execSync(jestCommand, { stdio: 'inherit' });
    
    console.log('✅ Tests completed successfully!');
    
  } catch (error) {
    console.error('❌ Tests failed:', error);
    process.exit(1);
  } finally {
    // Always try to clean up
    try {
      await teardownTestDatabase();
    } catch (cleanupError) {
      console.warn('⚠️  Failed to cleanup test database:', cleanupError);
    }
  }
}

// Run if this script is executed directly
if (require.main === module) {
  runTestsWithDatabase().catch((error) => {
    console.error('Test runner failed:', error);
    process.exit(1);
  });
}