import { NextRequest, NextResponse } from 'next/server';
import { withApiKeyAuth } from '@/lib/middleware/api-auth';
import { processChatRequest } from '@/lib/chat/agent';
import { db } from '@/lib/db';
import { userChildren } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';

/**
 * POST /api/v1/chat
 * Process natural language queries using AI agent
 */
export const POST = withApiKeyAuth(async (request: NextRequest, user) => {
  try {
    const body = await request.json();
    const { query, childId, deviceTime } = body;

    // Validate required fields
    if (!query || typeof query !== 'string') {
      return NextResponse.json(
        { error: 'Missing or invalid query field' },
        { status: 400 }
      );
    }

    // If no childId provided, get the user's first child
    let targetChildId = childId;
    if (!targetChildId) {
      const userChildrenData = await db
        .select({ childId: userChildren.childId })
        .from(userChildren)
        .where(eq(userChildren.userId, user.id))
        .limit(1);

      if (userChildrenData.length === 0) {
        return NextResponse.json(
          { error: 'No children found for this user' },
          { status: 404 }
        );
      }

      targetChildId = userChildrenData[0].childId;
    } else {
      // Verify the child belongs to the user
      const userChild = await db
        .select()
        .from(userChildren)
        .where(
          and(
            eq(userChildren.userId, user.id),
            eq(userChildren.childId, childId)
          )
        )
        .limit(1);

      if (!userChild[0]) {
        return NextResponse.json(
          { error: 'Child not found or access denied' },
          { status: 404 }
        );
      }
    }

    // Create messages array for the AI agent
    const messages = [
      {
        role: 'user' as const,
        content: query
      }
    ];

    // Process the chat request using the existing agent (non-streaming)
    const result = await processChatRequest({
      messages,
      userId: user.id,
      childId: targetChildId,
      deviceTime: deviceTime || new Date().toISOString(),
      streaming: false, // Use non-streaming mode for API responses
    });

    // Get the response text directly from the non-streaming result
    const responseText = result.text;

    // Return the natural language response
    return NextResponse.json({
      response: responseText,
      user: {
        id: user.id,
        name: user.fullName
      },
      childId: targetChildId
    });

  } catch (error) {
    console.error('Error processing natural language query:', error);
    return NextResponse.json(
      { error: 'Failed to process query' },
      { status: 500 }
    );
  }
});