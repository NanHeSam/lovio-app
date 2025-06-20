# Database Setup with Docker Compose

This guide helps you set up a PostgreSQL database using Docker Compose for local development and testing with Drizzle ORM.

## Prerequisites

- Docker and Docker Compose installed on your system
- Node.js and npm/yarn installed

## Quick Start

### 1. Start the PostgreSQL Database

```bash
# Start the database in the background
docker-compose up -d postgres

# Check if the database is running
docker-compose ps
```

### 2. Install Dependencies

```bash
npm install
# or
yarn install
```

### 3. Test Database Connection

```bash
# Test the connection using the provided script
npm run db:test
```

### 4. Apply Database Migrations

```bash
# Apply existing migrations to set up the schema
npm run db:migrate

# For development: Generate new migrations when schema changes
npm run db:generate -- --name descriptive_migration_name

# Then apply the new migration
npm run db:migrate
```

### 5. Open Drizzle Studio (Optional)

```bash
# Open the database browser in your web browser
npm run db:studio
```

## Database Configuration

### Docker Compose Settings

- **Database Name**: `lovio_db`
- **Username**: `lovio_user`
- **Password**: `lovio_password`
- **Port**: `5432` (mapped to host)
- **Host**: `localhost`

### Environment Variables

The database connection string is configured in `.env.local`:

```
DATABASE_URL="postgresql://lovio_user:lovio_password@localhost:5432/lovio_db"
```

## Useful Commands

```bash
# Start all services
docker-compose up -d

# Stop all services
docker-compose down

# View logs
docker-compose logs postgres

# Access PostgreSQL CLI
docker-compose exec postgres psql -U lovio_user -d lovio_db

# Reset database (removes all data)
docker-compose down -v
docker-compose up -d postgres
```

## Troubleshooting

### Database Connection Issues

1. Ensure Docker is running
2. Check if the PostgreSQL container is healthy:
   ```bash
   docker-compose ps
   ```
3. View container logs:
   ```bash
   docker-compose logs postgres
   ```

### Port Conflicts

If port 5432 is already in use, modify the `docker-compose.yml` file:

```yaml
ports:
  - "5433:5432"  # Use port 5433 instead
```

Then update your `.env.local` file accordingly:

```
DATABASE_URL="postgresql://lovio_user:lovio_password@localhost:5433/lovio_db"
```

## Development Workflow

1. Start the database: `docker-compose up -d postgres`
2. Apply existing migrations: `npm run db:migrate`
3. Make changes to your schema in `lib/db/schema.ts`
4. Generate new migrations: `npm run db:generate -- --name descriptive_name`
5. Review the generated SQL in `drizzle/` folder
6. Apply the migration: `npm run db:migrate`
7. Test your application
8. Use Drizzle Studio to inspect data: `npm run db:studio`

## Current Schema

The database includes the following main components:

### Core Tables
- **users**: User management with timezone support
- **children**: Child profiles with birth date and metadata
- **user_children**: Many-to-many relationship between users and children

### Activities System (MCP-Optimized)
- **activities**: Core activity tracking with timezone-aware timestamps
  - Supports: sleep, feed, diaper, medicine, weight, mood
  - Session-based activities for ongoing events
  - AI confidence scoring and original input tracking
- **activity_type_schemas**: JSON schema definitions for activity types
- **ai_interactions**: AI processing logs and MCP tool integration
- **mcp_tools**: MCP tool definitions and usage tracking

### Key Features
- All timestamps include timezone information (`timestamp with time zone`)
- UUID primary keys with auto-generation
- Comprehensive data validation constraints
- CASCADE delete for data integrity
- JSON schema validation for flexible activity details

## Production Notes

This setup is intended for local development only. For production:

- Use a managed PostgreSQL service (Neon, Supabase, AWS RDS, etc.)
- Update the `DATABASE_URL` environment variable
- Ensure proper security configurations
- Always use migrations for schema changes (never `db:push`)
- Enable required PostgreSQL extensions (`uuid-ossp`)