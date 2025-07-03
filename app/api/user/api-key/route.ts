import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getApiKeyInfo, regenerateApiKey, revokeApiKey } from '@/lib/utils/api-keys';

/**
 * GET /api/user/api-key
 * Get API key information for the current user
 */
export async function GET() {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const apiKeyInfo = await getApiKeyInfo(userId);
    
    if (!apiKeyInfo) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(apiKeyInfo);
  } catch (error) {
    console.error('Error getting API key info:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/user/api-key
 * Regenerate API key for the current user
 */
export async function POST() {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const newApiKey = await regenerateApiKey(userId);
    
    return NextResponse.json({
      message: 'API key regenerated successfully',
      apiKey: newApiKey,
      warning: 'Store this key securely. It will not be shown again.'
    });
  } catch (error) {
    console.error('Error regenerating API key:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/user/api-key
 * Revoke API key for the current user
 */
export async function DELETE() {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    await revokeApiKey(userId);
    
    return NextResponse.json({
      message: 'API key revoked successfully'
    });
  } catch (error) {
    console.error('Error revoking API key:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}