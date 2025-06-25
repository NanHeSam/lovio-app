import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema';

let _db: ReturnType<typeof drizzle> | null = null;
let _pool: Pool | null = null;

function initializeDb() {
  if (!_db) {
    if (!process.env.DATABASE_URL) {
      throw new Error('DATABASE_URL is not defined');
    }
    
    _pool = new Pool({
      connectionString: process.env.DATABASE_URL,
    });
    
    _db = drizzle(_pool, { schema });
  }
  return _db;
}

export const db = new Proxy({} as ReturnType<typeof drizzle>, {
  get(target, prop) {
    const actualDb = initializeDb();
    return actualDb[prop as keyof typeof actualDb];
  }
});

// Export pool getter for cleanup in tests
export function getPool() {
  return _pool;
}

// Export schema for use in other parts of the application
export * from './schema';
export * from './types';
export * from './queries';

