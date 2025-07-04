# Testing Database Setup ✅

This project uses a **completely separate test database** to ensure your development data is never affected during testing.

## Overview

- **Development Database**: `localhost:5432/lovio_db` (your main work) 🔒 **SAFE**
- **Test Database**: `localhost:5433/lovio_test_db` (isolated for tests) 🧪 **ISOLATED**

## Quick Start

### 1. Setup Test Database (First Time)
```bash
# Setup test database and run migrations
npm run test:setup
```

### 2. Run Tests with Automatic Setup/Teardown
```bash
# This handles everything automatically
npm run test:with-db

# Run specific tests
npm run test:with-db tests/api/
npm run test:with-db tests/database/
```

### 3. Manual Control (Advanced)
```bash
# Setup only
npm run test:setup

# Run tests manually
npm test

# Teardown when done
npm run test:teardown
```

## Available Test Commands

| Command | Description |
|---------|-------------|
| `npm run test:setup` | Start test database and run migrations |
| `npm run test:teardown` | Stop and remove test database |
| `npm run test:with-db` | Full test cycle (setup → test → teardown) |
| `npm run test:api` | Run API tests only |
| `npm run test:db` | Run database tests only |
| `npm test` | Run all tests (requires manual setup) |

## Database Configuration

### Test Environment Variables (`.env.test`)
```env
TEST_DATABASE_URL="postgresql://lovio_user:lovio_password@localhost:5433/lovio_test_db"
OPENAI_API_KEY=your_key_here
# ... other config
```

### Docker Services

The `docker-compose.yml` includes two PostgreSQL services:

```yaml
services:
  postgres:        # Development DB (port 5432)
  postgres-test:   # Test DB (port 5433)
```

## How It Works

1. **Isolation**: Tests use a completely separate database instance
2. **Clean State**: Each test suite starts with a fresh database
3. **No Conflicts**: Test database runs on different port (5433)
4. **Automatic Migration**: Test setup runs all migrations automatically
5. **Safe Cleanup**: Your development data is never touched

## Test File Structure

```
tests/
├── api/                    # API endpoint tests
│   ├── v1-chat.test.ts    # Natural language API tests
│   └── v1-chat-integration.test.ts
├── database/              # Database operation tests
│   ├── activity-queries.test.ts
│   └── setup.test.ts
└── utils/                 # Utility function tests
```

## Test Database Features

- **Fast**: In-memory optimizations for testing
- **Isolated**: Completely separate from development data
- **Fresh**: Each test run starts with clean migrations
- **Disposable**: Can be destroyed and recreated anytime

## Troubleshooting

### Port Conflicts
If port 5433 is already in use:
```bash
# Find what's using the port
lsof -i :5433

# Stop the test database
npm run test:teardown

# Edit docker-compose.yml to use different port
```

### Migration Issues
```bash
# Reset test database completely
npm run test:teardown
npm run test:setup
```

### Connection Issues
```bash
# Check if test database is running
docker ps | grep lovio-postgres-test

# Check logs
docker logs lovio-postgres-test
```

## Best Practices

1. **Always use test database for tests** - Never run tests against development data
2. **Clean up after tests** - Use `afterAll()` to clean up test data
3. **Isolate test data** - Each test should create its own data
4. **Use transactions** - For faster test cleanup when possible
5. **Mock external services** - Mock OpenAI and other external APIs

## CI/CD Integration

For GitHub Actions or other CI systems:

```yaml
# Example GitHub Actions step
- name: Setup Test Database
  run: |
    docker-compose up -d postgres-test
    npm run test:setup

- name: Run Tests
  run: npm test

- name: Cleanup
  run: npm run test:teardown
```