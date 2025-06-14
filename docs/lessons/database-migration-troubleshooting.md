# Database Migration Troubleshooting - Lessons Learned

## Overview

This document captures the lessons learned from troubleshooting database migration issues during the initial setup of the Lovio app's PostgreSQL database with Drizzle ORM.

## Problem Summary

During the initial database migration setup, we encountered several issues that prevented successful migration execution:

1. **UUID Extension Placement**: The `uuid-ossp` extension was created in a separate migration file instead of the first migration
2. **Computed Column Syntax**: PostgreSQL syntax errors with computed column definitions
3. **Migration File Management**: Manual creation of migration files led to inconsistencies

## Issues Encountered

### 1. UUID Extension Not Found (Error 3F000)

**Problem**: 
```
PostgreSQL error 3F000: extension "uuid-ossp" does not exist
```

**Root Cause**: 
The `CREATE EXTENSION IF NOT EXISTS "uuid-ossp";` statement was placed in a second migration file (`0001_add_uuid_extension_and_computed_columns.sql`) instead of the first migration where UUID columns were being created.

**Solution**: 
- Moved the extension creation to the beginning of the first migration file (`0000_create_user_management_tables.sql`)
- Ensured the extension is available before any UUID columns are defined

**Lesson**: 
- **Always enable required extensions in the first migration**
- Extensions should be created before any dependent schema objects

### 2. Computed Column Syntax Errors (Error 42883, 42P17)

**Problem**: 
```sql
-- This failed with PostgreSQL error 42883
ALTER TABLE children ADD COLUMN age_days INTEGER GENERATED ALWAYS AS (EXTRACT(DAY FROM (CURRENT_DATE - birth_date))) STORED;

-- This failed with PostgreSQL error 42P17
ALTER TABLE children ADD COLUMN age_days INTEGER GENERATED ALWAYS AS (CURRENT_DATE - birth_date) STORED;
```

**Root Cause**: 
- The `EXTRACT(DAY FROM ...)` function doesn't work with integer results from date subtraction
- PostgreSQL has specific syntax requirements for computed columns
- Complex computed column logic may not be suitable for database-level implementation

**Solution**: 
- Temporarily commented out the computed column definition
- Decided to implement age calculations at the application level instead
- Removed the problematic migration file entirely

**Lesson**: 
- **Test computed column syntax separately** before including in migrations
- **Consider application-level calculations** for complex logic
- **Use database computed columns sparingly** for simple, well-tested expressions

### 3. Migration File Management Issues

**Problem**: 
- Manual creation of migration files led to unused files with only commented code
- Migration journal became inconsistent with actual schema needs

**Solution**: 
- Deleted the unused second migration file
- Updated the Drizzle journal (`_journal.json`) to reflect the single migration
- Established clear rules for migration file creation

**Lesson**: 
- **Never create migration files manually** - always use Drizzle commands
- **Clean up unused migration files** to maintain a clear migration history
- **Keep the migration journal in sync** with actual migration files

## Best Practices Established

### 1. Migration Naming Convention
```bash
# Good examples
npm run db:generate -- --name create_user_management_tables
npm run db:generate -- --name add_user_preferences
npm run db:generate -- --name create_notification_system

# Bad examples
npm run db:generate -- --name update
npm run db:generate -- --name fix
npm run db:generate -- --name migration
```

### 2. Migration Development Workflow

1. **Generate migration with descriptive name**:
   ```bash
   npm run db:generate -- --name feature_description
   ```

2. **Review generated SQL**:
   - Check syntax and logic
   - Verify foreign key constraints
   - Test complex expressions separately

3. **Apply migration**:
   ```bash
   npm run db:migrate
   npm run db:test  # Verify connection
   ```

4. **Use development tools**:
   ```bash
   npm run db:studio  # Visual database explorer
   ```

### 3. Schema Design Guidelines

- **Extensions first**: Enable required extensions in the first migration
- **Simple computed columns**: Use only for basic, well-tested expressions
- **Proper constraints**: Include CASCADE behavior for foreign keys
- **Audit fields**: Add `created_at` and `updated_at` to all tables
- **UUID primary keys**: Use `uuid_generate_v4()` as default

## Troubleshooting Checklist

When migration fails:

1. **Check PostgreSQL error code**:
   - `3F000`: Extension not found
   - `42883`: Function does not exist
   - `42P17`: Invalid default value
   - `42703`: Column does not exist

2. **Verify extension availability**:
   ```sql
   SELECT * FROM pg_extension WHERE extname = 'uuid-ossp';
   ```

3. **Test complex SQL separately**:
   ```bash
   # Connect to database and test syntax
   psql -h localhost -U postgres -d lovio_dev
   ```

4. **Check migration order**:
   - Ensure dependencies are created before dependents
   - Verify extension creation comes first

5. **Review migration journal**:
   ```json
   // drizzle/meta/_journal.json
   {
     "version": "7",
     "dialect": "postgresql",
     "entries": [
       {
         "idx": 0,
         "version": "7",
         "when": 1234567890,
         "tag": "0000_create_user_management_tables",
         "breakpoints": true
       }
     ]
   }
   ```

## Tools and Commands Reference

### Database Management
```bash
# Generate new migration
npm run db:generate -- --name feature_name

# Apply migrations
npm run db:migrate

# Push schema changes (development only)
npm run db:push

# Test database connection
npm run db:test

# Open Drizzle Studio
npm run db:studio
```

### Docker Database Management
```bash
# Start PostgreSQL container
docker-compose up -d

# Stop PostgreSQL container
docker-compose down

# View container logs
docker-compose logs postgres
```

## Final Schema State

After resolving all issues, the final migration state includes:

- **Single migration file**: `0000_create_user_management_tables.sql`
- **UUID extension enabled**: At the beginning of the first migration
- **Complete schema**: All tables with proper constraints and relationships
- **Clean migration history**: No unused or problematic migration files

## Key Takeaways

1. **Extension management is critical** - enable extensions before using dependent features
2. **Computed columns require careful testing** - consider application-level calculations for complex logic
3. **Migration file discipline** - always use Drizzle commands, never create files manually
4. **Incremental testing** - test each migration step and verify database connectivity
5. **Clear naming conventions** - use descriptive migration names for better maintainability
6. **Development tools** - leverage Drizzle Studio for visual database exploration and debugging

These lessons will help prevent similar issues in future database schema changes and ensure a smooth development experience with the Lovio app's database layer.