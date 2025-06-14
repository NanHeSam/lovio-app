# Lovio App

A modern family management application built with Next.js 15, TypeScript, and PostgreSQL. Lovio helps families track children's growth, milestones, and manage family relationships with role-based permissions.

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Database**: PostgreSQL with Drizzle ORM
- **Styling**: Tailwind CSS
- **UI Components**: Shadcn UI + Radix UI
- **Development**: Docker Compose for local database

## Quick Start

### Prerequisites

- Node.js 18+ and npm
- Docker and Docker Compose

### Setup

1. **Clone and install dependencies**:
   ```bash
   git clone <repository-url>
   cd lovio-app
   npm install
   ```

2. **Start the database**:
   ```bash
   docker-compose up -d
   ```

3. **Set up environment variables**:
   ```bash
   cp .env.example .env.local
   # Edit .env.local with your database credentials
   ```

4. **Run database migrations**:
   ```bash
   npm run db:migrate
   npm run db:test  # Verify connection
   ```

5. **Start the development server**:
   ```bash
   npm run dev
   ```

6. **Open the application**:
   - App: [http://localhost:3000](http://localhost:3000)
   - Database Studio: `npm run db:studio` → [https://local.drizzle.studio](https://local.drizzle.studio)

## Database Management

### Available Commands

```bash
# Generate new migration with descriptive name
npm run db:generate -- --name add_feature_name

# Apply migrations to database
npm run db:migrate

# Push schema changes directly (development only)
npm run db:push

# Open Drizzle Studio for database exploration
npm run db:studio

# Test database connection
npm run db:test
```

### Migration Best Practices

1. **Always use descriptive names**: `npm run db:generate -- --name add_user_preferences`
2. **Never create migration files manually** - use Drizzle commands
3. **Review generated SQL** before applying migrations
4. **Test migrations** in development before production

See [Database Documentation](./lib/db/README.md) for detailed schema information.

## Project Structure

```
lovio-app/
├── app/                 # Next.js App Router pages
├── lib/
│   ├── db/             # Database schema, queries, and utilities
│   └── utils.ts        # Shared utilities
├── drizzle/            # Database migrations
├── docs/               # Project documentation
└── docker-compose.yml  # Local PostgreSQL setup
```

## Development

### Code Style

- TypeScript for all code
- Functional and declarative patterns
- Server Components by default
- Minimal client-side state

### Key Features

- **User Management**: Account creation, preferences, timezone support
- **Child Profiles**: Growth tracking, milestones, medical information
- **Family Relationships**: Role-based permissions (parent, guardian, caregiver)
- **Data Security**: Proper foreign key constraints and cascade deletions

## Documentation

- [Database Schema](./lib/db/README.md) - Complete database documentation
- [Lessons Learned](./docs/lessons/) - Development insights and troubleshooting

## Deployment

The application is designed for deployment on Vercel with a PostgreSQL database. See [deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for details.
