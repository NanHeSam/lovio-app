#!/usr/bin/env tsx

/**
 * Setup script for test database
 * This script:
 * 1. Starts the test database container
 * 2. Waits for it to be ready
 * 3. Runs migrations on the test database
 */

import { execSync } from 'child_process';
import { drizzle } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { Pool } from 'pg';
import path from 'path';

const TEST_DATABASE_URL = process.env.TEST_DATABASE_URL || 'postgresql://lovio_user:lovio_password@localhost:5433/lovio_test_db';

async function setupTestDatabase() {
  console.log('🐳 Setting up test database...');

  // Start the test database container
  console.log('📦 Starting test database container...');
  try {
    // Try docker compose first (newer version), fallback to docker-compose
    try {
      execSync('docker compose up -d postgres-test', { stdio: 'inherit' });
    } catch {
      execSync('docker-compose up -d postgres-test', { stdio: 'inherit' });
    }
  } catch (error) {
    console.error('Failed to start test database container:', error);
    console.error('Make sure Docker is running and try: docker compose up -d postgres-test');
    process.exit(1);
  }

  // Wait for database to be ready
  console.log('⏳ Waiting for test database to be ready...');
  let attempts = 0;
  const maxAttempts = 30;
  
  while (attempts < maxAttempts) {
    try {
      const pool = new Pool({ connectionString: TEST_DATABASE_URL });
      await pool.query('SELECT 1');
      await pool.end();
      break;
    } catch (error) {
      attempts++;
      if (attempts >= maxAttempts) {
        console.error('❌ Test database failed to start after 30 attempts');
        process.exit(1);
      }
      console.log(`Attempt ${attempts}/${maxAttempts} - Database not ready yet, waiting...`);
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }

  console.log('✅ Test database is ready!');

  // Run migrations
  console.log('🔄 Running migrations on test database...');
  try {
    const pool = new Pool({ connectionString: TEST_DATABASE_URL });
    const db = drizzle(pool);
    
    await migrate(db, {
      migrationsFolder: path.join(__dirname, '..', 'drizzle'),
    });
    
    await pool.end();
    console.log('✅ Migrations completed successfully!');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }

  console.log('🎉 Test database setup complete!');
  console.log(`📍 Test database URL: ${TEST_DATABASE_URL}`);
  console.log('🚀 You can now run tests with: npm test');
}

// Run setup if this script is executed directly
if (require.main === module) {
  setupTestDatabase().catch((error) => {
    console.error('Setup failed:', error);
    process.exit(1);
  });
}

export { setupTestDatabase };