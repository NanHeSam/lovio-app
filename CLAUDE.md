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
- `users` - User accounts with timezone, preference support, and email for invitations
- `children` - Child profiles with computed age tracking
- `user_children` - Junction table with role-based permissions (parent, guardian, caregiver)
- `invitations` - Secure token-based invitation system for caregiver access

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
  dashboard/         # Main dashboard interface with activity cards
    invitations/     # Invitation management pages
  activities/        # Activity tracking and management pages
  invite/            # Invitation acceptance pages
    [token]/         # Dynamic token-based invitation acceptance
  api/               # API routes (activities, AI chat, dashboard data)
    invitations/     # Invitation API endpoints (accept, reject, cancel)
components/          # React components
  dashboard/         # Dashboard-specific components
    ActivityDetailModal.tsx     # Modal for viewing activity details
    ClarificationModal.tsx      # AI clarification dialog
    DashboardCards.tsx          # Main dashboard container
    DashboardWrapper.tsx        # Dashboard layout wrapper
    DiaperCard.tsx             # Diaper change tracking card
    FeedCard.tsx               # Feeding activity card
    LiveTimer.tsx              # Real-time timer component
    PersistentAIInput.tsx      # AI chat input component
    SleepCard.tsx              # Sleep tracking card
  activities/        # Activity management components
  ui/                # Reusable UI components (Shadcn)
  Navigation.tsx     # Main application navigation
lib/
  chat/             # AI agent logic and processing
  db/               # Database layer (schema, queries, types)
  hooks/            # Custom React hooks (useDashboard, useTimer)
  utils/            # Utility functions
    datetime.ts     # Date and time utility functions
  utils.ts          # General shared utilities
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
- Modular component architecture with specialized dashboard cards
- Custom hooks for state management (useDashboard, useTimer)
- Centralized datetime utilities in `lib/utils/datetime.ts`
- Type guards for runtime type safety (e.g., FeedCard type validation)

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
- Required environment variables in `.env.local`:
  - `DATABASE_URL` - PostgreSQL connection string
  - `OPENAI_API_KEY` - OpenAI API key for AI agent
  - `LANGCHAIN_API_KEY` - LangSmith API key for tracing
  - `LANGCHAIN_TRACING_V2=true` - Enable LangSmith tracing
  - `LANGCHAIN_PROJECT=lovio-app` - Project name for trace organization
  - `CLERK_SECRET_KEY` - Clerk secret key for server-side operations
  - `CLERK_WEBHOOK_SECRET` - Clerk webhook secret for validating webhooks

## Authentication & Onboarding

### Onboarding Flow Architecture

The onboarding system uses a **database-driven approach** that is reliable and avoids Clerk metadata synchronization issues.

#### Flow Logic
- **User has no children** → Always redirected to `/onboarding` (cannot leave)
- **User has children** → Cannot access `/onboarding` (redirected to `/dashboard`)
- **Onboarding completion** → Create child → Automatic redirect to dashboard

#### Technical Implementation

**Middleware (`middleware.ts`)**:
- Handles basic Clerk authentication and sign-in redirects
- **Does NOT check onboarding status** (Edge Runtime limitation with database)
- Skips all logic for API routes to prevent redirect issues

**Client-Side Redirect (`components/OnboardingRedirect.tsx`)**:
- **Runs on ALL authenticated pages** (included in root layout)
- Calls `/api/user/has-children` to check database state
- Handles automatic redirects based on children status
- Edge Runtime compatible (uses API calls instead of direct DB queries)
- Uses `usePathname()` to detect current page automatically

**API Endpoints**:
- `/api/user/initialize` - Creates user in database during onboarding
- `/api/user/has-children` - Checks if user has any children (GET)
- `/api/children` - Creates child and associates with user (POST)

#### User Journey

**New User**:
1. Signs up via Clerk → User exists in Clerk only
2. Accesses any protected page → `OnboardingRedirect` runs
3. API call finds no children → Redirected to `/onboarding`
4. `OnboardingForm` initializes user in database + generates API key
5. User creates first child → Child associated with user
6. Form redirects to `/dashboard` → `OnboardingRedirect` allows access

**Existing User**:
1. Signs in via Clerk
2. `OnboardingRedirect` finds existing children → Allows dashboard access
3. If somehow lands on `/onboarding` → Automatically redirected away

#### Benefits of This Approach
- ✅ **100% Reliable** - Database state is immediate and consistent
- ✅ **No Race Conditions** - Direct database checks vs async metadata
- ✅ **Edge Runtime Compatible** - No database imports in middleware
- ✅ **Zero Maintenance** - Single component in layout covers all pages
- ✅ **Auto-Detection** - Uses Next.js router to detect current page
- ✅ **Self-Healing** - Redirects work on any page load automatically

### User & API Key Management

**User Creation Flow**:
1. Clerk handles authentication signup/signin
2. `/api/user/initialize` creates user in local database
3. API key generated automatically during initialization
4. Webhook handles profile updates (not creation)

**API Key Features**:
- Format: `lv_live_<32-char-hex>`
- Securely hashed in database (SHA-256)
- Automatic generation during user initialization
- Regeneration support via `/dashboard/api-keys`
- Usage tracking (creation, last used timestamps)
- Proper regeneration without conflicts (replaces existing keys)

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

### Onboarding Implementation Details

**Layout Integration (`app/layout.tsx`)**:
- `OnboardingRedirect` component included in `<SignedIn>` wrapper
- Runs automatically on ALL authenticated pages
- No need to add to individual pages

**Component Logic (`components/OnboardingRedirect.tsx`)**:
- Uses `usePathname()` to detect current route
- Calls `/api/user/has-children` for database state
- Simple logic: no children = force onboarding, has children = allow access
- Silent redirects (no loading states needed)

**API Route (`/api/user/has-children`)**:
- GET endpoint returning `{ hasChildren: boolean }`
- Direct database query to `user_children` table
- Handles authentication via Clerk's `auth()` helper

**Clerk Sign-In/Sign-Up Pages**:
- `app/sign-in/[[...sign-in]]/page.tsx` - Uses `forceRedirectUrl="/dashboard"`
- `app/sign-up/[[...sign-up]]/page.tsx` - Uses `forceRedirectUrl="/onboarding"`
- Forces specific redirects regardless of Clerk's default behavior

### Role-Based Permission Management
- Use `user_children.permissions` JSONB field for granular access control
- Default permissions: `{"read": true, "write": true, "admin": false}`
- Validate permissions in queries and API routes

### Dashboard Development
1. **Activity Cards**: Each activity type has its own card component (SleepCard, FeedCard, DiaperCard)
2. **Real-time Updates**: Use custom hooks for live timer functionality and data refreshing
3. **Error Handling**: Implement proper error boundaries and user-friendly error messages
4. **Type Safety**: Use type guards to validate activity details at runtime
5. **UI Components**: Leverage Shadcn UI components for consistent design
6. **Modal System**: Use ActivityDetailModal for detailed activity views

### Utility Functions
- **DateTime**: Use `lib/utils/datetime.ts` for all date/time operations
  - `getLocalTimeWithTimezone()` - Get current local time with timezone offset
  - `formatDuration()`, `formatTimeAgo()` - Format time durations
  - `getDurationMinutes()` - Calculate duration between dates
- **Error Handling**: Implement consistent error messaging across components

## AI Agent Testing Framework

The project includes a comprehensive testing framework for validating AI agent behavior in baby activity tracking scenarios. The AI agent supports creating, ending, and updating activities with intelligent conflict resolution.

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

## Invitation System

### Overview

The invitation system allows users to invite other caregivers (parents, guardians, or caregivers) to help track their children's activities. The system uses secure token-based invitations with email validation and expiration handling.

### Database Schema

#### Invitations Table
- `id` (UUID, primary key)
- `token` (64-char hex, unique secure token)
- `inviter_user_id` (foreign key to users)
- `child_id` (foreign key to children)
- `invitee_email` (email address of invitee)
- `invitee_role` (parent, guardian, caregiver)
- `personal_message` (optional message)
- `status` (pending, accepted, rejected, expired)
- `accepted_by` (foreign key to users, nullable)
- `created_at`, `expires_at`, `accepted_at`

#### Users Table Updates
- `email` (varchar, unique) - Added for invitation system

### Core Functions

#### Database Operations (`lib/db/queries.ts`)
- `createInvitation()` - Creates secure token-based invitations
- `getInvitationByToken()` - Retrieves invitation details by token
- `acceptInvitation()` - Handles invitation acceptance with validation
- `getUserInvitations()` - Gets sent/received invitations for users
- `cancelInvitation()` - Cancels pending invitations
- `cleanupExpiredInvitations()` - Maintains data integrity

#### API Endpoints
- `POST /api/children/invite` - Create invitations
- `POST /api/invitations/accept` - Accept invitations
- `POST /api/invitations/reject` - Reject invitations
- `POST /api/invitations/cancel` - Cancel pending invitations

### User Interface

#### Invitation Management (`/dashboard/invitations`)
- **Sent Tab**: View and manage sent invitations
- **Received Tab**: View and accept/reject received invitations
- **Status Tracking**: Visual indicators for pending, accepted, rejected, expired
- **Copy Link**: Easy sharing of invitation URLs
- **Cancel**: Remove pending invitations

#### Invitation Acceptance (`/invite/[token]`)
- **Secure Access**: Token-based invitation viewing
- **User-Friendly**: Clear invitation details and personal messages
- **Validation**: Email matching and expiration checking
- **Role Display**: Clear indication of assigned role

### Security Features

1. **Token-Based Security**: 64-character hex tokens for secure access
2. **Email Validation**: Invitations tied to specific email addresses
3. **Expiration Handling**: Automatic expiration after 7 days
4. **Permission Validation**: Users can only invite for children they have access to
5. **Duplicate Prevention**: Prevents duplicate invitations and existing access
6. **Role-Based Access**: Granular permissions (parent, guardian, caregiver)

### Integration Points

#### Authentication Flow
- **Sign-in with Invitation**: URL parameter handling for invitation tokens
- **Redirect Logic**: Seamless flow from invitation to sign-in to acceptance
- **Onboarding Integration**: Works with existing user onboarding system

#### Navigation
- **Main Navigation**: Invitations link added to dashboard navigation
- **Mobile Support**: Responsive design for all screen sizes
- **Notification System**: Toast notifications for user feedback

### Usage Workflow

1. **Send Invitation**: User creates invitation with email and role
2. **Generate URL**: System creates secure token-based URL
3. **Share Link**: Invitation URL shared with invitee
4. **Accept Invitation**: Invitee visits URL, signs in if needed, accepts
5. **Access Granted**: User-child relationship created, full access granted
6. **Manage Invitations**: Both parties can view invitation status

### Common Operations

#### Creating Invitations
```javascript
const invitation = await createInvitation({
  inviterUserId: userId,
  childId: childId,
  inviteeEmail: email,
  inviteeRole: 'caregiver',
  personalMessage: 'Please help track Emma\'s activities',
  expiresInDays: 7
});
```

#### Accepting Invitations
```javascript
const result = await acceptInvitation({
  token: invitationToken,
  acceptingUserId: userId
});
```

#### Error Handling
- Invalid tokens return appropriate error messages
- Expired invitations are automatically marked as expired
- Duplicate invitations are prevented with clear user feedback
- Email mismatches are handled gracefully

### Testing

The invitation system includes comprehensive testing:
- Database operations with proper cleanup
- API endpoint validation
- UI component testing
- Error scenario handling
- Security validation

### Future Enhancements

1. **Email Integration**: Automatic email sending with invitation links
2. **Bulk Invitations**: Invite multiple users at once
3. **Template Messages**: Pre-defined invitation messages
4. **Real-time Notifications**: Live updates for invitation status changes
5. **Advanced Permissions**: More granular role-based permissions
6. **Invitation Analytics**: Track invitation usage and acceptance rates