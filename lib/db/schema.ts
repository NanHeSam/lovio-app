import { pgTable, uuid, varchar, text, jsonb, timestamp, date, integer, boolean, unique } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { sql } from 'drizzle-orm';

// ============================================================================
// CORE TABLES (User Management)
// ============================================================================

export const users = pgTable('users', {
  id: uuid('id').primaryKey().default(sql`uuid_generate_v4()`),
  email: varchar('email', { length: 255 }).notNull().unique(),
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
}));

export const childrenRelations = relations(children, ({ many }) => ({
  userChildren: many(userChildren),
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

