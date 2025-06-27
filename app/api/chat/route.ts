import { processChatRequest } from '@/lib/chat/agent';

export const maxDuration = 30;

export async function POST(req: Request) {
  const { messages, userId, childId, deviceTime } = await req.json();

  const result = await processChatRequest({
    messages,
    userId,
    childId,
    deviceTime
  });

  return result.toDataStreamResponse();
}
