import { NextRequest, NextResponse } from 'next/server';
import { validateApiKey } from '@/lib/utils/api-keys';

export interface AuthenticatedUser {
  id: string;
  fullName: string;
}

/**
 * Middleware to authenticate API requests using API keys
 */
export async function authenticateApiKey(request: NextRequest): Promise<{
  isAuthenticated: boolean;
  user?: AuthenticatedUser;
  error?: string;
}> {
  const authHeader = request.headers.get('authorization');
  
  if (!authHeader) {
    return {
      isAuthenticated: false,
      error: 'Missing Authorization header'
    };
  }

  // Check for Bearer token format
  const bearerMatch = authHeader.match(/^Bearer (.+)$/);
  if (!bearerMatch) {
    return {
      isAuthenticated: false,
      error: 'Invalid Authorization header format. Use: Bearer <api_key>'
    };
  }

  const apiKey = bearerMatch[1];
  
  try {
    const user = await validateApiKey(apiKey);
    
    if (!user) {
      return {
        isAuthenticated: false,
        error: 'Invalid or inactive API key'
      };
    }

    return {
      isAuthenticated: true,
      user
    };
  } catch (error) {
    console.error('API key validation error:', error);
    return {
      isAuthenticated: false,
      error: 'Authentication service error'
    };
  }
}

/**
 * Helper function to create authenticated API route handlers
 */
export function withApiKeyAuth<T extends any[]>(
  handler: (request: NextRequest, user: AuthenticatedUser, ...args: T) => Promise<NextResponse>
) {
  return async (request: NextRequest, ...args: T): Promise<NextResponse> => {
    const authResult = await authenticateApiKey(request);
    
    if (!authResult.isAuthenticated || !authResult.user) {
      return NextResponse.json(
        { 
          error: authResult.error || 'Authentication failed',
          code: 'AUTHENTICATION_REQUIRED'
        },
        { status: 401 }
      );
    }

    return handler(request, authResult.user, ...args);
  };
}

/**
 * Response helper for API key authentication errors
 */
export function createAuthErrorResponse(error: string, status: number = 401): NextResponse {
  return NextResponse.json(
    { 
      error,
      code: 'AUTHENTICATION_FAILED',
      timestamp: new Date().toISOString()
    },
    { status }
  );
}