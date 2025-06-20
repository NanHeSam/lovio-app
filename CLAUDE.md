# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Lovio is a modern family management application built with Next.js 15 and TypeScript, designed to help families track children's growth, milestones, and activities with role-based permissions and AI integration.

## Key Commands

### Development
- `npm run dev` - Start Next.js development server
- `npm run build` - Build production application
- `npm run start` - Start production server
- `npm run lint` - Run ESLint for code quality

### Testing
- `npm test` - Run all Jest tests
- `npm run test:watch` - Run tests in watch mode
- `npm run test:coverage` - Generate test coverage report
- `npm run test:db` - Run database-specific tests
- `npm run test:utils` - Run utility function tests

### Database Management
- `npm run db:generate -- --name descriptive_name` - Generate new migration
- `npm run db:migrate` - Apply migrations to database
- `npm run db:push` - Push schema changes directly (development only)
- `npm run db:studio` - Open Drizzle Studio for database exploration

## Architecture Overview

### Core Technology Stack
- **Framework**: Next.js 15 with App Router
- **Database**: PostgreSQL with Drizzle ORM
- **Styling**: Tailwind CSS with Shadcn UI components
- **Testing**: Jest with custom database test utilities
- **Development**: Docker Compose for local PostgreSQL

### Database Architecture

The database follows a sophisticated user-child relationship model with an activities tracking system optimized for AI integration:

#### Core Tables
- `users` - User accounts with timezone and preference support
- `children` - Child profiles with computed age tracking
- `user_children` - Junction table with role-based permissions (parent, guardian, caregiver)

#### Activities System (MCP-Optimized)
- `activities` - Core activity tracking (sleep, feed, diaper, medicine, weight, mood) with:
  - Session-based tracking for ongoing activities
  - UTC timezone consistency across all timestamps
  - AI confidence scoring and original input preservation
  - JSON schema validation for flexible activity details
- `activity_type_schemas` - JSON schema definitions for activity validation
- `ai_interactions` - AI processing logs with MCP tool integration
- `mcp_tools` - MCP tool definitions and usage tracking

### File Structure
```
app/                 # Next.js App Router pages
lib/
  db/               # Database layer (schema, queries, types)
  utils.ts          # Shared utilities
drizzle/            # Database migrations
tests/              # Jest test suites organized by domain
docs/lessons/       # Development insights and troubleshooting
```

## Development Guidelines

### Database Operations
- Always use migrations for schema changes (`npm run db:generate`)
- Never create migration files manually
- All timestamps must use `timestamp with time zone` for UTC consistency
- Use descriptive migration names: `add_user_preferences` not `migration_001`
- Test database operations in Jest with proper teardown

### Code Patterns
- Server Components by default, minimize client-side state
- Functional and declarative programming patterns
- Full TypeScript type safety with Drizzle ORM's `InferSelectModel`/`InferInsertModel`
- JSONB fields for flexible metadata with schema validation

### Testing Approach
- Jest configuration supports both unit and integration tests
- Database tests use isolated test environment with 30-second timeout
- Test utilities in `tests/` directory for common database operations
- Coverage collection from `app/`, `lib/`, and `components/` directories

### Environment Setup
- Docker Compose provides local PostgreSQL (`docker-compose up -d`)
- Database connection: `postgresql://lovio_user:lovio_password@localhost:5432/lovio_db`
- Required environment variables in `.env.local`

## Common Workflows

### Adding New Activity Types
1. Update `activity_type_schemas` table with JSON schema
2. Add validation constraints in `lib/db/schema.ts`
3. Create type definitions in `lib/db/types.ts`
4. Update AI processing logic for new activity interpretation

### Database Schema Changes
1. Modify schema in `lib/db/schema.ts`
2. Generate migration: `npm run db:generate -- --name add_feature_name`
3. Review generated SQL in `drizzle/` directory
4. Apply migration: `npm run db:migrate`
5. Update TypeScript types if needed
6. Write tests for new functionality

### Role-Based Permission Management
- Use `user_children.permissions` JSONB field for granular access control
- Default permissions: `{"read": true, "write": true, "admin": false}`
- Validate permissions in queries and API routes