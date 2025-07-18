import { relations } from 'drizzle-orm';
import { sql } from 'drizzle-orm';
import {
  pgTable,
  uuid,
  varchar,
  text,
  jsonb,
  timestamp,
  date,
  unique,
  check,
  boolean,
} from 'drizzle-orm/pg-core';
import type { UserPreferences, ChildMetadata, UserRole, Gender, ActivityType, ActivityDetails } from './types';

// ============================================================================
// CORE TABLES (User Management)
// ============================================================================

export const users = pgTable('users', {
  id: text('id').primaryKey(), // External auth service user ID (Clerk format)
  fullName: varchar('full_name', { length: 255 }).notNull(),
  email: varchar('email', { length: 255 }).unique(), // User's email address
  timezone: varchar('timezone', { length: 50 }),
  avatarUrl: text('avatar_url'),
  preferences: jsonb('preferences').$type<UserPreferences>().default(sql`'{}'::jsonb`),
  
  // API Key fields
  apiKey: varchar('api_key', { length: 64 }).unique(),
  apiKeyCreatedAt: timestamp('api_key_created_at', { withTimezone: true }),
  apiKeyLastUsedAt: timestamp('api_key_last_used_at', { withTimezone: true }),
  apiKeyActive: boolean('api_key_active').default(true),
  
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  lastActiveAt: timestamp('last_active_at', { withTimezone: true }).defaultNow().notNull(),
});

export const children = pgTable('children', {
  id: uuid('id').primaryKey().default(sql`uuid_generate_v4()`),
  name: varchar('name', { length: 255 }).notNull(),
  birthDate: date('birth_date').notNull(),
  gender: varchar('gender', { length: 20 }).$type<Gender>(),
  avatarUrl: text('avatar_url'),
  metadata: jsonb('metadata').$type<ChildMetadata>().default(sql`'{}'::jsonb`), // Growth tracking
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
},
() => [
  check('gender', sql`gender IN ('male', 'female')`),
]);

export const userChildren = pgTable('user_children', {
  id: uuid('id').primaryKey().default(sql`uuid_generate_v4()`),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  childId: uuid('child_id').notNull().references(() => children.id, { onDelete: 'cascade' }),
  role: varchar('role', { length: 20 }).$type<UserRole>(),
  permissions: jsonb('permissions').default(sql`'{"read": true, "write": true, "admin": false}'::jsonb`),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, 
(table) => [unique('unique_user_child').on(table.userId, table.childId)],
);

// ============================================================================
// RELATIONS
// ============================================================================

export const usersRelations = relations(users, ({ many }) => ({
  userChildren: many(userChildren),
  createdActivities: many(activities),
  aiInteractions: many(aiInteractions),
  sentInvitations: many(invitations, { relationName: 'inviter' }),
  acceptedInvitations: many(invitations, { relationName: 'accepter' }),
}));

export const childrenRelations = relations(children, ({ many }) => ({
  userChildren: many(userChildren),
  activities: many(activities),
  aiInteractions: many(aiInteractions),
  invitations: many(invitations),
}));

export const userChildrenRelations = relations(userChildren, ({ one }) => ({
  user: one(users, {
    fields: [userChildren.userId],
    references: [users.id],
  }),
  child: one(children, {
    fields: [userChildren.childId],
    references: [children.id],
  }),
}));

// ============================================================================
// ACTIVITIES SYSTEM (MCP-Optimized Hybrid Approach)
// ============================================================================

export const activities = pgTable('activities', {
  id: uuid('id').primaryKey().default(sql`uuid_generate_v4()`),
  childId: uuid('child_id').notNull().references(() => children.id, { onDelete: 'cascade' }),
  createdBy: text('created_by').notNull().references(() => users.id, { onDelete: 'cascade' }),
  
  // Activity Classification (Core Fields - Always Required)
  type: varchar('type', { length: 50 }).$type<ActivityType>().notNull(),
  
  // Temporal Data (ALL IN UTC)
  startTime: timestamp('start_time', { withTimezone: true }).notNull(),
  endTime: timestamp('end_time', { withTimezone: true }),
  
  // Activity Details (JSON with Schema Validation)
  details: jsonb('details').$type<ActivityDetails>().default(sql`'{}'::jsonb`),
  
  // Timestamps
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, () => [
  check('valid_times', sql`end_time IS NULL OR end_time >= start_time`),
  check('valid_type', sql`type IN ('sleep', 'feed', 'diaper')`),
]);

export const aiInteractions = pgTable('ai_interactions', {
  id: uuid('id').primaryKey().default(sql`uuid_generate_v4()`),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  childId: uuid('child_id').references(() => children.id, { onDelete: 'cascade' }),
  
  userInput: text('user_input').notNull(),
  aiResponse: text('ai_response'),
  functionCalls: jsonb('function_calls'), // Store function calls as JSONB array
  activityId: uuid('activity_id').references(() => activities.id, { onDelete: 'cascade' }),
  errorMessage: text('error_message'),
  
  // Feedback fields for improving AI performance
  userFeedback: varchar('user_feedback', { length: 20 }).default('none'), // 'thumbs_up', 'thumbs_down', 'none'
  feedbackNote: text('feedback_note'), // Optional note from user
  langsmithTraceId: text('langsmith_trace_id'), // Link to LangSmith trace
  
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, () => [
  check('valid_user_feedback', sql`user_feedback IN ('thumbs_up', 'thumbs_down', 'none')`),
]);

export const invitations = pgTable('invitations', {
  id: uuid('id').primaryKey().default(sql`uuid_generate_v4()`),
  token: varchar('token', { length: 64 }).unique().notNull(), // Secure invitation token
  inviterUserId: text('inviter_user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  childId: uuid('child_id').notNull().references(() => children.id, { onDelete: 'cascade' }),
  
  // Invitation details
  inviteeEmail: varchar('invitee_email', { length: 255 }).notNull(),
  inviteeRole: varchar('invitee_role', { length: 20 }).notNull(), // 'parent', 'guardian', 'caregiver'
  personalMessage: text('personal_message'), // Optional personal message
  
  // Status tracking
  status: varchar('status', { length: 20 }).default('pending').notNull(), // 'pending', 'accepted', 'rejected', 'expired'
  acceptedBy: text('accepted_by').references(() => users.id, { onDelete: 'set null' }), // User who accepted
  
  // Timestamps
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  acceptedAt: timestamp('accepted_at', { withTimezone: true }),
  
}, () => [
  check('valid_invitation_status', sql`status IN ('pending', 'accepted', 'rejected', 'expired')`),
  check('valid_invitee_role', sql`invitee_role IN ('parent', 'guardian', 'caregiver')`),
]);

// ============================================================================
// ACTIVITIES RELATIONS
// ============================================================================

export const activitiesRelations = relations(activities, ({ one }) => ({
  child: one(children, {
    fields: [activities.childId],
    references: [children.id],
  }),
  createdByUser: one(users, {
    fields: [activities.createdBy],
    references: [users.id],
  }),
}));

export const aiInteractionsRelations = relations(aiInteractions, ({ one }) => ({
  user: one(users, {
    fields: [aiInteractions.userId],
    references: [users.id],
  }),
  child: one(children, {
    fields: [aiInteractions.childId],
    references: [children.id],
  }),
}));

export const invitationsRelations = relations(invitations, ({ one }) => ({
  inviter: one(users, {
    fields: [invitations.inviterUserId],
    references: [users.id],
    relationName: 'inviter'
  }),
  accepter: one(users, {
    fields: [invitations.acceptedBy],
    references: [users.id],
    relationName: 'accepter'
  }),
  child: one(children, {
    fields: [invitations.childId],
    references: [children.id],
  }),
}));

