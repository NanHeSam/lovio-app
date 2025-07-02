import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { db } from './index';
import { join } from 'path';

/**
 * Run database migrations
 * This function ensures the database schema is up to date
 */
export async function runMigrations() {
  try {
    console.log('🔄 Checking for database migrations...');
    
    // Try multiple possible paths for the drizzle folder
    const possiblePaths = [
      join(process.cwd(), 'drizzle'),
      join(__dirname, '../../drizzle'),
      join(process.cwd(), '.next/server/chunks/drizzle'),
      join(process.cwd(), 'node_modules/.prisma/client/drizzle') // fallback
    ];
    
    let migrationsFolder = possiblePaths[0]; // default
    
    // Check which path exists
    const fs = await import('fs');
    for (const path of possiblePaths) {
      try {
        if (fs.existsSync(join(path, 'meta/_journal.json'))) {
          migrationsFolder = path;
          console.log(`📁 Found migrations at: ${migrationsFolder}`);
          break;
        }
      } catch {
        // continue checking other paths
      }
    }
    
    await migrate(db, { 
      migrationsFolder,
      migrationsTable: '__drizzle_migrations'
    });
    
    console.log('✅ Database migrations completed successfully');
  } catch (error) {
    console.error('❌ Database migration failed:', error);
    throw error;
  }
}

/**
 * Initialize database with migrations on app startup
 * This is a safe operation that only runs pending migrations
 */
export async function initializeDatabase() {
  try {
    // Only run migrations in production and development
    // Skip in test environment to avoid conflicts
    if (process.env.NODE_ENV !== 'test') {
      await runMigrations();
    }
  } catch (error) {
    console.error('❌ Failed to initialize database:', error);
    // In development, we might want to continue anyway
    if (process.env.NODE_ENV === 'production') {
      throw error; // Fail hard in production
    }
    console.warn('⚠️ Continuing despite migration error (development mode)');
  }
}