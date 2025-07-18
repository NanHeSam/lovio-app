import { db } from './index';
import { activities, children, users, userChildren, aiInteractions, invitations } from './schema';
import { eq, and, isNull, desc, gte, lte, inArray } from 'drizzle-orm';
import { formatTimeAgo } from '../utils/datetime';
import { buildLangsmithTraceUrl } from '../utils';
import type { 
  ActivityType, 
  ActivityDetails,
  ActiveSession,
  DailySummary,
  RecentActivity,
  ActivityWithChild,
  InvitationWithDetails,
  InvitationStatus,
  UserRole
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
  userId?: string;
  startTime?: Date;
  endTime?: Date;
  details?: ActivityDetails;
}) {
  const { activityId, userId, startTime, endTime, details } = params;
  
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
  
  // Check if user has access to this child (only if userId is provided)
  if (userId) {
    const hasAccess = await validateChildAccess(userId, currentActivity.childId);
    if (!hasAccess) {
      throw new Error('Access denied: You do not have permission to update this activity');
    }
  }
  
  // Allow editing endTime for completed activities
  // The original validation was too restrictive for editing use cases
  
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
 * Delete a single activity
 */
export async function deleteActivity(params: {
  activityId: string;
  userId: string;
}) {
  const { activityId, userId } = params;
  
  // First, verify the user has permission to delete this activity
  const activity = await db
    .select({
      id: activities.id,
      childId: activities.childId,
      createdBy: activities.createdBy,
    })
    .from(activities)
    .where(eq(activities.id, activityId))
    .limit(1);
  
  if (activity.length === 0) {
    throw new Error('Activity not found');
  }
  
  // Check if user has access to this child
  const hasAccess = await validateChildAccess(userId, activity[0].childId);
  if (!hasAccess) {
    throw new Error('Access denied: You do not have permission to delete this activity');
  }
  
  // Delete the activity
  const [deletedActivity] = await db
    .delete(activities)
    .where(eq(activities.id, activityId))
    .returning();
  
  return deletedActivity;
}

/**
 * Delete multiple activities
 */
export async function deleteActivities(params: {
  activityIds: string[];
  userId: string;
}) {
  const { activityIds, userId } = params;
  
  if (activityIds.length === 0) {
    return [];
  }
  
  // First, verify the user has permission to delete all these activities
  const activitiesData = await db
    .select({
      id: activities.id,
      childId: activities.childId,
      createdBy: activities.createdBy,
    })
    .from(activities)
    .where(inArray(activities.id, activityIds));
  
  if (activitiesData.length !== activityIds.length) {
    throw new Error('Some activities not found');
  }
  
  // Check if user has access to all child records
  const childIds = [...new Set(activitiesData.map(a => a.childId))];
  for (const childId of childIds) {
    const hasAccess = await validateChildAccess(userId, childId);
    if (!hasAccess) {
      throw new Error('Access denied: You do not have permission to delete some of these activities');
    }
  }
  
  // Delete all activities
  const deletedActivities = await db
    .delete(activities)
    .where(inArray(activities.id, activityIds))
    .returning();
  
  return deletedActivities;
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
    throw new Error('Sleep and feed activities should use startActivity/updateActivity');
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
      details: activities.details,
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
    durationMinutes: Math.floor((Date.now() - result.startTime.getTime()) / 60000),
    details: result.details
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
 * "When did baby last eat?" or "Show recent activities"
 * Can also be used to get the last activity of a specific type by setting limit=1
 */
export async function getRecentActivities(params: {
  childId: string;
  type?: ActivityType;
  limit?: number;
  hoursBack?: number;
}): Promise<RecentActivity[]> {
  const { childId, type, limit = 10, hoursBack } = params;
  
  const whereConditions = [eq(activities.childId, childId)];
  
  // Only add time filter if hoursBack is specified
  if (hoursBack !== undefined) {
    const cutoffTime = new Date();
    cutoffTime.setHours(cutoffTime.getHours() - hoursBack);
    whereConditions.push(gte(activities.startTime, cutoffTime));
  }
  
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
    ago: formatTimeAgo(Math.floor((Date.now() - result.startTime.getTime()) / 60000))
  }));
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

/**
 * Get dashboard data for a child (active sessions + last activities)
 */
export async function getDashboardData(userId: string, childId: string) {
  // Validate access
  const hasAccess = await validateChildAccess(userId, childId);
  if (!hasAccess) {
    throw new Error('Access denied: User does not have permission to view this child');
  }

  // Get active sessions
  const activeSessions = await getActiveSessions({ childId, userId });

  // Get last activity for each type (only if no active session)
  const hasActiveSleep = activeSessions.some(s => s.type === 'sleep');
  const hasActiveFeed = activeSessions.some(s => s.type === 'feed');

  const lastActivitiesPromises = [];
  
  if (!hasActiveSleep) {
    lastActivitiesPromises.push(
      getRecentActivities({ childId, type: 'sleep', limit: 1 }).then(res => ({ type: 'sleep', activity: res[0] }))
    );
  }
  
  if (!hasActiveFeed) {
    lastActivitiesPromises.push(
      getRecentActivities({ childId, type: 'feed', limit: 1 }).then(res => ({ type: 'feed', activity: res[0] }))
    );
  }
  
  // Always get last diaper (instant activity, no active sessions)
  lastActivitiesPromises.push(
    getRecentActivities({ childId, type: 'diaper', limit: 1 }).then(res => ({ type: 'diaper', activity: res[0] }))
  );

  const lastActivitiesResults = await Promise.all(lastActivitiesPromises);
  
  // Transform results
  const result: {
    activeSessions: ActiveSession[];
    lastSleep?: RecentActivity;
    lastFeed?: RecentActivity;
    lastDiaper?: RecentActivity;
  } = {
    activeSessions,
  };

  lastActivitiesResults.forEach(({ type, activity }) => {
    if (activity) {
      if (type === 'sleep') result.lastSleep = activity;
      else if (type === 'feed') result.lastFeed = activity;
      else if (type === 'diaper') result.lastDiaper = activity;
    }
  });

  return result;
}

// ============================================================================
// USER CHILD MANAGEMENT
// ============================================================================

/**
 * Get the first child for a user (for simple single-child scenarios)
 */
export async function getFirstChild(userId: string) {
  const userChild = await db
    .select({
      id: children.id,
      name: children.name,
      birthDate: children.birthDate,
      gender: children.gender,
      avatarUrl: children.avatarUrl,
    })
    .from(userChildren)
    .innerJoin(children, eq(userChildren.childId, children.id))
    .where(eq(userChildren.userId, userId))
    .limit(1);
    
  return userChild[0] || null;
}

// ============================================================================
// AI INTERACTION LOGGING
// ============================================================================

/**
 * Log an AI interaction for debugging and analytics
 */
export async function logAIInteraction(params: {
  userId: string;
  childId?: string;
  userInput: string;
  aiResponse?: string;
  activityId?: string;
  errorMessage?: string;
}) {
  const { userId, childId, userInput, aiResponse, activityId, errorMessage } = params;
  
  const [interaction] = await db.insert(aiInteractions).values({
    userId,
    childId: childId || null,
    userInput,
    aiResponse: aiResponse || null,
    activityId: activityId || null,
    errorMessage: errorMessage || null,
  }).returning();
  
  return interaction;
}

/**
 * Get AI interactions with activity correlation and LangSmith trace info
 */
export async function getAIInteractionsWithTraceInfo(params: {
  userId?: string;
  childId?: string;
  activityId?: string;
  limit?: number;
}) {
  const { userId, childId, activityId, limit = 50 } = params;
  
  const whereConditions = [];
  
  if (userId) {
    whereConditions.push(eq(aiInteractions.userId, userId));
  }
  
  if (childId) {
    whereConditions.push(eq(aiInteractions.childId, childId));
  }
  
  if (activityId) {
    whereConditions.push(eq(aiInteractions.activityId, activityId));
  }

  const interactions = await db
    .select({
      id: aiInteractions.id,
      userId: aiInteractions.userId,
      childId: aiInteractions.childId,
      userInput: aiInteractions.userInput,
      aiResponse: aiInteractions.aiResponse,
      functionCalls: aiInteractions.functionCalls,
      activityId: aiInteractions.activityId,
      errorMessage: aiInteractions.errorMessage,
      createdAt: aiInteractions.createdAt,
      // Activity details if linked
      activityType: activities.type,
      activityStartTime: activities.startTime,
      activityEndTime: activities.endTime,
      activityDetails: activities.details,
    })
    .from(aiInteractions)
    .leftJoin(activities, eq(aiInteractions.activityId, activities.id))
    .where(whereConditions.length > 0 ? and(...whereConditions) : undefined)
    .orderBy(desc(aiInteractions.createdAt))
    .limit(limit);

  // Add LangSmith trace correlation info
  return interactions.map(interaction => ({
    ...interaction,
    langsmithTraceId: interaction.id, // AI interaction ID = LangSmith run ID
    langsmithTraceUrl: buildLangsmithTraceUrl(interaction.id),
  }));
}

// ============================================================================
// INVITATION MANAGEMENT
// ============================================================================

/**
 * Generate a secure invitation token
 */
function generateInvitationToken(): string {
  return require('crypto').randomBytes(32).toString('hex');
}

/**
 * Create a new invitation
 */
export async function createInvitation(params: {
  inviterUserId: string;
  childId: string;
  inviteeEmail: string;
  inviteeRole: UserRole;
  personalMessage?: string;
  expiresInDays?: number;
}): Promise<InvitationWithDetails> {
  const { 
    inviterUserId, 
    childId, 
    inviteeEmail, 
    inviteeRole, 
    personalMessage, 
    expiresInDays = 7 
  } = params;

  // Check if user has permission to invite for this child
  const hasAccess = await validateChildAccess(inviterUserId, childId);
  if (!hasAccess) {
    throw new Error('Access denied: You do not have permission to invite users for this child');
  }

  // Check if there's already a pending invitation for this email/child combination
  const existingInvitation = await db
    .select()
    .from(invitations)
    .where(
      and(
        eq(invitations.childId, childId),
        eq(invitations.inviteeEmail, inviteeEmail.toLowerCase()),
        eq(invitations.status, 'pending')
      )
    )
    .limit(1);

  if (existingInvitation.length > 0) {
    throw new Error('There is already a pending invitation for this email address');
  }

  // Check if user already has access to this child
  const existingUser = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, inviteeEmail.toLowerCase()))
    .limit(1);

  if (existingUser.length > 0) {
    const existingAccess = await validateChildAccess(existingUser[0].id, childId);
    if (existingAccess) {
      throw new Error('This user already has access to this child');
    }
  }

  // Calculate expiration date
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + expiresInDays);

  // Create the invitation
  const [invitation] = await db
    .insert(invitations)
    .values({
      token: generateInvitationToken(),
      inviterUserId,
      childId,
      inviteeEmail: inviteeEmail.toLowerCase(),
      inviteeRole,
      personalMessage,
      expiresAt,
    })
    .returning();

  // Return invitation with details
  return getInvitationWithDetails(invitation.id);
}

/**
 * Get invitation with full details
 */
export async function getInvitationWithDetails(invitationId: string): Promise<InvitationWithDetails> {
  // First get the invitation with inviter and child details
  const [result] = await db
    .select({
      invitation: invitations,
      inviter: users,
      child: children,
    })
    .from(invitations)
    .innerJoin(users, eq(invitations.inviterUserId, users.id))
    .innerJoin(children, eq(invitations.childId, children.id))
    .where(eq(invitations.id, invitationId))
    .limit(1);

  if (!result) {
    throw new Error('Invitation not found');
  }

  // Get accepter details separately if accepted
  let accepter: any = undefined;
  if (result.invitation.acceptedBy) {
    const [accepterResult] = await db
      .select({
        id: users.id,
        fullName: users.fullName,
        email: users.email,
        avatarUrl: users.avatarUrl,
      })
      .from(users)
      .where(eq(users.id, result.invitation.acceptedBy))
      .limit(1);
    
    accepter = accepterResult;
  }

  return {
    ...result.invitation,
    inviter: result.inviter,
    child: result.child,
    accepter,
  };
}

/**
 * Get invitation by token
 */
export async function getInvitationByToken(token: string): Promise<InvitationWithDetails | null> {
  const [result] = await db
    .select({
      invitation: invitations,
      inviter: users,
      child: children,
    })
    .from(invitations)
    .innerJoin(users, eq(invitations.inviterUserId, users.id))
    .innerJoin(children, eq(invitations.childId, children.id))
    .where(eq(invitations.token, token))
    .limit(1);

  if (!result) {
    return null;
  }

  return {
    ...result.invitation,
    inviter: result.inviter,
    child: result.child,
  };
}

/**
 * Accept an invitation
 */
export async function acceptInvitation(params: {
  token: string;
  acceptingUserId: string;
  userEmail?: string; // Optional user email from Clerk
}): Promise<{ success: boolean; message: string }> {
  const { token, acceptingUserId, userEmail } = params;

  // Get the invitation
  const invitation = await getInvitationByToken(token);
  if (!invitation) {
    return { success: false, message: 'Invalid invitation token' };
  }

  // Check if invitation is still valid
  if (invitation.status !== 'pending') {
    return { success: false, message: 'This invitation has already been processed' };
  }

  if (new Date() > invitation.expiresAt) {
    // Mark as expired
    await db
      .update(invitations)
      .set({ status: 'expired' })
      .where(eq(invitations.id, invitation.id));
    
    return { success: false, message: 'This invitation has expired' };
  }

  // Get the accepting user's email from database or use provided email
  const [acceptingUser] = await db
    .select({ email: users.email })
    .from(users)
    .where(eq(users.id, acceptingUserId))
    .limit(1);

  let acceptingUserEmail = acceptingUser?.email;

  // If no email in database but email provided (from Clerk), update the database
  if (!acceptingUserEmail && userEmail) {
    try {
      await db
        .update(users)
        .set({ email: userEmail.toLowerCase() })
        .where(eq(users.id, acceptingUserId));
      
      acceptingUserEmail = userEmail.toLowerCase();
    } catch (error) {
      console.error('Error updating user email:', error);
    }
  }

  if (!acceptingUserEmail) {
    return { success: false, message: 'User email not found. Please ensure your account is properly set up.' };
  }

  // Check if the email matches the invitation
  if (acceptingUserEmail.toLowerCase() !== invitation.inviteeEmail.toLowerCase()) {
    return { success: false, message: 'This invitation was sent to a different email address' };
  }

  // Check if user already has access
  const existingAccess = await validateChildAccess(acceptingUserId, invitation.childId);
  if (existingAccess) {
    // Mark invitation as accepted anyway
    await db
      .update(invitations)
      .set({ 
        status: 'accepted',
        acceptedBy: acceptingUserId,
        acceptedAt: new Date()
      })
      .where(eq(invitations.id, invitation.id));
    
    return { success: true, message: 'You already have access to this child' };
  }

  // Create user-child relationship
  await db
    .insert(userChildren)
    .values({
      userId: acceptingUserId,
      childId: invitation.childId,
      role: invitation.inviteeRole,
      permissions: { read: true, write: true, admin: false },
    });

  // Mark invitation as accepted
  await db
    .update(invitations)
    .set({ 
      status: 'accepted',
      acceptedBy: acceptingUserId,
      acceptedAt: new Date()
    })
    .where(eq(invitations.id, invitation.id));

  return { success: true, message: 'Invitation accepted successfully!' };
}

/**
 * Get invitations for a user (sent or received)
 */
export async function getUserInvitations(params: {
  userId: string;
  type?: 'sent' | 'received';
  status?: InvitationStatus;
}): Promise<InvitationWithDetails[]> {
  const { userId, type, status } = params;

  const whereConditions = [];
  
  if (type === 'sent') {
    whereConditions.push(eq(invitations.inviterUserId, userId));
  } else if (type === 'received') {
    // Get user's email for received invitations
    const [user] = await db
      .select({ email: users.email })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);
    
    if (!user?.email) {
      return [];
    }
    
    whereConditions.push(eq(invitations.inviteeEmail, user.email.toLowerCase()));
  }
  
  if (status) {
    whereConditions.push(eq(invitations.status, status));
  }

  const results = await db
    .select({
      invitation: invitations,
      inviter: users,
      child: children,
    })
    .from(invitations)
    .innerJoin(users, eq(invitations.inviterUserId, users.id))
    .innerJoin(children, eq(invitations.childId, children.id))
    .where(whereConditions.length > 0 ? and(...whereConditions) : undefined)
    .orderBy(desc(invitations.createdAt));

  return results.map(result => ({
    ...result.invitation,
    inviter: result.inviter,
    child: result.child,
  }));
}

/**
 * Cancel/revoke an invitation
 */
export async function cancelInvitation(params: {
  invitationId: string;
  userId: string;
}): Promise<{ success: boolean; message: string }> {
  const { invitationId, userId } = params;

  // Check if user has permission to cancel this invitation
  const [invitation] = await db
    .select({
      inviterUserId: invitations.inviterUserId,
      childId: invitations.childId,
      status: invitations.status,
    })
    .from(invitations)
    .where(eq(invitations.id, invitationId))
    .limit(1);

  if (!invitation) {
    return { success: false, message: 'Invitation not found' };
  }

  if (invitation.inviterUserId !== userId) {
    const hasAccess = await validateChildAccess(userId, invitation.childId);
    if (!hasAccess) {
      return { success: false, message: 'Access denied: You cannot cancel this invitation' };
    }
  }

  if (invitation.status !== 'pending') {
    return { success: false, message: 'Only pending invitations can be cancelled' };
  }

  // Mark invitation as rejected (cancelled)
  await db
    .update(invitations)
    .set({ status: 'rejected' })
    .where(eq(invitations.id, invitationId));

  return { success: true, message: 'Invitation cancelled successfully' };
}

/**
 * Clean up expired invitations
 */
export async function cleanupExpiredInvitations(): Promise<number> {
  const now = new Date();
  
  const updatedInvitations = await db
    .update(invitations)
    .set({ status: 'expired' })
    .where(
      and(
        eq(invitations.status, 'pending'),
        lte(invitations.expiresAt, now)
      )
    )
    .returning({ id: invitations.id });

  return updatedInvitations.length;
}

/**
 * Reject an invitation
 */
export async function rejectInvitation(params: {
  token: string;
  rejectingUserId?: string;
}): Promise<{ success: boolean; message: string }> {
  const { token, rejectingUserId } = params;

  // Find the invitation
  const [invitation] = await db
    .select()
    .from(invitations)
    .where(eq(invitations.token, token))
    .limit(1);

  if (!invitation) {
    return { success: false, message: 'Invalid invitation token' };
  }

  // Check if invitation is still pending
  if (invitation.status !== 'pending') {
    return { success: false, message: 'This invitation has already been processed' };
  }

  // Check if invitation is expired
  if (new Date() > invitation.expiresAt) {
    // Mark as expired
    await db
      .update(invitations)
      .set({ status: 'expired' })
      .where(eq(invitations.id, invitation.id));
    
    return { success: false, message: 'This invitation has expired' };
  }

  // If rejectingUserId is provided, verify they have permission to reject
  if (rejectingUserId) {
    // Get user's email to verify they are the intended recipient
    const [user] = await db
      .select({ email: users.email })
      .from(users)
      .where(eq(users.id, rejectingUserId))
      .limit(1);

    if (!user?.email) {
      return { success: false, message: 'User not found' };
    }

    // Check if the user's email matches the invitation
    if (user.email.toLowerCase() !== invitation.inviteeEmail.toLowerCase()) {
      return { success: false, message: 'You are not authorized to reject this invitation' };
    }
  }

  // Mark invitation as rejected
  await db
    .update(invitations)
    .set({ 
      status: 'rejected',
      acceptedBy: rejectingUserId || null,
      acceptedAt: new Date()
    })
    .where(eq(invitations.id, invitation.id));

  return { success: true, message: 'Invitation declined successfully' };
}