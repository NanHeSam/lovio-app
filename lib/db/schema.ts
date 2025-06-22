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
} from 'drizzle-orm/pg-core';
import type { UserPreferences, ChildMetadata, UserRole, Gender, ActivityType, ActivityDetails } from './types';

// ============================================================================
// CORE TABLES (User Management)
// ============================================================================

export const users = pgTable('users', {
  id: uuid('id').primaryKey(), // External auth service user ID - no default generation
  fullName: varchar('full_name', { length: 255 }).notNull(),
  timezone: varchar('timezone', { length: 50 }),
  avatarUrl: text('avatar_url'),
  preferences: jsonb('preferences').$type<UserPreferences>().default(sql`'{}'::jsonb`),
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
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
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
}));

export const childrenRelations = relations(children, ({ many }) => ({
  userChildren: many(userChildren),
  activities: many(activities),
  aiInteractions: many(aiInteractions),
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
  createdBy: uuid('created_by').notNull().references(() => users.id, { onDelete: 'cascade' }),
  
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
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  childId: uuid('child_id').references(() => children.id, { onDelete: 'cascade' }),
  
  userInput: text('user_input').notNull(),
  aiResponse: text('ai_response'),
  activityId: uuid('activity_id').references(() => activities.id, { onDelete: 'cascade' }),
  errorMessage: text('error_message'),
  
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

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

