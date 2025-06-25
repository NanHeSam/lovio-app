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

### AI Agent Testing
- `npm run test:agent all` - Run all AI agent scenarios with matrix view
- `npm run test:agent list` - List all available test scenarios
- `npm run test:agent run <scenario_name>` - Run specific scenario with storytelling
- `npm run test:agent matrix` - Show test coverage categories overview
- `npm run test:agent category <type>` - Run all tests for activity type (Sleep, Feed, Diaper, Time)
- `npm run test:agent category <type>:<scenario>` - Run specific category subset

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
  chat/             # AI agent logic and processing
  db/               # Database layer (schema, queries, types)
  utils.ts          # Shared utilities
drizzle/            # Database migrations
tests/              # Test suites organized by domain
  chat-scenarios.yml          # AI agent test scenarios (YAML)
  agent-test-utils.ts         # AI agent testing framework
  agent-validation-test.ts    # Validation logic tests
  database/                   # Jest database tests
scripts/            # Development and testing scripts
  seed-test-data.ts          # Test data seeding
  test-agent.ts              # AI agent test CLI runner
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
- **Unit/Integration**: Jest configuration supports both unit and integration tests
- **Database Tests**: Use isolated test environment with 30-second timeout
- **AI Agent Tests**: YAML-based scenario testing with storytelling visualization
  - Test coverage organized in 2D matrix (Activity Types × Scenario Types)
  - Streaming response parsing with error detection and debugging
  - Category-based test execution for focused validation
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

## AI Agent Testing Framework

The project includes a comprehensive testing framework for validating AI agent behavior in baby activity tracking scenarios.

### Test Organization

Tests are organized in a **2D matrix** for manageable coverage:

**Activity Types (Rows):**
- 🛌 **Sleep** - Sleep tracking scenarios
- 🍼 **Feed** - Feeding tracking scenarios  
- 👶 **Diaper** - Diaper change scenarios
- 🕐 **Time Parsing** - Time parsing edge cases

**Scenario Types (Columns):**
- 🆕 **Clean Start** - No conflicts, straightforward cases
- 🔄 **Smart Update** - Update recent active sessions
- ⚠️ **Conflict Resolution** - Handle stale/cross-type conflicts  
- 📝 **Always Simple** - Simple scenarios (diaper)
- 🧪 **Edge Cases** - Complex time parsing scenarios

### Test Files Structure

```
tests/
  chat-scenarios.yml           # YAML test scenario definitions
  agent-test-utils.ts         # Test framework and utilities
  agent-validation-test.ts    # Tests validation logic with mock data
scripts/
  test-agent.ts              # CLI runner for live AI agent tests
```

### Test File Purposes

- **agent-validation-test.ts**: Tests the validation logic itself using mock tool calls. Verifies that the `validateToolCalls` function correctly identifies passing/failing scenarios without making real AI calls.

- **test-agent.ts**: CLI interface for running actual AI agent tests against real scenarios. Makes live AI API calls and uses the validation logic to check real AI responses. Provides commands for listing, running, and categorizing tests.

### Creating New Test Scenarios

Add scenarios to `tests/chat-scenarios.yml`:

```yaml
- name: "scenario_name"
  user_input: "what user would say"
  current_state: 
    active_sessions: []  # or active sessions to set up
  expected:
    action: "startActivity"        # Expected tool call
    type: "sleep"                  # Activity type
    time_parsing_required: true    # Should parseUserTime be called?
    time_offset_minutes: -20       # Time offset from device time
    description: "What should happen"
```

### Test Framework Features

1. **Storytelling Visualization**: Tests display clear before/after stories
2. **Streaming Response Parsing**: Handles AI SDK streaming protocol
3. **Error Detection**: Automatically shows detailed errors when they occur
4. **Category-Based Testing**: Run focused test subsets
5. **Matrix Summary**: Visual overview of test coverage and results

### Test Validation Protocol

Each test validates the AI follows the 3-step protocol:
1. **Step 1**: `checkActiveSessions` - Understand current state
2. **Step 2**: `parseUserTime` - Parse time references when needed  
3. **Step 3**: Correct action (`startActivity`, `logActivity`, `endActivity`, or `ask_clarification`)

### Example Test Run

```bash
npm run test:agent run sleep_no_active_started_past
```

Shows:
- 📖 **Story setup**: Current time, baby state, user input, expected behavior
- 📊 **What happened**: Step-by-step AI actions with parameters and results
- ✅/❌ **Validation**: Success/failure with detailed error explanations

### Testing AI Agent Changes

When modifying AI agent behavior:

1. **Run focused tests**: `npm run test:agent category <ActivityType>`
2. **Check matrix coverage**: `npm run test:agent all`
3. **Fix specific scenarios**: `npm run test:agent run <scenario_name>`
4. **Add new test cases**: Update `tests/chat-scenarios.yml`
5. **Validate 3-step protocol**: Ensure checkActiveSessions → parseUserTime → action flow