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
  integer,
  decimal,
  boolean,
  check,
} from 'drizzle-orm/pg-core';

// ============================================================================
// CORE TABLES (User Management)
// ============================================================================

export const users = pgTable('users', {
  id: uuid('id').primaryKey(), // External auth service user ID - no default generation
  fullName: varchar('full_name', { length: 255 }).notNull(),
  timezone: varchar('timezone', { length: 50 }).notNull().default('UTC'),
  avatarUrl: text('avatar_url'),
  preferences: jsonb('preferences').default(sql`'{}'::jsonb`),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  lastActiveAt: timestamp('last_active_at', { withTimezone: true }).defaultNow().notNull(),
});

export const children = pgTable('children', {
  id: uuid('id').primaryKey().default(sql`uuid_generate_v4()`),
  name: varchar('name', { length: 255 }).notNull(),
  birthDate: date('birth_date').notNull(),
  gender: varchar('gender', { length: 20 }), // 'male', 'female', 'other', null
  avatarUrl: text('avatar_url'),
  metadata: jsonb('metadata').default(sql`'{}'::jsonb`), // Growth tracking, medical info
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  // Note: age_days computed field will be handled in PostgreSQL as a generated column
});

export const userChildren = pgTable('user_children', {
  id: uuid('id').primaryKey().default(sql`uuid_generate_v4()`),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  childId: uuid('child_id').notNull().references(() => children.id, { onDelete: 'cascade' }),
  role: varchar('role', { length: 20 }).notNull().default('parent'),
  permissions: jsonb('permissions').default(sql`'{"read": true, "write": true, "admin": false}'::jsonb`),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  // Unique constraint to prevent duplicate user-child relationships
  uniqueUserChild: unique('unique_user_child').on(table.userId, table.childId),
}));

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
  type: varchar('type', { length: 50 }).notNull(),
  
  // Temporal Data (ALL IN UTC)
  startTime: timestamp('start_time', { withTimezone: true }).notNull(),
  endTime: timestamp('end_time', { withTimezone: true }),
  
  // Session Management
  sessionId: uuid('session_id'),
  
  // Note: Computed columns will be added in a separate migration
  // durationMinutes and isOngoing will be calculated at application level initially
  
  // Activity Details (JSON with Schema Validation)
  details: jsonb('details').default(sql`'{}'::jsonb`),
  
  // AI Integration
  aiConfidence: decimal('ai_confidence', { precision: 3, scale: 2 }),
  originalInput: text('original_input'),
  
  // Timestamps
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  // Data Integrity Constraints
  validTimes: check('valid_times', sql`end_time IS NULL OR end_time >= start_time`),
  validConfidence: check('valid_confidence', sql`ai_confidence IS NULL OR (ai_confidence >= 0 AND ai_confidence <= 1)`),
  validType: check('valid_type', sql`type IN ('sleep', 'feed', 'diaper')`),
  
  // Session Logic: ongoing activities must have session_id
  sessionLogic: check('session_logic', sql`
    (end_time IS NULL AND session_id IS NOT NULL) OR
    (end_time IS NOT NULL) OR
    (session_id IS NULL)
  `),
}));

export const activityTypeSchemas = pgTable('activity_type_schemas', {
  id: uuid('id').primaryKey().default(sql`uuid_generate_v4()`),
  activityType: varchar('activity_type', { length: 50 }).notNull().unique(),
  displayName: varchar('display_name', { length: 100 }).notNull(),
  description: text('description').notNull(),
  isSessionBased: boolean('is_session_based').notNull(),
  
  // JSON Schema for the details field
  detailsSchema: jsonb('details_schema').notNull(),
  
  // Common fields that apply to this activity type
  commonFields: jsonb('common_fields').notNull(),
  
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  validActivityType: check('valid_activity_type', sql`activity_type IN ('sleep', 'feed', 'diaper')`),
}));

export const mcpTools = pgTable('mcp_tools', {
  id: uuid('id').primaryKey().default(sql`uuid_generate_v4()`),
  toolName: varchar('tool_name', { length: 100 }).notNull().unique(),
  toolDescription: text('tool_description').notNull(),
  category: varchar('category', { length: 50 }).notNull(),
  
  // JSON Schema for tool input/output (MCP compatibility)
  inputSchema: jsonb('input_schema').notNull(),
  outputSchema: jsonb('output_schema').notNull(),
  
  // Usage tracking
  usageFrequency: varchar('usage_frequency', { length: 20 }).default('common'),
  
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export const aiInteractions = pgTable('ai_interactions', {
  id: uuid('id').primaryKey().default(sql`uuid_generate_v4()`),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  childId: uuid('child_id').references(() => children.id, { onDelete: 'cascade' }),
  
  // MCP-Specific Fields
  mcpToolName: varchar('mcp_tool_name', { length: 100 }),
  
  // Input/Output
  userInput: text('user_input').notNull(),
  aiInterpretation: jsonb('ai_interpretation').notNull(),
  modelUsed: varchar('model_used', { length: 100 }).notNull(),
  
  // Results
  success: boolean('success').notNull().default(false),
  activityIds: jsonb('activity_ids').default(sql`'[]'::jsonb`), // Array of UUIDs stored as JSON
  errorMessage: text('error_message'),
  
  // Performance
  processingTimeMs: integer('processing_time_ms'),
  tokenCount: integer('token_count'),
  
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

