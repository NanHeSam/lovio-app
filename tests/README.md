# Testing Documentation

This directory contains comprehensive tests for the Lovio App using Jest testing framework.

## Test Structure

```
tests/
├── database/           # Database-related tests
│   ├── connection.test.ts    # Database connection tests
│   ├── schema.test.ts        # Schema validation tests
│   └── queries.test.ts       # CRUD operations tests
├── api/               # API endpoint tests (future)
├── components/        # React component tests (future)
├── utils/             # Utility function tests
│   └── db-utils.test.ts     # Database utility tests
└── README.md          # This file
```

## Available Test Scripts

```bash
# Run all tests
npm test

# Run tests in watch mode (re-runs on file changes)
npm run test:watch

# Run tests with coverage report
npm run test:coverage

# Run only database tests
npm run test:db

# Run only utility tests
npm run test:utils
```

## Test Categories

### Database Tests

#### Connection Tests (`connection.test.ts`)
- Database connectivity
- PostgreSQL version verification
- Extension availability (uuid-ossp)
- UUID generation functionality
- Main db export validation

#### Schema Tests (`schema.test.ts`)
- Table existence verification
- Timestamp column validation (timezone support)
- UUID primary key validation
- Foreign key constraint verification
- Activity type enum validation
- Basic CRUD operations

#### Query Tests (`queries.test.ts`)
- User and children relationship queries
- Activity type schema creation
- Activity creation with relationships
- Cascade delete behavior
- JSON schema validation

### Utility Tests

#### Database Utilities (`db-utils.test.ts`)
- UUID format validation
- Activity type enum validation
- JSON schema structure validation
- Activity duration calculation
- Email format validation
- Child age calculation

## Test Configuration

### Jest Configuration (`jest.config.js`)
- Next.js integration
- TypeScript support
- Custom module mapping
- Coverage collection
- 30-second timeout for database operations

### Setup File (`jest.setup.js`)
- Environment variable loading
- Global timeout configuration
- Optional console mocking

## Environment Requirements

### Required Environment Variables
- `DATABASE_URL`: PostgreSQL connection string

### Database Requirements
- PostgreSQL with `uuid-ossp` extension
- All migrations applied
- Test database should be separate from development/production

## Running Tests

### Prerequisites
1. Ensure PostgreSQL is running (via Docker Compose)
2. Environment variables are configured
3. Database migrations are applied

### Basic Test Run
```bash
# Start database
docker-compose up -d

# Run migrations
npm run db:migrate

# Run tests
npm test
```

### Development Workflow
```bash
# Start watch mode for continuous testing
npm run test:watch

# Run specific test file
npm test -- tests/database/connection.test.ts

# Run tests matching pattern
npm test -- --testNamePattern="should connect"
```

## Test Data Management

### Test Isolation
- Each test suite creates its own test data
- Cleanup is performed in `afterAll` hooks
- Tests are designed to be independent

### Test Database
- Uses the same database as development
- Test data is prefixed/suffixed for identification
- Automatic cleanup prevents data pollution

## Coverage Reports

```bash
# Generate coverage report
npm run test:coverage

# View coverage in browser
open coverage/lcov-report/index.html
```

## Best Practices

### Writing Tests
1. Use descriptive test names
2. Follow AAA pattern (Arrange, Act, Assert)
3. Clean up test data in `afterAll` hooks
4. Use proper TypeScript types
5. Test both success and error cases

### Database Tests
1. Create minimal test data
2. Use transactions when possible
3. Test cascade behaviors
4. Verify constraints and validations
5. Test relationship queries

### Debugging Tests
1. Use `--verbose` flag for detailed output
2. Add `console.log` statements temporarily
3. Run single test files for isolation
4. Check database state manually if needed

## Future Enhancements

### Planned Test Categories
- API endpoint tests (`tests/api/`)
- React component tests (`tests/components/`)
- Integration tests
- Performance tests
- E2E tests with Playwright

### Test Utilities
- Database seeding utilities
- Mock data generators
- Test helpers for common operations
- Custom Jest matchers

## Troubleshooting

### Common Issues

#### Database Connection Errors
- Verify PostgreSQL is running
- Check `DATABASE_URL` environment variable
- Ensure migrations are applied

#### Test Timeouts
- Database operations may be slow
- Increase timeout in `jest.config.js` if needed
- Check for hanging connections

#### Import Errors
- Verify module path mappings in `jest.config.js`
- Check TypeScript configuration
- Ensure all dependencies are installed

### Getting Help
- Check Jest documentation
- Review test logs for specific errors
- Verify database schema matches expectations
- Check environment variable configuration