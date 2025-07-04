import { describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import { db, getPool } from '@/lib/db';
import { users, children, userChildren, activities } from '@/lib/db/schema';
import { randomUUID } from 'crypto';
import { NextRequest } from 'next/server';
import { POST } from '@/app/api/v1/chat/route';
import { hashApiKey } from '@/lib/utils/api-keys';
import { eq } from 'drizzle-orm';

// Mock the AI agent to avoid making actual OpenAI calls during tests
jest.mock('@/lib/chat/agent', () => ({
  processChatRequest: jest.fn(),
}));

import { processChatRequest } from '@/lib/chat/agent';
const mockProcessChatRequest = processChatRequest as jest.MockedFunction<typeof processChatRequest>;

describe('API v1/chat endpoint', () => {
  // Test data
  let testUser: { id: string; fullName: string };
  let testChild: { id: string; name: string };
  let testApiKey: string;
  let testApiKeyHashed: string;

  beforeAll(async () => {
    // Create test user
    const [user] = await db
      .insert(users)
      .values({
        id: randomUUID(),
        fullName: 'Test Parent',
        timezone: 'America/New_York',
      })
      .returning();
    testUser = user;

    // Create test child
    const [child] = await db
      .insert(children)
      .values({
        name: 'Test Baby',
        birthDate: '2023-01-15',
        gender: 'female',
      })
      .returning();
    testChild = child;

    // Link user to child
    await db
      .insert(userChildren)
      .values({
        userId: testUser.id,
        childId: testChild.id,
        role: 'mom',
      });

    // Create API key for testing
    testApiKey = 'lv_live_' + randomUUID().replace(/-/g, '');
    testApiKeyHashed = hashApiKey(testApiKey);
    
    // Update user with API key
    await db
      .update(users)
      .set({
        apiKey: testApiKeyHashed,
        apiKeyCreatedAt: new Date(),
        apiKeyActive: true,
      })
      .where(eq(users.id, testUser.id));
  });

  beforeEach(async () => {
    // Clean up activities before each test
    await db.delete(activities);
    
    // Reset mocks
    jest.clearAllMocks();
  });

  afterAll(async () => {
    // Clean up test data
    await db.delete(userChildren);
    await db.delete(children);
    await db.delete(users);
    
    // Close database connection
    const pool = getPool();
    if (pool) {
      await pool.end();
    }
  });

  describe('Authentication', () => {
    it('should reject requests without Authorization header', async () => {
      const request = new NextRequest('http://localhost:3000/api/v1/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: 'baby started sleeping'
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Missing Authorization header');
    });

    it('should reject requests with invalid API key format', async () => {
      const request = new NextRequest('http://localhost:3000/api/v1/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'InvalidFormat',
        },
        body: JSON.stringify({
          query: 'baby started sleeping'
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Invalid Authorization header format. Use: Bearer <api_key>');
    });

    it('should reject requests with invalid API key', async () => {
      const request = new NextRequest('http://localhost:3000/api/v1/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer invalid_api_key',
        },
        body: JSON.stringify({
          query: 'baby started sleeping'
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Invalid or inactive API key');
    });
  });

  describe('Request validation', () => {
    it('should reject requests without query field', async () => {
      const request = new NextRequest('http://localhost:3000/api/v1/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${testApiKey}`,
        },
        body: JSON.stringify({
          deviceTime: new Date().toISOString()
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Missing or invalid query field');
    });

    it('should reject requests with non-string query', async () => {
      const request = new NextRequest('http://localhost:3000/api/v1/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${testApiKey}`,
        },
        body: JSON.stringify({
          query: 123,
          deviceTime: new Date().toISOString()
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Missing or invalid query field');
    });
  });

  describe('Child selection', () => {
    it('should use the user\'s first child when no childId provided', async () => {
      // Mock the AI agent response
      mockProcessChatRequest.mockResolvedValue({
        text: 'Sleep session started successfully!'
      } as any);

      const request = new NextRequest('http://localhost:3000/api/v1/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${testApiKey}`,
        },
        body: JSON.stringify({
          query: 'baby started sleeping',
          deviceTime: new Date().toISOString()
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.response).toBe('Sleep session started successfully!');
      expect(data.childId).toBe(testChild.id);
      expect(data.user.id).toBe(testUser.id);
      expect(data.user.name).toBe(testUser.fullName);

      // Verify AI agent was called with correct parameters
      expect(mockProcessChatRequest).toHaveBeenCalledWith({
        messages: [{ role: 'user', content: 'baby started sleeping' }],
        userId: testUser.id,
        childId: testChild.id,
        deviceTime: expect.any(String),
        streaming: false,
      });
    });

    it('should use provided childId when specified', async () => {
      // Mock the AI agent response
      mockProcessChatRequest.mockResolvedValue({
        text: 'Activity logged successfully!'
      } as any);

      const request = new NextRequest('http://localhost:3000/api/v1/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${testApiKey}`,
        },
        body: JSON.stringify({
          query: 'baby had a diaper change',
          childId: testChild.id,
          deviceTime: new Date().toISOString()
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.response).toBe('Activity logged successfully!');
      expect(data.childId).toBe(testChild.id);

      // Verify AI agent was called with the specified childId
      expect(mockProcessChatRequest).toHaveBeenCalledWith({
        messages: [{ role: 'user', content: 'baby had a diaper change' }],
        userId: testUser.id,
        childId: testChild.id,
        deviceTime: expect.any(String),
        streaming: false,
      });
    });

    it('should reject when user has no children', async () => {
      // Create a user with no children
      const [userWithoutChildren] = await db
        .insert(users)
        .values({
          id: randomUUID(),
          fullName: 'Childless User',
          timezone: 'America/New_York',
        })
        .returning();

      // Create API key for the user without children
      const apiKey = 'lv_live_' + randomUUID().replace(/-/g, '');
      const apiKeyHashed = hashApiKey(apiKey);
      
      // Update user with API key
      await db
        .update(users)
        .set({
          apiKey: apiKeyHashed,
          apiKeyCreatedAt: new Date(),
          apiKeyActive: true,
        })
        .where(eq(users.id, userWithoutChildren.id));

      const request = new NextRequest('http://localhost:3000/api/v1/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          query: 'baby started sleeping',
          deviceTime: new Date().toISOString()
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe('No children found for this user');

      // Clean up
      await db.delete(users).where(eq(users.id, userWithoutChildren.id));
    });

    it('should reject when specified childId does not belong to user', async () => {
      // Create another child not associated with testUser
      const [otherChild] = await db
        .insert(children)
        .values({
          name: 'Other Baby',
          birthDate: '2023-06-15',
          gender: 'male',
        })
        .returning();

      const request = new NextRequest('http://localhost:3000/api/v1/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${testApiKey}`,
        },
        body: JSON.stringify({
          query: 'baby started sleeping',
          childId: otherChild.id,
          deviceTime: new Date().toISOString()
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe('Child not found or access denied');

      // Clean up
      await db.delete(children).where(eq(children.id, otherChild.id));
    });
  });

  describe('AI agent integration', () => {
    it('should process natural language queries through AI agent', async () => {
      const mockResponse = 'I\'ve recorded that the baby started sleeping at 3:00 PM.';
      mockProcessChatRequest.mockResolvedValue({
        text: mockResponse
      } as any);

      const deviceTime = '2025-01-04T15:00:00-08:00';
      const request = new NextRequest('http://localhost:3000/api/v1/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${testApiKey}`,
        },
        body: JSON.stringify({
          query: 'baby started sleeping',
          deviceTime: deviceTime
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.response).toBe(mockResponse);
      expect(data.user.id).toBe(testUser.id);
      expect(data.childId).toBe(testChild.id);

      // Verify AI agent was called with non-streaming mode
      expect(mockProcessChatRequest).toHaveBeenCalledWith({
        messages: [{ role: 'user', content: 'baby started sleeping' }],
        userId: testUser.id,
        childId: testChild.id,
        deviceTime: deviceTime,
        streaming: false,
      });
    });

    it('should handle AI agent errors gracefully', async () => {
      mockProcessChatRequest.mockRejectedValue(new Error('AI service unavailable'));

      const request = new NextRequest('http://localhost:3000/api/v1/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${testApiKey}`,
        },
        body: JSON.stringify({
          query: 'baby started sleeping',
          deviceTime: new Date().toISOString()
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Failed to process query');
    });

    it('should use current time as default deviceTime', async () => {
      const mockResponse = 'Query processed successfully!';
      mockProcessChatRequest.mockResolvedValue({
        text: mockResponse
      } as any);

      const request = new NextRequest('http://localhost:3000/api/v1/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${testApiKey}`,
        },
        body: JSON.stringify({
          query: 'when did baby last sleep?'
          // No deviceTime provided
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.response).toBe(mockResponse);

      // Verify AI agent was called with a deviceTime
      expect(mockProcessChatRequest).toHaveBeenCalledWith({
        messages: [{ role: 'user', content: 'when did baby last sleep?' }],
        userId: testUser.id,
        childId: testChild.id,
        deviceTime: expect.stringMatching(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/), // ISO format
        streaming: false,
      });
    });
  });

  describe('Response format', () => {
    it('should return properly formatted response', async () => {
      const mockResponse = 'Baby\'s last sleep was from 2:00 PM to 4:30 PM today.';
      mockProcessChatRequest.mockResolvedValue({
        text: mockResponse
      } as any);

      const request = new NextRequest('http://localhost:3000/api/v1/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${testApiKey}`,
        },
        body: JSON.stringify({
          query: 'when did baby last sleep?',
          deviceTime: new Date().toISOString()
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual({
        response: mockResponse,
        user: {
          id: testUser.id,
          name: testUser.fullName
        },
        childId: testChild.id
      });
    });
  });
});