// Simple script to test database connection with Drizzle
// Run with: node test-db-connection.js

require('dotenv').config({ path: '.env.local' });
const { Pool } = require('pg');
const { drizzle } = require('drizzle-orm/node-postgres');

async function testConnection() {
  console.log('Testing database connection...');
  console.log('DATABASE_URL:', process.env.DATABASE_URL);
  
  try {
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
    });
    
    const db = drizzle(pool);
    
    // Test basic connection
    const result = await pool.query('SELECT NOW() as current_time, version() as postgres_version');
    console.log('✅ Database connection successful!');
    console.log('Current time:', result.rows[0].current_time);
    console.log('PostgreSQL version:', result.rows[0].postgres_version);
    
    await pool.end();
  } catch (error) {
    console.error('❌ Database connection failed:');
    console.error(error.message);
    process.exit(1);
  }
}

testConnection();