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
    
    const migrationsFolder = join(process.cwd(), 'drizzle');
    
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