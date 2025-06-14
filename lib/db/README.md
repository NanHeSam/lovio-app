# Database Schema Documentation

This directory contains the database schema and utilities for the Lovio app, built with Drizzle ORM and PostgreSQL.

## Schema Overview

The database consists of three core tables for user and child management:

### Tables

#### `users`
Stores user account information and preferences.

- `id` (UUID, Primary Key) - Unique user identifier
- `email` (VARCHAR, Unique) - User's email address
- `full_name` (VARCHAR) - User's full name
- `timezone` (VARCHAR) - User's timezone (default: 'UTC')
- `avatar_url` (TEXT) - URL to user's avatar image
- `preferences` (JSONB) - User preferences and settings
- `created_at` (TIMESTAMPTZ) - Account creation timestamp
- `updated_at` (TIMESTAMPTZ) - Last update timestamp
- `last_active_at` (TIMESTAMPTZ) - Last activity timestamp

#### `children`
Stores child information and metadata.

- `id` (UUID, Primary Key) - Unique child identifier
- `name` (VARCHAR) - Child's name
- `birth_date` (DATE) - Child's birth date
- `gender` (VARCHAR) - Child's gender ('male', 'female', 'other', or null)
- `avatar_url` (TEXT) - URL to child's avatar image
- `metadata` (JSONB) - Growth tracking, medical info, milestones
- `created_at` (TIMESTAMPTZ) - Record creation timestamp
- `updated_at` (TIMESTAMPTZ) - Last update timestamp
- `age_days` (INTEGER, Computed) - Child's age in days (auto-calculated)

#### `user_children`
Junction table linking users to children with roles and permissions.

- `id` (UUID, Primary Key) - Unique relationship identifier
- `user_id` (UUID, Foreign Key) - References users.id
- `child_id` (UUID, Foreign Key) - References children.id
- `role` (VARCHAR) - User's role ('parent', 'guardian', 'caregiver', 'family')
- `permissions` (JSONB) - User's permissions for this child
- `created_at` (TIMESTAMPTZ) - Relationship creation timestamp
- Unique constraint on (user_id, child_id)

## File Structure

```
lib/db/
├── index.ts          # Database connection and exports
├── schema.ts         # Drizzle schema definitions
├── types.ts          # TypeScript type definitions
├── queries.ts        # Common database queries
└── README.md         # This documentation
```

## Usage Examples

### Creating a User

```typescript
import { createUser } from '@/lib/db/queries';

const newUser = await createUser({
  email: 'parent@example.com',
  fullName: 'John Doe',
  timezone: 'America/New_York',
  preferences: {
    theme: 'light',
    notifications: {
      email: true,
      push: true
    }
  }
});
```

### Creating a Child

```typescript
import { createChild } from '@/lib/db/queries';

const newChild = await createChild({
  name: 'Emma Doe',
  birthDate: new Date('2020-06-15'),
  gender: 'female',
  metadata: {
    medical: {
      allergies: ['peanuts'],
      doctor: {
        name: 'Dr. Smith',
        phone: '555-0123'
      }
    }
  }
});
```

### Linking User to Child

```typescript
import { linkUserToChild } from '@/lib/db/queries';

const relationship = await linkUserToChild({
  userId: user.id,
  childId: child.id,
  role: 'parent',
  permissions: {
    read: true,
    write: true,
    admin: true
  }
});
```

### Getting User with Children

```typescript
import { getUserWithChildren } from '@/lib/db/queries';

const userWithChildren = await getUserWithChildren(userId);
console.log(userWithChildren?.userChildren);
```

## Database Commands

```bash
# Generate migration files
npm run db:generate

# Run migrations
npm run db:migrate

# Push schema changes directly (development)
npm run db:push

# Open Drizzle Studio
npm run db:studio

# Test database connection
npm run db:test
```

## Environment Variables

Make sure to set the following environment variable in your `.env.local` file:

```
DATABASE_URL=postgresql://username:password@localhost:5432/lovio_db
```

## Migration Notes

1. **Initial Migration** (`0000_create_user_management_tables.sql`):
   - Creates users, children, and user_children tables
   - Includes proper foreign key relationships
   - Adds unique constraint on user_children (user_id, child_id)
   - Sets up cascade deletions for data integrity


## Type Safety

The schema provides full TypeScript type safety through:

- `InferSelectModel` for read operations
- `InferInsertModel` for create operations
- Custom types for complex JSONB fields
- Enum types for constrained values

## Relations

The schema defines proper relations for:

- Users → UserChildren (one-to-many)
- Children → UserChildren (one-to-many)
- UserChildren → Users (many-to-one)
- UserChildren → Children (many-to-one)

This enables efficient querying with joins and nested data fetching.