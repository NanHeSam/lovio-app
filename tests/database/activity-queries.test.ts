import { describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import { db, getPool } from '@/lib/db';
import { users, children, userChildren, activities } from '@/lib/db/schema';
import {
  startActivity,
  updateActivity,
  logInstantActivity,
  getActiveSessions,
  getDailySummary,
  getRecentActivities,
  validateChildAccess
} from '@/lib/db/queries';
import type { DiaperDetails, NursingDetails } from '@/lib/db/types';
import { randomUUID } from 'crypto';

describe('Activity Query Functions', () => {
  // Test data
  let testUser: { id: string; fullName: string };
  let testChild: { id: string; name: string };
  let testUserChild: { id: string };

  beforeAll(async () => {
    // Create test user
    const [user] = await db
      .insert(users)
      .values({
        id: randomUUID(),
        fullName: 'Test Parent',
        timezone: 'America/New_York',
      })
      .returning();
    testUser = user;

    // Create test child
    const [child] = await db
      .insert(children)
      .values({
        name: 'Test Baby',
        birthDate: '2023-01-15',
        gender: 'female',
      })
      .returning();
    testChild = child;

    // Link user to child
    const [userChild] = await db
      .insert(userChildren)
      .values({
        userId: testUser.id,
        childId: testChild.id,
        role: 'mom',
      })
      .returning();
    testUserChild = userChild;
  });

  beforeEach(async () => {
    // Clean up activities before each test
    await db.delete(activities);
  });

  afterAll(async () => {
    // Clean up test data
    await db.delete(userChildren);
    await db.delete(children);
    await db.delete(users);
    
    // Close database connection
    const pool = getPool();
    if (pool) {
      await pool.end();
    }
  });

  describe('startActivity', () => {
    it('should start a sleep session successfully', async () => {
      const result = await startActivity({
        childId: testChild.id,
        createdBy: testUser.id,
        type: 'sleep',
      });

      expect(result).toBeDefined();
      expect(result.type).toBe('sleep');
      expect(result.childId).toBe(testChild.id);
      expect(result.createdBy).toBe(testUser.id);
      expect(result.startTime).toBeInstanceOf(Date);
      expect(result.endTime).toBeNull();
    });

    it('should start a feed session with details', async () => {
      const feedDetails: NursingDetails = {
        type: 'nursing',
        leftDuration: 10,
        rightDuration: 15,
      };

      const result = await startActivity({
        childId: testChild.id,
        createdBy: testUser.id,
        type: 'feed',
        details: feedDetails,
      });

      expect(result.type).toBe('feed');
      expect(result.details).toEqual(feedDetails);
    });

    it('should prevent starting duplicate sessions', async () => {
      // Start first sleep session
      await startActivity({
        childId: testChild.id,
        createdBy: testUser.id,
        type: 'sleep',
      });

      // Try to start another sleep session
      await expect(
        startActivity({
          childId: testChild.id,
          createdBy: testUser.id,
          type: 'sleep',
        })
      ).rejects.toThrow('Child already has an active sleep session');
    });

    it('should reject instant activity types', async () => {
      await expect(
        startActivity({
          childId: testChild.id,
          createdBy: testUser.id,
          type: 'diaper',
        })
      ).rejects.toThrow('Only sleep and feed activities can be started as sessions');
    });
  });

  describe('updateActivity (ending activities)', () => {
    it('should end an active session successfully', async () => {
      // Start a session
      const session = await startActivity({
        childId: testChild.id,
        createdBy: testUser.id,
        type: 'sleep',
      });

      // End the session
      const endTime = new Date();
      const result = await updateActivity({
        activityId: session.id,
        endTime: endTime
      });

      expect(result.endTime).toEqual(endTime);
      expect(result.id).toBe(session.id);
    });

    it('should merge details when ending activity', async () => {
      const initialDetails: NursingDetails = {
        type: 'nursing',
        leftDuration: 10,
      };

      // Start session with initial details
      const session = await startActivity({
        childId: testChild.id,
        createdBy: testUser.id,
        type: 'feed',
        details: initialDetails,
      });

      // End with additional details (merge with existing details)
      const result = await updateActivity({
        activityId: session.id,
        details: {
          ...initialDetails,
          rightDuration: 15,
          totalDuration: 25,
        },
      });

      expect(result.details).toEqual({
        ...initialDetails,
        rightDuration: 15,
        totalDuration: 25,
      });
    });

    it('should reject ending already ended activity', async () => {
      // Start and end a session
      const session = await startActivity({
        childId: testChild.id,
        createdBy: testUser.id,
        type: 'sleep',
      });

      await updateActivity({
        activityId: session.id,
        endTime: new Date(),
      });

      // Try to end again
      await expect(
        updateActivity({
          activityId: session.id,
          endTime: new Date(),
        })
      ).rejects.toThrow('Activity session is already ended');
    });

    it('should reject non-existent activity', async () => {
      await expect(
        updateActivity({
          activityId: randomUUID(),
        })
      ).rejects.toThrow('Activity not found');
    });
  });

  describe('logInstantActivity', () => {
    it('should log a diaper change successfully', async () => {
      const diaperDetails: DiaperDetails = {
        type: 'diaper',
        contents: 'both',
        volume: 'medium',
        hasRash: false,
      };

      const result = await logInstantActivity({
        childId: testChild.id,
        createdBy: testUser.id,
        type: 'diaper',
        details: diaperDetails,
      });

      expect(result.type).toBe('diaper');
      expect(result.details).toEqual(diaperDetails);
      expect(result.startTime).toEqual(result.endTime);
    });

    it('should reject session-based activity types', async () => {
      await expect(
        logInstantActivity({
          childId: testChild.id,
          createdBy: testUser.id,
          type: 'sleep',
          details: { type: 'sleep' },
        })
      ).rejects.toThrow('Sleep and feed activities should use startActivity/updateActivity');
    });
  });

  describe('getActiveSessions', () => {
    beforeEach(async () => {
      // Clean up first, then start fresh sessions
      await db.delete(activities);
      
      // Start multiple sessions for testing
      await startActivity({
        childId: testChild.id,
        createdBy: testUser.id,
        type: 'sleep',
      });

      await startActivity({
        childId: testChild.id,
        createdBy: testUser.id,
        type: 'feed',
      });

      // Add a completed activity (should not appear in active sessions)
      // Create a separate child for this to avoid conflicts
      const [tempChild] = await db
        .insert(children)
        .values({
          name: 'Temp Child',
          birthDate: '2023-01-15',
          gender: 'male',
        })
        .returning();

      const completedSession = await startActivity({
        childId: tempChild.id,
        createdBy: testUser.id,
        type: 'sleep',
      });
      await updateActivity({ activityId: completedSession.id });
    });

    it('should return all active sessions for child', async () => {
      const sessions = await getActiveSessions({ childId: testChild.id });

      expect(sessions).toHaveLength(2);
      expect(sessions.map(s => s.type).sort()).toEqual(['feed', 'sleep']);
      expect(sessions[0].childName).toBe('Test Baby');
      expect(sessions[0].durationMinutes).toBeGreaterThanOrEqual(0);
    });

    it('should return all active sessions when no filter', async () => {
      const sessions = await getActiveSessions();
      expect(sessions.length).toBeGreaterThanOrEqual(2);
    });

    it('should return empty array when no active sessions', async () => {
      // End all sessions
      const allSessions = await getActiveSessions({ childId: testChild.id });
      for (const session of allSessions) {
        await updateActivity({ activityId: session.id, endTime: new Date() });
      }

      const emptySessions = await getActiveSessions({ childId: testChild.id });
      expect(emptySessions).toHaveLength(0);
    });
  });

  describe('getDailySummary', () => {
    beforeEach(async () => {
      // Clean up first
      await db.delete(activities);
      
      const today = new Date();
      
      // Create sleep session (2 hours)
      const sleepStart = new Date(today.getTime() - 3 * 60 * 60 * 1000); // 3 hours ago
      const sleepEnd = new Date(today.getTime() - 1 * 60 * 60 * 1000); // 1 hour ago
      
      const sleepSession = await startActivity({
        childId: testChild.id,
        createdBy: testUser.id,
        type: 'sleep',
        startTime: sleepStart,
      });
      
      await updateActivity({
        activityId: sleepSession.id,
        endTime: sleepEnd,
      });

      // Create feed session (30 minutes)
      const feedStart = new Date(today.getTime() - 2 * 60 * 60 * 1000); // 2 hours ago
      const feedEnd = new Date(today.getTime() - 1.5 * 60 * 60 * 1000); // 1.5 hours ago
      
      const feedSession = await startActivity({
        childId: testChild.id,
        createdBy: testUser.id,
        type: 'feed',
        startTime: feedStart,
      });
      
      await updateActivity({
        activityId: feedSession.id,
        endTime: feedEnd,
      });

      // Create diaper changes
      await logInstantActivity({
        childId: testChild.id,
        createdBy: testUser.id,
        type: 'diaper',
        details: { type: 'diaper', contents: 'pee', volume: 'medium' },
      });

      await logInstantActivity({
        childId: testChild.id,
        createdBy: testUser.id,
        type: 'diaper',
        details: { type: 'diaper', contents: 'poo', volume: 'large' },
      });
    });

    it('should calculate daily summary correctly', async () => {
      const summary = await getDailySummary({
        childId: testChild.id,
      });

      expect(summary.childName).toBe('Test Baby');
      expect(summary.totalSleep).toBe(120); // 2 hours = 120 minutes
      expect(summary.sleepSessions).toBe(1);
      expect(summary.totalFeed).toBe(30); // 30 minutes
      expect(summary.feedSessions).toBe(1);
      expect(summary.diaperChanges).toBe(2);
      expect(summary.date).toBe(new Date().toISOString().split('T')[0]);
    });

    it('should handle empty day correctly', async () => {
      // Clear all activities
      await db.delete(activities);

      const summary = await getDailySummary({
        childId: testChild.id,
      });

      expect(summary.totalSleep).toBe(0);
      expect(summary.sleepSessions).toBe(0);
      expect(summary.totalFeed).toBe(0);
      expect(summary.feedSessions).toBe(0);
      expect(summary.diaperChanges).toBe(0);
    });

    it('should reject non-existent child', async () => {
      await expect(
        getDailySummary({
          childId: randomUUID(),
        })
      ).rejects.toThrow('Child not found');
    });
  });

  describe('getRecentActivities', () => {
    beforeEach(async () => {
      // Clean up first
      await db.delete(activities);
      
      const now = new Date();
      
      // Create activities at different times
      await logInstantActivity({
        childId: testChild.id,
        createdBy: testUser.id,
        type: 'diaper',
        time: new Date(now.getTime() - 30 * 60 * 1000), // 30 minutes ago
        details: { type: 'diaper', contents: 'pee', volume: 'little' },
      });

      const feedSession = await startActivity({
        childId: testChild.id,
        createdBy: testUser.id,
        type: 'feed',
        startTime: new Date(now.getTime() - 2 * 60 * 60 * 1000), // 2 hours ago
      });
      
      await updateActivity({
        activityId: feedSession.id,
        endTime: new Date(now.getTime() - 1.5 * 60 * 60 * 1000), // 1.5 hours ago
      });
    });

    it('should return recent activities in chronological order', async () => {
      const activities = await getRecentActivities({
        childId: testChild.id,
      });

      expect(activities.length).toBeGreaterThanOrEqual(2);
      expect(activities[0].type).toBe('diaper'); // Most recent first
      expect(activities[1].type).toBe('feed');
      expect(activities[0].ago).toContain('minute');
      expect(activities[1].ago).toContain('hour');
    });

    it('should filter by activity type', async () => {
      const feedActivities = await getRecentActivities({
        childId: testChild.id,
        type: 'feed',
      });

      expect(feedActivities).toHaveLength(1);
      expect(feedActivities[0].type).toBe('feed');
    });

    it('should limit results', async () => {
      const activities = await getRecentActivities({
        childId: testChild.id,
        limit: 1,
      });

      expect(activities).toHaveLength(1);
    });

    it('should filter by time range', async () => {
      const activities = await getRecentActivities({
        childId: testChild.id,
        hoursBack: 1, // Only last hour
      });

      expect(activities).toHaveLength(1);
      expect(activities[0].type).toBe('diaper');
    });
  });



  describe('validateChildAccess', () => {
    it('should return true for valid user-child relationship', async () => {
      const hasAccess = await validateChildAccess(testUser.id, testChild.id);
      expect(hasAccess).toBe(true);
    });

    it('should return false for invalid user-child relationship', async () => {
      const hasAccess = await validateChildAccess(randomUUID(), testChild.id);
      expect(hasAccess).toBe(false);
    });
  });
});