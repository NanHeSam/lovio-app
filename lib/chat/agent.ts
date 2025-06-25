import { openai } from '@ai-sdk/openai';
import { streamText, tool } from 'ai';
import { z } from 'zod';
import { 
  getActiveSessions, 
  getDailySummary, 
  getRecentActivities, 
  getLastActivity,
  startActivity,
  endActivity,
  logInstantActivity
} from '@/lib/db/queries';
import { db, activities } from '@/lib/db';
import type { ActivityDetails, SleepDetails, DiaperDetails, BottleDetails, NursingDetails } from '@/lib/db/types';

export interface ChatRequest {
  messages: Array<{ role: 'user' | 'assistant' | 'system'; content: string }>;
  userId: string;
  childId: string;
  deviceTime: string; // ISO format with timezone: "2025-01-03T12:30:33+05:00"
}

export async function processChatRequest(request: ChatRequest) {
  const { messages, userId, childId, deviceTime } = request;

  // Pre-fetch active sessions to include in context (save tokens)
  const activeSessions = await getActiveSessions(childId ? { childId } : undefined);
  
  // Insert context as first user message for better prompt caching
  const contextMessage = {
    role: 'user' as const,
    content: `Context: Device time is ${deviceTime}, User ID: ${userId}, Child ID: ${childId}

Current Active Sessions: ${activeSessions.length > 0 ? 
  activeSessions.map(s => `${s.type} (started: ${s.startTime}, id: ${s.id})`).join(', ') : 
  'None'}`
  };

  const messagesWithContext = [contextMessage, ...messages];

  return await streamText({
    model: openai('gpt-4.1'),
    messages: messagesWithContext,
    maxSteps: 5,
    tools: {
      parseUserTime: tool({
        description: 'Convert AI-determined time to UTC for database storage. Call this when user mentions any time reference.',
        parameters: z.object({
          targetTime: z.string().describe('Time you determined from context in ISO format with timezone (e.g. "2025-01-03T10:30:00-05:00")'),
          reasoning: z.string().describe('Your reasoning for this time choice'),
        }),
        execute: async ({ targetTime, reasoning }) => {
          try {
            const timeObject = new Date(targetTime);
            return { 
              utcTime: timeObject.toISOString(),
              localTime: targetTime,
              reasoning: reasoning
            };
          } catch (error) {
            return { error: `Invalid time format: ${targetTime}. ${error instanceof Error ? error.message : 'Unknown error'}` };
          }
        },
      }),

      getDailySummary: tool({
        description: 'Get daily summary of activities for the baby',
        parameters: z.object({
          date: z.string().optional().describe('Date in YYYY-MM-DD format, defaults to today'),
        }),
        execute: async ({ date }) => {
          try {
            if (!childId) {
              return { error: 'No child selected' };
            }

            const summary = await getDailySummary({ 
              childId, 
              ...(date && { date: new Date(date) })
            });
            return summary;
          } catch (error) {
            return { error: error instanceof Error ? error.message : 'Unknown error' };
          }
        },
      }),

      getRecentActivities: tool({
        description: 'Get recent activities for the baby',
        parameters: z.object({
          type: z.enum(['sleep', 'feed', 'diaper']).optional().describe('Type of activity to filter by'),
          limit: z.number().optional().default(10).describe('Number of activities to return'),
          hoursBack: z.number().optional().default(24).describe('How many hours back to look'),
        }),
        execute: async ({ type, limit, hoursBack }) => {
          try {
            if (!childId) {
              return { error: 'No child selected' };
            }

            const activities = await getRecentActivities({
              childId,
              type,
              limit,
              hoursBack
            });
            return { activities, count: activities.length };
          } catch (error) {
            return { error: error instanceof Error ? error.message : 'Unknown error' };
          }
        },
      }),

      getLastActivity: tool({
        description: 'Get the most recent activity of a specific type for the baby',
        parameters: z.object({
          type: z.enum(['sleep', 'feed', 'diaper']).describe('Type of activity to get'),
        }),
        execute: async ({ type }) => {
          try {
            if (!childId) {
              return { error: 'No child selected' };
            }

            const activity = await getLastActivity({ childId, type });
            return activity ? { activity } : { message: `No ${type} activity found for this child` };
          } catch (error) {
            return { error: error instanceof Error ? error.message : 'Unknown error' };
          }
        },
      }),

      startActivity: tool({
        description: 'Start a new activity session (sleep or feed)',
        parameters: z.object({
          type: z.enum(['sleep', 'feed']).describe('Type of activity to start'),
          startTimeUTC: z.string().optional().describe('Start time in UTC ISO format from parseUserTime'),
        }),
        execute: async ({ type, startTimeUTC }) => {
          try {
            if (!childId || !userId) {
              return { error: 'Missing child or user information' };
            }

            const activity = await startActivity({
              childId,
              createdBy: userId,
              type,
              ...(startTimeUTC && { startTime: new Date(startTimeUTC) })
            });
            return { success: true, activity };
          } catch (error) {
            return { error: error instanceof Error ? error.message : 'Unknown error' };
          }
        },
      }),

      endActivity: tool({
        description: 'End an active activity session',
        parameters: z.object({
          activityId: z.string().describe('ID of the activity to end'),
          endTimeUTC: z.string().optional().describe('End time in UTC ISO format'),
        }),
        execute: async ({ activityId, endTimeUTC }) => {
          try {
            const activity = await endActivity({
              activityId,
              ...(endTimeUTC && { endTime: new Date(endTimeUTC) })
            });
            return { success: true, activity };
          } catch (error) {
            return { error: error instanceof Error ? error.message : 'Unknown error' };
          }
        },
      }),

      logActivity: tool({
        description: 'Log a completed activity (sleep, feed, or diaper) with details and optional duration',
        parameters: z.object({
          type: z.enum(['sleep', 'feed', 'diaper']).describe('Type of activity to log'),
          startTimeUTC: z.string().optional().describe('Start time in UTC ISO format from parseUserTime'),
          endTimeUTC: z.string().optional().describe('End time in UTC ISO format'),
          duration: z.number().optional().describe('Duration in minutes, alternative to endTime'),
          
          // Feed-specific details
          feedType: z.enum(['bottle', 'nursing']).optional().describe('Type of feeding'),
          volume: z.number().optional().describe('Volume in ml for bottle feeding'),
          unit: z.enum(['ml', 'oz']).optional().describe('Unit for volume, defaults to ml'),
          leftDuration: z.number().optional().describe('Left breast nursing duration in minutes'),
          rightDuration: z.number().optional().describe('Right breast nursing duration in minutes'),
          
          // Diaper-specific details
          contents: z.enum(['pee', 'poo', 'both']).optional().describe('Contents of the diaper'),
          diaperVolume: z.enum(['little', 'medium', 'large']).optional().describe('Volume/amount for diaper'),
          hasRash: z.boolean().optional().describe('Whether there was a rash'),
          pooColor: z.enum(['yellow', 'brown', 'green', 'black', 'other']).optional().describe('Color of poo if present'),
          pooTexture: z.enum(['liquid', 'soft', 'formed', 'hard']).optional().describe('Texture of poo if present'),
        }),
        execute: async ({ 
          type, startTimeUTC, endTimeUTC, duration,
          feedType, volume, unit, leftDuration, rightDuration,
          contents, diaperVolume, hasRash, pooColor, pooTexture 
        }) => {
          try {
            if (!childId || !userId) {
              return { error: 'Missing child or user information' };
            }

            // Calculate times
            const activityStartTime = startTimeUTC ? new Date(startTimeUTC) : new Date(deviceTime);
            let activityEndTime = endTimeUTC ? new Date(endTimeUTC) : undefined;
            
            // If duration is provided but no endTime, calculate endTime
            if (duration && !activityEndTime) {
              activityEndTime = new Date(activityStartTime.getTime() + duration * 60000);
            }

            // Build activity details based on type
            let details: ActivityDetails;
            
            if (type === 'feed') {
              if (feedType === 'bottle' && volume) {
                details = {
                  type: 'bottle',
                  volume,
                  unit: unit || 'ml'
                } as BottleDetails;
              } else if (feedType === 'nursing') {
                details = {
                  type: 'nursing',
                  ...(leftDuration && { leftDuration }),
                  ...(rightDuration && { rightDuration }),
                  ...(duration && { totalDuration: duration })
                } as NursingDetails;
              } else if (volume) {
                details = {
                  type: 'bottle',
                  volume,
                  unit: unit || 'ml'
                } as BottleDetails;
              } else {
                details = { type: 'nursing' } as NursingDetails;
              }
            } else if (type === 'diaper') {
              details = {
                type: 'diaper',
                contents: (contents as 'pee' | 'poo' | 'both') || 'pee',
                ...(diaperVolume && { volume: diaperVolume }),
                ...(hasRash !== undefined && { hasRash }),
                ...(pooColor && { pooColor }),
                ...(pooTexture && { pooTexture })
              } as DiaperDetails;
            } else if (type === 'sleep') {
              details = { type: 'sleep' } as SleepDetails;
            } else {
              details = null;
            }

            // For diaper changes, always use instant activity (same start/end time)
            if (type === 'diaper') {
              activityEndTime = activityStartTime;
            }

            // Use instant activity for single-point activities, regular logging for duration activities
            if (activityEndTime && activityStartTime.getTime() === activityEndTime.getTime()) {
              const activity = await logInstantActivity({
                childId,
                createdBy: userId,
                type,
                time: activityStartTime,
                details
              });
              return { success: true, activity, logged: 'instant' };
            } else {
              // For activities with duration, insert directly with both start and end times
              const [activity] = await db.insert(activities).values({
                childId,
                createdBy: userId,
                type,
                startTime: activityStartTime,
                endTime: activityEndTime,
                details
              }).returning();
              
              return { success: true, activity, logged: 'duration' };
            }
          } catch (error) {
            return { error: error instanceof Error ? error.message : 'Unknown error' };
          }
        },
      }),
    },
    system: `You are a smart baby tracking assistant. Follow this intelligent 2-step process:

STEP 1: Parse time if mentioned
- If user mentions any time, determine what time they mean using device time context
- Current active sessions are already provided in the context message

STEP 2: Choose smart action based on context and active sessions
- Call parseUserTime with your calculated time in ISO format with timezone if time mentioned
- Use the returned UTC time for subsequent logging actions
RECENT active same type (judge reasonableness):
- "slept 2 hours" + recent sleep → endActivity with calculated end time
- "finished eating" + recent feed → endActivity 
- "started sleeping" + recent sleep → ask if they want to update start time

STALE active same type (use judgment):
- "started sleeping" + old sleep → ask: "End old session first?"
- "slept 2 hours" + old sleep → ask: "New entry or update old one?"

DIFFERENT type active:
- "sleeping" + active feed → ask: "End feeding to start sleep?"
- "started eating" + active sleep → ask: "End sleep to start feeding?"

DIAPER changes:
- Always create new entries with logActivity, no conflicts

NO active sessions:
- "started X ago" → startActivity with past start time
- "X for Y time" → logActivity with duration  
- "X Y ago" → logActivity at past time
- "is X-ing" → startActivity now

Key principles:
- Use intelligent judgment for "recent" vs "stale" 
- Smart updates over unnecessary conflicts
- Ask clarification only for genuine ambiguity
- Always confirm with local time context`,
  });
}
