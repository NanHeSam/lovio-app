import { config } from 'dotenv';
import { resolve } from 'path';

// Load environment variables from .env.local
config({ path: resolve(__dirname, '../.env.local') });

import { db } from '../lib/db/index';
import { users, children, userChildren } from '../lib/db/schema';

// Test user and child IDs (hardcoded for testing)
export const TEST_USER_ID = '550e8400-e29b-41d4-a716-446655440000';
export const TEST_CHILD_ID = '550e8400-e29b-41d4-a716-446655440001';

async function seedTestData() {
  try {
    console.log('🌱 Seeding test data...');

    // Insert test user
    await db.insert(users).values({
      id: TEST_USER_ID,
      fullName: 'Test Parent',
      timezone: 'America/New_York',
      preferences: {
        notifications: {
          email: true,
          push: true,
          reminders: true
        },
        privacy: {
          shareData: false,
          analytics: true
        }
      }
    }).onConflictDoNothing();

    // Insert test child
    await db.insert(children).values({
      id: TEST_CHILD_ID,
      name: 'Test Baby',
      birthDate: '2024-01-15',
      gender: 'female',
      metadata: {
        weight: [{
          date: '2024-01-15',
          value: 3.2,
          unit: 'kg'
        }],
        height: [{
          date: '2024-01-15',
          value: 50,
          unit: 'cm'
        }]
      }
    }).onConflictDoNothing();

    // Link user and child
    await db.insert(userChildren).values({
      userId: TEST_USER_ID,
      childId: TEST_CHILD_ID,
      role: 'mom',
      permissions: {
        read: true,
        write: true,
        admin: true
      }
    }).onConflictDoNothing();

    console.log('✅ Test data seeded successfully!');
    console.log(`Test User ID: ${TEST_USER_ID}`);
    console.log(`Test Child ID: ${TEST_CHILD_ID}`);
    
  } catch (error) {
    console.error('❌ Error seeding test data:', error);
    throw error;
  }
}

// Run if called directly
if (require.main === module) {
  seedTestData()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

export { seedTestData };