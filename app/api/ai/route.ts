import { NextRequest } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { processChatRequest } from '@/lib/chat/agent';

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return new Response('Unauthorized', { status: 401 });
    }

    const body = await request.json();
    const { messages, childId, deviceTime } = body;

    if (!childId) {
      return new Response('Child ID is required', { status: 400 });
    }

    if (!messages || !Array.isArray(messages)) {
      return new Response('Messages array is required', { status: 400 });
    }

    // Process the chat request using the existing agent
    const result = await processChatRequest({
      messages,
      userId,
      childId,
      deviceTime: deviceTime || new Date().toISOString(),
    });

    // Return the streaming response
    return result.toDataStreamResponse();
  } catch (error) {
    console.error('AI API error:', error);
    return new Response('Internal server error', { status: 500 });
  }
}