# Database Migrations

This document explains how database migrations are handled in the Lovio app.

## Automatic Migration Execution

The app is configured to automatically run database migrations when it starts. This ensures your database schema is always up to date.

### How It Works

1. **Instrumentation Hook**: The app uses Next.js instrumentation (`instrumentation.ts`) to run migrations on server startup
2. **Database Initialization**: Migrations also run when the database connection is first established
3. **Environment-Aware**: Migrations are skipped in test environments to avoid conflicts

### Files Involved

- `instrumentation.ts` - Next.js instrumentation hook for startup migrations
- `lib/db/migrate.ts` - Migration utility functions
- `lib/db/index.ts` - Database initialization with migration checks
- `scripts/migrate.ts` - Manual migration script

## Migration Commands

### Automatic (Recommended)
Migrations run automatically when:
- The app starts (`npm run dev`, `npm run start`)
- The database connection is first established

### Manual Options

```bash
# Generate new migration from schema changes
npm run db:generate -- --name descriptive_name

# Run migrations manually (if needed)
npm run db:migrate:run

# Push schema directly (development only, skips migrations)
npm run db:push

# Open Drizzle Studio to inspect database
npm run db:studio
```

## Development Workflow

1. **Make Schema Changes**: Edit `lib/db/schema.ts`
2. **Generate Migration**: Run `npm run db:generate -- --name add_new_feature`
3. **Review Migration**: Check the generated SQL in `drizzle/` directory
4. **Start App**: Run `npm run dev` - migrations apply automatically
5. **Commit**: Add both schema changes and migration files to git

## Production Deployment

### Automatic (Default)
- Migrations run automatically when the app starts
- Safe operation - only applies pending migrations
- Fails the deployment if migrations fail

### Manual (If Needed)
```bash
# Run migrations before deployment
npm run db:migrate:run

# Then deploy the app
npm run build && npm run start
```

## Error Handling

- **Development**: Migration failures are logged but don't crash the app
- **Production**: Migration failures will prevent the app from starting
- **Test Environment**: Migrations are skipped entirely

## Migration Safety

✅ **Safe Operations** (Always run):
- Adding new tables
- Adding new columns with default values
- Adding indexes
- Creating new schemas

⚠️ **Potentially Unsafe** (Review carefully):
- Dropping columns
- Changing column types
- Adding non-nullable columns without defaults
- Renaming tables/columns

❌ **Dangerous** (Avoid in production):
- Dropping tables with data
- Operations that require downtime

## Troubleshooting

### Migration Fails
```bash
# Check migration logs
npm run db:migrate:run

# Inspect database state
npm run db:studio

# Reset development database (DANGER: loses data)
npm run db:push
```

### Schema Out of Sync
```bash
# Generate fresh migration
npm run db:generate -- --name fix_schema_sync

# Apply migration
npm run db:migrate:run
```

### Test Database Issues
Migrations are automatically skipped in test environments. If you need to run them:
```bash
NODE_ENV=development npm run db:migrate:run
```

## Best Practices

1. **Descriptive Names**: Use clear migration names like `add_user_preferences`
2. **Review SQL**: Always check generated migrations before committing
3. **Backup First**: Backup production data before major schema changes
4. **Test Locally**: Run migrations locally before deploying
5. **Gradual Changes**: Break large schema changes into smaller migrations

## Migration Files

Migrations are stored in `drizzle/` directory:
- `NNNN_migration_name.sql` - The actual migration SQL
- `meta/` - Migration metadata and snapshots
- `meta/_journal.json` - Migration history

Never manually edit migration files - always generate new ones for changes.