// Test constants for hardcoded development testing
// These IDs match the data seeded via scripts/seed-test-data.ts

export const TEST_USER_ID = '550e8400-e29b-41d4-a716-446655440000';
export const TEST_CHILD_ID = '550e8400-e29b-41d4-a716-446655440001';

// Test user details (for reference)
export const TEST_USER_DETAILS = {
  id: TEST_USER_ID,
  fullName: 'Test Parent',
  timezone: 'America/New_York',
} as const;

// Test child details (for reference)
export const TEST_CHILD_DETAILS = {
  id: TEST_CHILD_ID,
  name: 'Test Baby',
  birthDate: '2024-01-15',
  gender: 'female' as const,
} as const;