import { describe, it, expect, afterAll } from '@jest/globals';
import { db, getPool } from '@/lib/db';
import { sql } from 'drizzle-orm';

describe('Database Setup', () => {
  afterAll(async () => {
    const pool = getPool();
    if (pool) {
      await pool.end();
    }
  });

  it('should connect to database successfully', async () => {
    const result = await db.execute(sql`SELECT 1 as test`);
    expect(result.rows).toHaveLength(1);
    expect(result.rows[0].test).toBe(1);
  });

  it('should have uuid-ossp extension available', async () => {
    const result = await db.execute(sql`SELECT uuid_generate_v4() as uuid`);
    expect(result.rows).toHaveLength(1);
    expect(result.rows[0].uuid).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
  });

  it('should have all required tables', async () => {
    const tables = await db.execute(sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
      ORDER BY table_name
    `);
    
    const tableNames = tables.rows.map((row: any) => row.table_name);
    expect(tableNames).toContain('users');
    expect(tableNames).toContain('children');
    expect(tableNames).toContain('user_children');
    expect(tableNames).toContain('activities');
    expect(tableNames).toContain('ai_interactions');
  });
});