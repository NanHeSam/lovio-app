import { config } from 'dotenv';
import { resolve } from 'path';

// Load environment variables from .env.local
config({ path: resolve(__dirname, '../.env.local') });

import { db } from '../lib/db/index';
import { activities } from '../lib/db/schema';
import { ActivityType, FeedDetails, SleepDetails, DiaperDetails } from '../lib/db/types';
import { eq } from 'drizzle-orm';

// Your actual user and child IDs
const YOUR_USER_ID = 'user_2z4pSEXBF8UZpE310f1fZBt5by9';
const YOUR_CHILD_ID = 'c44ad938-76f8-4566-8229-323549068554'; // Orion

// Helper functions for creating test data
function hoursAgo(hours: number): Date {
  return new Date(Date.now() - hours * 60 * 60 * 1000);
}

function minutesAgo(minutes: number): Date {
  return new Date(Date.now() - minutes * 60 * 1000);
}

async function seedYourData() {
  try {
    console.log('🌱 Seeding activity data for Orion...');

    // Clear existing activities for Orion to avoid duplicates
    await db.delete(activities).where(eq(activities.childId, YOUR_CHILD_ID));

    const sampleActivities = [
      // Completed sleep from 2 hours ago (1.5 hour nap)
      {
        childId: YOUR_CHILD_ID,
        createdBy: YOUR_USER_ID,
        type: 'sleep' as ActivityType,
        startTime: hoursAgo(2),
        endTime: minutesAgo(30),
        details: { type: 'sleep' } as SleepDetails,
      },
      // Completed bottle feed 1 hour ago
      {
        childId: YOUR_CHILD_ID,
        createdBy: YOUR_USER_ID,
        type: 'feed' as ActivityType,
        startTime: hoursAgo(1),
        endTime: minutesAgo(45),
        details: {
          type: 'bottle',
          volume: 150,
          unit: 'ml'
        } as FeedDetails,
      },
      // Recent diaper change 30 minutes ago
      {
        childId: YOUR_CHILD_ID,
        createdBy: YOUR_USER_ID,
        type: 'diaper' as ActivityType,
        startTime: minutesAgo(30),
        endTime: minutesAgo(30),
        details: {
          type: 'diaper',
          contents: 'pee',
          volume: 'medium',
          hasRash: false
        } as DiaperDetails,
      },
      // Active sleep session started 25 minutes ago (ongoing nap)
      {
        childId: YOUR_CHILD_ID,
        createdBy: YOUR_USER_ID,
        type: 'sleep' as ActivityType,
        startTime: minutesAgo(25),
        endTime: null, // Active session
        details: { type: 'sleep' } as SleepDetails,
      },
      // Some older activities for history
      {
        childId: YOUR_CHILD_ID,
        createdBy: YOUR_USER_ID,
        type: 'feed' as ActivityType,
        startTime: hoursAgo(4),
        endTime: new Date(hoursAgo(4).getTime() + 15 * 60 * 1000), // 15 min feeding
        details: {
          type: 'nursing',
          leftDuration: 8,
          rightDuration: 7,
          totalDuration: 15
        } as FeedDetails,
      },
      {
        childId: YOUR_CHILD_ID,
        createdBy: YOUR_USER_ID,
        type: 'diaper' as ActivityType,
        startTime: hoursAgo(3),
        endTime: hoursAgo(3),
        details: {
          type: 'diaper',
          contents: 'both',
          volume: 'large',
          hasRash: false,
          pooColor: 'yellow',
          pooTexture: 'soft'
        } as DiaperDetails,
      },
    ];

    for (const activity of sampleActivities) {
      await db.insert(activities).values(activity);
    }

    console.log(`✅ Added ${sampleActivities.length} activities for Orion`);
    console.log('🎉 You should now see:');
    console.log('  - Active sleep session (25 minutes and counting)');
    console.log('  - Last feed: 1 hour ago (bottle, 150ml)');
    console.log('  - Last diaper: 30 minutes ago (pee)');
    console.log('');
    console.log('🌐 Visit /dashboard to see the live activity cards!');

  } catch (error) {
    console.error('❌ Error seeding your data:', error);
    throw error;
  }
}

seedYourData();