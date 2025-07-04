import { describe, it, expect } from '@jest/globals';

/**
 * Integration test example for the v1/chat endpoint
 * 
 * To run this test against a live server:
 * 1. Start the dev server: npm run dev
 * 2. Get a valid API key from /dashboard/api-keys
 * 3. Set the LIVE_API_KEY environment variable
 * 4. Run: LIVE_API_KEY=your_key npm test tests/api/v1-chat-integration.test.ts
 */
describe('API v1/chat integration (with live server)', () => {
  const API_KEY = process.env.LIVE_API_KEY;
  const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000';

  // Skip tests if no API key provided
  const testCondition = API_KEY ? it : it.skip;

  testCondition('should handle real natural language query', async () => {
    const response = await fetch(`${API_BASE_URL}/api/v1/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`,
      },
      body: JSON.stringify({
        query: 'when did baby last sleep?',
        deviceTime: new Date().toISOString(),
      }),
    });

    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toHaveProperty('response');
    expect(data).toHaveProperty('user');
    expect(data).toHaveProperty('childId');
    expect(typeof data.response).toBe('string');
    expect(data.response.length).toBeGreaterThan(0);
  });

  testCondition('should handle activity creation query', async () => {
    const response = await fetch(`${API_BASE_URL}/api/v1/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`,
      },
      body: JSON.stringify({
        query: 'baby started sleeping 10 minutes ago',
        deviceTime: new Date().toISOString(),
      }),
    });

    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toHaveProperty('response');
    expect(data.response).toMatch(/sleep/i);
  });

  testCondition('should handle diaper change query', async () => {
    const response = await fetch(`${API_BASE_URL}/api/v1/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`,
      },
      body: JSON.stringify({
        query: 'baby had a diaper change with poo',
        deviceTime: new Date().toISOString(),
      }),
    });

    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toHaveProperty('response');
    expect(data.response).toMatch(/diaper|change/i);
  });

  // This test should run even without API key to show example usage
  it('should provide example usage when no API key', async () => {
    if (API_KEY) {
      console.log('✅ Integration tests ran with live API key');
      console.log('📖 Example usage:');
    } else {
      console.log('⚠️  Integration tests skipped - no API key provided');
      console.log('📖 To run integration tests:');
    }
    
    console.log(`
Example curl commands:

# Ask about last sleep
curl -X POST ${API_BASE_URL}/api/v1/chat \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -d '{"query": "when did baby last sleep?"}'

# Record sleep start
curl -X POST ${API_BASE_URL}/api/v1/chat \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -d '{"query": "baby started sleeping"}'

# Record diaper change
curl -X POST ${API_BASE_URL}/api/v1/chat \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -d '{"query": "baby had a diaper change with poo"}'
`);

    expect(true).toBe(true); // Always pass
  });
});