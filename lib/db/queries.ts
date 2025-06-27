import { db } from './index';
import { activities, children, users, userChildren } from './schema';
import { eq, and, isNull, desc, gte, lte } from 'drizzle-orm';
import type { 
  ActivityType, 
  ActivityDetails,
  ActiveSession,
  DailySummary,
  RecentActivity,
  ActivityWithChild
} from './types';

// ============================================================================
// ACTIVITY SESSION MANAGEMENT
// ============================================================================

/**
 * Start a new activity session (sleep/feed)
 * For activities that have duration (sleep, nursing)
 */
export async function startActivity(params: {
  childId: string;
  createdBy: string;
  type: ActivityType;
  startTime?: Date;
  details?: ActivityDetails;
}) {
  const { childId, createdBy, type, startTime = new Date(), details } = params;
  
  // Validate that this activity type supports sessions
  if (!['sleep', 'feed'].includes(type)) {
    throw new Error('Only sleep and feed activities can be started as sessions');
  }
  
  // Check if there's already an active session of this type for this child
  const existingSession = await db
    .select()
    .from(activities)
    .where(
      and(
        eq(activities.childId, childId),
        eq(activities.type, type),
        isNull(activities.endTime)
      )
    )
    .limit(1);
  
  if (existingSession.length > 0) {
    throw new Error(`Child already has an active ${type} session`);
  }
  
  const [newActivity] = await db
    .insert(activities)
    .values({
      childId,
      createdBy,
      type,
      startTime,
      ...(details && { details })
    })
    .returning();
  
  return newActivity;
}

/**
 * Update an existing activity (modify start time, end time, details, etc.)
 * This replaces the old endActivity function - ending is just updating endTime
 */
export async function updateActivity(params: {
  activityId: string;
  startTime?: Date;
  endTime?: Date;
  details?: ActivityDetails;
}) {
  const { activityId, startTime, endTime, details } = params;
  
  // Get the current activity to merge details
  const currentActivities = await db
    .select()
    .from(activities)
    .where(eq(activities.id, activityId))
    .limit(1);
  
  if (currentActivities.length === 0) {
    throw new Error('Activity not found');
  }
  
  const currentActivity = currentActivities[0];
  
  // Check if trying to end an already ended activity
  if (endTime !== undefined && currentActivity.endTime) {
    throw new Error('Activity session is already ended');
  }
  
  // Merge details if provided
  const mergedDetails = details ? { ...currentActivity.details, ...details } as ActivityDetails : currentActivity.details;
  
  // Build update object with only provided fields
  const updateData: {
    updatedAt: Date;
    details: ActivityDetails;
    startTime?: Date;
    endTime?: Date;
  } = {
    updatedAt: new Date(),
    details: mergedDetails
  };
  
  if (startTime !== undefined) {
    updateData.startTime = startTime;
  }
  
  if (endTime !== undefined) {
    updateData.endTime = endTime;
  }
  
  const [updatedActivity] = await db
    .update(activities)
    .set(updateData)
    .where(eq(activities.id, activityId))
    .returning();
  
  return updatedActivity;
}

/**
 * Log instant activity (diaper)
 * For activities that don't have duration
 */
export async function logInstantActivity(params: {
  childId: string;
  createdBy: string;
  type: ActivityType;
  time?: Date;
  details: ActivityDetails;
}) {
  const { childId, createdBy, type, time = new Date(), details } = params;
  
  // Validate that this is an instant activity type
  if (['sleep', 'feed'].includes(type)) {
    throw new Error('Sleep and feed activities should use startActivity/endActivity');
  }
  
  const [newActivity] = await db
    .insert(activities)
    .values({
      childId,
      createdBy,
      type,
      startTime: time,
      endTime: time, // Same as start time for instant activities
      details
    })
    .returning();
  
  return newActivity;
}

// ============================================================================
// QUERY FUNCTIONS
// ============================================================================

/**
 * Get all active sessions for a child or all children
 * "Is baby sleeping?"
 */
export async function getActiveSessions(params?: {
  childId?: string;
  userId?: string;
}): Promise<ActiveSession[]> {
  const { childId, userId } = params || {};
  
  const whereConditions = [isNull(activities.endTime)];
  
  if (childId) {
    whereConditions.push(eq(activities.childId, childId));
  }
  
  const query = db
    .select({
      id: activities.id,
      type: activities.type,
      childId: activities.childId,
      childName: children.name,
      startTime: activities.startTime,
    })
    .from(activities)
    .innerJoin(children, eq(activities.childId, children.id))
    .where(and(...whereConditions));
  
  // If userId provided, filter by children the user has access to
  if (userId) {
    // This would need to join with user_children table
    // For now, we'll keep it simple
  }
  
  const results = await query;
  
  return results.map(result => ({
    id: result.id,
    type: result.type,
    childId: result.childId,
    childName: result.childName,
    startTime: result.startTime,
    durationMinutes: Math.floor((Date.now() - result.startTime.getTime()) / 60000)
  }));
}

/**
 * Get daily summary for a child
 * "How much sleep today?"
 */
export async function getDailySummary(params: {
  childId: string;
  date?: Date;
}): Promise<DailySummary> {
  const { childId, date = new Date() } = params;
  
  // Get start and end of day in UTC
  const startOfDay = new Date(date);
  startOfDay.setUTCHours(0, 0, 0, 0);
  
  const endOfDay = new Date(date);
  endOfDay.setUTCHours(23, 59, 59, 999);
  
  // Get child name
  const childResults = await db
    .select({ name: children.name })
    .from(children)
    .where(eq(children.id, childId))
    .limit(1);
  
  if (childResults.length === 0) {
    throw new Error('Child not found');
  }
  
  const child = childResults[0];
  
  // Get all activities for the day
  const dayActivities = await db
    .select()
    .from(activities)
    .where(
      and(
        eq(activities.childId, childId),
        gte(activities.startTime, startOfDay),
        lte(activities.startTime, endOfDay)
      )
    );
  
  // Calculate summaries
  let totalSleep = 0;
  let sleepSessions = 0;
  let totalFeed = 0;
  let feedSessions = 0;
  let diaperChanges = 0;
  
  dayActivities.forEach(activity => {
    if (activity.type === 'sleep') {
      sleepSessions++;
      if (activity.endTime) {
        totalSleep += Math.floor((activity.endTime.getTime() - activity.startTime.getTime()) / 60000);
      }
    } else if (activity.type === 'feed') {
      feedSessions++;
      if (activity.endTime) {
        totalFeed += Math.floor((activity.endTime.getTime() - activity.startTime.getTime()) / 60000);
      }
    } else if (activity.type === 'diaper') {
      diaperChanges++;
    }
  });
  
  return {
    date: date.toISOString().split('T')[0],
    childId,
    childName: child.name,
    totalSleep,
    sleepSessions,
    totalFeed,
    feedSessions,
    diaperChanges
  };
}

/**
 * Get recent activities for a child
 * "When did baby last eat?"
 */
export async function getRecentActivities(params: {
  childId: string;
  type?: ActivityType;
  limit?: number;
  hoursBack?: number;
}): Promise<RecentActivity[]> {
  const { childId, type, limit = 10, hoursBack = 24 } = params;
  
  const cutoffTime = new Date();
  cutoffTime.setHours(cutoffTime.getHours() - hoursBack);
  
  const whereConditions = [
    eq(activities.childId, childId),
    gte(activities.startTime, cutoffTime)
  ];
  
  if (type) {
    whereConditions.push(eq(activities.type, type));
  }
  
  const query = db
    .select({
      id: activities.id,
      type: activities.type,
      childName: children.name,
      startTime: activities.startTime,
      endTime: activities.endTime,
      details: activities.details
    })
    .from(activities)
    .innerJoin(children, eq(activities.childId, children.id))
    .where(and(...whereConditions))
    .orderBy(desc(activities.startTime))
    .limit(limit);
  
  const results = await query;
  
  return results.map(result => ({
    id: result.id,
    type: result.type,
    childName: result.childName,
    startTime: result.startTime,
    endTime: result.endTime,
    details: result.details,
    ago: formatTimeAgo(result.startTime)
  }));
}

/**
 * Get the most recent activity of a specific type
 * "When did baby last eat?"
 */
export async function getLastActivity(params: {
  childId: string;
  type: ActivityType;
}): Promise<RecentActivity | null> {
  const { childId, type } = params;
  
  const [result] = await db
    .select({
      id: activities.id,
      type: activities.type,
      childName: children.name,
      startTime: activities.startTime,
      endTime: activities.endTime,
      details: activities.details
    })
    .from(activities)
    .innerJoin(children, eq(activities.childId, children.id))
    .where(
      and(
        eq(activities.childId, childId),
        eq(activities.type, type)
      )
    )
    .orderBy(desc(activities.startTime))
    .limit(1);
  
  if (!result) {
    return null;
  }
  
  return {
    id: result.id,
    type: result.type,
    childName: result.childName,
    startTime: result.startTime,
    endTime: result.endTime,
    details: result.details,
    ago: formatTimeAgo(result.startTime)
  };
}

/**
 * Get activity by ID with full details
 */
export async function getActivityById(activityId: string): Promise<ActivityWithChild | null> {
  const [result] = await db
    .select({
      activity: activities,
      child: children,
      createdByUser: users
    })
    .from(activities)
    .innerJoin(children, eq(activities.childId, children.id))
    .innerJoin(users, eq(activities.createdBy, users.id))
    .where(eq(activities.id, activityId))
    .limit(1);
  
  if (!result) {
    return null;
  }
  
  return {
    ...result.activity,
    child: result.child,
    createdByUser: result.createdByUser
  };
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Format time ago in human readable format
 */
function formatTimeAgo(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);
  
  if (diffMins < 1) {
    return 'just now';
  } else if (diffMins < 60) {
    return `${diffMins} minute${diffMins === 1 ? '' : 's'} ago`;
  } else if (diffHours < 24) {
    return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`;
  } else {
    return `${diffDays} day${diffDays === 1 ? '' : 's'} ago`;
  }
}

/**
 * Validate user has permission to access child
 */
export async function validateChildAccess(userId: string, childId: string): Promise<boolean> {
  const [relationship] = await db
    .select()
    .from(userChildren)
    .where(
      and(
        eq(userChildren.userId, userId),
        eq(userChildren.childId, childId)
      )
    )
    .limit(1);
  
  return !!relationship;
}