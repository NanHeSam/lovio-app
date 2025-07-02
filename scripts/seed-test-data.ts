import { config } from 'dotenv';
import { resolve } from 'path';

// Load environment variables from .env.local
config({ path: resolve(__dirname, '../.env.local') });

import { db } from '../lib/db/index';
import { users, children, userChildren, activities } from '../lib/db/schema';
import { ActivityType, FeedDetails, SleepDetails, DiaperDetails } from '../lib/db/types';
import { eq } from 'drizzle-orm';

// Test user and child IDs (hardcoded for testing)
export const TEST_USER_ID = 'user_test_2z4pSEXBF8UZpE310f1fZBt5by9'; // Clerk format
export const TEST_CHILD_ID = '550e8400-e29b-41d4-a716-446655440001';

// Helper functions for creating test data
function hoursAgo(hours: number): Date {
  return new Date(Date.now() - hours * 60 * 60 * 1000);
}

function minutesAgo(minutes: number): Date {
  return new Date(Date.now() - minutes * 60 * 1000);
}

async function seedSampleActivities() {
  console.log('🔄 Seeding sample activities...');

  // Clear existing activities for this child to avoid duplicates
  await db.delete(activities).where(eq(activities.childId, TEST_CHILD_ID));

  const sampleActivities = [
    // Completed sleep from 3 hours ago (2 hour nap)
    {
      childId: TEST_CHILD_ID,
      createdBy: TEST_USER_ID,
      type: 'sleep' as ActivityType,
      startTime: hoursAgo(3),
      endTime: hoursAgo(1),
      details: { type: 'sleep' } as SleepDetails,
    },
    // Completed bottle feed 45 minutes ago
    {
      childId: TEST_CHILD_ID,
      createdBy: TEST_USER_ID,
      type: 'feed' as ActivityType,
      startTime: minutesAgo(45),
      endTime: minutesAgo(30),
      details: {
        type: 'bottle',
        volume: 120,
        unit: 'ml'
      } as FeedDetails,
    },
    // Recent diaper change 20 minutes ago
    {
      childId: TEST_CHILD_ID,
      createdBy: TEST_USER_ID,
      type: 'diaper' as ActivityType,
      startTime: minutesAgo(20),
      endTime: minutesAgo(20),
      details: {
        type: 'diaper',
        contents: 'both',
        volume: 'medium',
        hasRash: false,
        pooColor: 'brown',
        pooTexture: 'soft'
      } as DiaperDetails,
    },
    // Active nursing session started 8 minutes ago
    {
      childId: TEST_CHILD_ID,
      createdBy: TEST_USER_ID,
      type: 'feed' as ActivityType,
      startTime: minutesAgo(8),
      endTime: null, // Active session
      details: {
        type: 'nursing',
        leftDuration: 5,
        rightDuration: 3,
        totalDuration: 8
      } as FeedDetails,
    },
    // Some older activities for history
    {
      childId: TEST_CHILD_ID,
      createdBy: TEST_USER_ID,
      type: 'sleep' as ActivityType,
      startTime: hoursAgo(8),
      endTime: hoursAgo(6),
      details: { type: 'sleep' } as SleepDetails,
    },
    {
      childId: TEST_CHILD_ID,
      createdBy: TEST_USER_ID,
      type: 'diaper' as ActivityType,
      startTime: hoursAgo(2),
      endTime: hoursAgo(2),
      details: {
        type: 'diaper',
        contents: 'pee',
        volume: 'little',
        hasRash: false
      } as DiaperDetails,
    },
  ];

  for (const activity of sampleActivities) {
    await db.insert(activities).values(activity).onConflictDoNothing();
  }

  console.log(`✅ Added ${sampleActivities.length} sample activities`);
}

async function seedTestData() {
  try {
    console.log('🌱 Seeding test data...');

    // Insert test user
    await db.insert(users).values({
      id: TEST_USER_ID,
      fullName: 'Test Parent',
      timezone: 'America/Los_Angeles',
      preferences: {
        notifications: true,
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

    // Seed sample activities
    await seedSampleActivities();

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
