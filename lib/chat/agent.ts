import { openai } from '@ai-sdk/openai';
import { streamText, generateText, tool } from 'ai';
import { z } from 'zod';
import { AISDKExporter } from 'langsmith/vercel';
import { 
  getActiveSessions, 
  getDailySummary, 
  getRecentActivities, 
  startActivity,
  updateActivity,
  logInstantActivity,
  logAIInteraction
} from '@/lib/db/queries';
import { db, activities, aiInteractions } from '@/lib/db';
import { eq } from 'drizzle-orm';
import type { ActivityDetails, SleepDetails, DiaperDetails, BottleDetails, NursingDetails } from '@/lib/db/types';

export interface ChatRequest {
  messages: Array<{ role: 'user' | 'assistant' | 'system'; content: string }>;
  userId: string;
  childId: string;
  deviceTime: string; // ISO format with timezone: "2025-01-03T12:30:33+05:00"
  streaming?: boolean; // If true, returns streaming response; if false, returns complete text
}

export async function processChatRequest(request: ChatRequest) {
  const { messages, userId, childId, deviceTime, streaming = true } = request;

  // Get the user's input message (last message should be from user)
  const userMessage = messages[messages.length - 1];
  const userInput = userMessage?.role === 'user' ? userMessage.content : '';

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

  // Initialize interaction tracking
  let interactionId: string | null = null;
  let associatedActivityId: string | null = null;
  const functionCalls: Array<{
    function: string;
    arguments: any;
    result: any;
    timestamp: string;
  }> = [];

  // Helper function to track function calls
  const trackFunctionCall = (functionName: string, args: any, result: any) => {
    functionCalls.push({
      function: functionName,
      arguments: args,
      result: result,
      timestamp: new Date().toISOString()
    });

    // If this function call resulted in an activity creation, log the linkage
    if (result?.activity?.id && interactionId) {
      console.log(`Function ${functionName} created activity ${result.activity.id} in LangSmith trace ${interactionId}`);
    }
  };

  try {
    // Log the initial interaction
    const interaction = await logAIInteraction({
      userId,
      childId,
      userInput,
    });
    interactionId = interaction.id;

    console.log(`Created AI interaction ${interactionId} with LangSmith trace ID: ${interactionId}`);

    // Shared configuration for both streaming and non-streaming calls
    const aiConfig = {
      model: openai('gpt-4.1'),
      messages: messagesWithContext,
      maxSteps: 5,
      experimental_telemetry: AISDKExporter.getSettings({
        runId: interactionId,
        metadata: {
          userId,
          childId,
          userInput: userInput.substring(0, 100), // First 100 chars for context
          environment: process.env.VERCEL_ENV || 'development', // preview, production, development
          deployment: process.env.VERCEL_URL ? 'vercel' : 'local',
          region: process.env.VERCEL_REGION || 'local',
          gitCommit: process.env.VERCEL_GIT_COMMIT_SHA?.substring(0, 7) || 'unknown',
        }
      }),
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
            const result = { 
              utcTime: timeObject.toISOString(),
              localTime: targetTime,
              reasoning: reasoning
            };
            trackFunctionCall('parseUserTime', { targetTime, reasoning }, result);
            return result;
          } catch (error) {
            const errorResult = { error: `Invalid time format: ${targetTime}. ${error instanceof Error ? error.message : 'Unknown error'}` };
            trackFunctionCall('parseUserTime', { targetTime, reasoning }, errorResult);
            return errorResult;
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
              const errorResult = { error: 'No child selected' };
              trackFunctionCall('getDailySummary', { date }, errorResult);
              return errorResult;
            }

            const summary = await getDailySummary({ 
              childId, 
              ...(date && { date: new Date(date) })
            });
            trackFunctionCall('getDailySummary', { date }, summary);
            return summary;
          } catch (error) {
            const errorResult = { error: error instanceof Error ? error.message : 'Unknown error' };
            trackFunctionCall('getDailySummary', { date }, errorResult);
            return errorResult;
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
              const errorResult = { error: 'No child selected' };
              trackFunctionCall('getRecentActivities', { type, limit, hoursBack }, errorResult);
              return errorResult;
            }

            const activities = await getRecentActivities({
              childId,
              type,
              limit,
              hoursBack
            });
            const result = { activities, count: activities.length };
            trackFunctionCall('getRecentActivities', { type, limit, hoursBack }, result);
            return result;
          } catch (error) {
            const errorResult = { error: error instanceof Error ? error.message : 'Unknown error' };
            trackFunctionCall('getRecentActivities', { type, limit, hoursBack }, errorResult);
            return errorResult;
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
              const errorResult = { error: 'Missing child or user information' };
              trackFunctionCall('startActivity', { type, startTimeUTC }, errorResult);
              return errorResult;
            }

            const activity = await startActivity({
              childId,
              createdBy: userId,
              type,
              ...(startTimeUTC && { startTime: new Date(startTimeUTC) })
            });
            
            // Associate this activity with the AI interaction
            associatedActivityId = activity.id;
            
            const result = { success: true, activity };
            trackFunctionCall('startActivity', { type, startTimeUTC }, result);
            return result;
          } catch (error) {
            const errorResult = { error: error instanceof Error ? error.message : 'Unknown error' };
            trackFunctionCall('startActivity', { type, startTimeUTC }, errorResult);
            return errorResult;
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
          const args = { 
            type, startTimeUTC, endTimeUTC, duration,
            feedType, volume, unit, leftDuration, rightDuration,
            contents, diaperVolume, hasRash, pooColor, pooTexture 
          };
          
          try {
            if (!childId || !userId) {
              const errorResult = { error: 'Missing child or user information' };
              trackFunctionCall('logActivity', args, errorResult);
              return errorResult;
            }

            // Calculate times
            const activityStartTime = startTimeUTC ? new Date(startTimeUTC) : new Date(deviceTime);
            if (isNaN(activityStartTime.getTime())) {
              return { error: 'Invalid start time provided' };
            }
            let activityEndTime = endTimeUTC ? new Date(endTimeUTC) : undefined;
            
            // If duration is provided but no endTime, calculate endTime
            if (duration && !activityEndTime) {
              if (duration < 0) {
                return { error: 'Duration must be positive' };
              }
              activityEndTime = new Date(activityStartTime.getTime() + duration * 60000);
            }

            // Build activity details based on type
            let details: ActivityDetails;
            
            if (type === 'feed') {
              // If volume is explicitly mentioned, use bottle feeding
              if (volume) {
                details = {
                  type: 'bottle',
                  volume,
                  unit: unit || 'ml'
                } as BottleDetails;
              } else {
                // Default to nursing for all other feeding scenarios
                details = {
                  type: 'nursing',
                  ...(leftDuration && { leftDuration }),
                  ...(rightDuration && { rightDuration }),
                  ...(duration && { totalDuration: duration })
                } as NursingDetails;
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
              
              // Associate this activity with the AI interaction
              associatedActivityId = activity.id;
              
              const result = { success: true, activity, logged: 'instant' };
              trackFunctionCall('logActivity', args, result);
              return result;
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
              
              // Associate this activity with the AI interaction
              associatedActivityId = activity.id;
              
              const result = { success: true, activity, logged: 'duration' };
              trackFunctionCall('logActivity', args, result);
              return result;
            }
          } catch (error) {
            const errorResult = { error: error instanceof Error ? error.message : 'Unknown error' };
            trackFunctionCall('logActivity', args, errorResult);
            return errorResult;
          }
        },
      }),

      updateActivity: tool({
        description: 'Update an existing activity (modify start time, end time, or details)',
        parameters: z.object({
          activityId: z.string().describe('ID of the activity to update'),
          startTimeUTC: z.string().optional().describe('New start time in UTC ISO format from parseUserTime'),
          endTimeUTC: z.string().optional().describe('New end time in UTC ISO format from parseUserTime'),
          
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
          activityId, startTimeUTC, endTimeUTC,
          feedType, volume, unit, leftDuration, rightDuration,
          contents, diaperVolume, hasRash, pooColor, pooTexture 
        }) => {
          try {
            // Build details object if any details are provided
            let details: ActivityDetails | undefined;
            
            // Check if we have feed details
            if (feedType || volume || leftDuration || rightDuration) {
              // If volume is explicitly mentioned, use bottle feeding
              if (volume) {
                details = {
                  type: 'bottle',
                  volume,
                  unit: unit || 'ml'
                } as BottleDetails;
              } else {
                // Default to nursing for all other feeding scenarios
                details = {
                  type: 'nursing',
                  ...(leftDuration && { leftDuration }),
                  ...(rightDuration && { rightDuration })
                } as NursingDetails;
              }
            }
            
            // Check if we have diaper details
            if (contents || diaperVolume || hasRash !== undefined || pooColor || pooTexture) {
              details = {
                type: 'diaper',
                contents: (contents as 'pee' | 'poo' | 'both') || 'pee',
                ...(diaperVolume && { volume: diaperVolume }),
                ...(hasRash !== undefined && { hasRash }),
                ...(pooColor && { pooColor }),
                ...(pooTexture && { pooTexture })
              } as DiaperDetails;
            }

            const activity = await updateActivity({
              activityId,
              ...(startTimeUTC && { startTime: new Date(startTimeUTC) }),
              ...(endTimeUTC && { endTime: new Date(endTimeUTC) }),
              ...(details && { details })
            });
            
            // Associate this activity with the AI interaction
            associatedActivityId = activityId;
            
            return { success: true, activity };
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
- ALWAYS respond with times in user's local timezone, never UTC

RECENT active same type (judge reasonableness):
- "slept 2 hours" + recent sleep → updateActivity with calculated endTimeUTC
- "finished eating" + recent feed → updateActivity with endTimeUTC (now)
- "started sleeping" + recent sleep → if reasonable, update existing session; if not, create new one

STALE active same type (be permissive):
- "started sleeping" + old sleep → create new sleep session (babies can have multiple sleep periods)
- "slept 2 hours" + old sleep → create new completed sleep entry
- Default to creating new activities rather than asking clarification

CONCURRENT ACTIVITIES (allow overlap):
- Sleep and feeding can happen simultaneously (babies often eat then sleep)
- "sleeping" + active feed → create new sleep session without ending feed
- "started eating" + active sleep → create new feed session without ending sleep
- Be permissive and create activities as requested

FEEDING TYPE LOGIC:
- If user mentions volume/amount (e.g., "100ml", "4oz") → use bottle feeding
- All other feeding scenarios (start/stop, duration, "nursing", "feeding") → use nursing
- Examples: "fed for 20 minutes" = nursing, "drank 120ml" = bottle

DIAPER changes:
- Always create new entries with logActivity, no conflicts

NO active sessions:
- "started X ago" → startActivity with past start time
- "X for Y time" → logActivity with duration  
- "X Y ago" → logActivity at past time
- "is X-ing" → startActivity now

UPDATE scenarios:
- When user explicitly wants to modify existing activity times or details
- Use updateActivity tool with activityId from active sessions
- Can update startTime, endTime, or activity-specific details
- To END activities: updateActivity with endTimeUTC parameter

Key principles:
- BE PERMISSIVE: Create activities as requested, minimize clarification
- Use intelligent judgment but favor action over asking
- Answer in very concise manner, 1-2 short sentences max
- ALWAYS format times in user's local timezone in responses
- Only ask clarification for genuinely ambiguous time references
- When in doubt, create the activity rather than asking`,
    };

    // Helper function to update AI interaction record
    async function updateAiInteraction(
      interactionId: string,
      responseText: string,
      functionCalls: any[],
      associatedActivityId?: string | null
    ) {
      const updateData: any = {
        aiResponse: responseText,
        functionCalls: functionCalls.length > 0 ? functionCalls : null,
      };
      
      if (associatedActivityId) {
        updateData.activityId = associatedActivityId;
      }
      
      await db.update(aiInteractions)
        .set(updateData)
        .where(eq(aiInteractions.id, interactionId));

      if (associatedActivityId) {
        console.log(`AI Interaction ${interactionId} linked to Activity ${associatedActivityId} and LangSmith trace ${interactionId}`);
      }
    }

    // Use streaming or non-streaming based on the parameter
    if (streaming) {
      const result = streamText(aiConfig);

      // Handle completion to update the interaction record (streaming)
      result.finishReason.then(async () => {
        try {
          if (interactionId) {
            const responseText = await result.text;
            await updateAiInteraction(interactionId, responseText, functionCalls, associatedActivityId);
          }
        } catch (error) {
          console.error('Error updating AI interaction:', error);
        }
      }).catch((error) => {
        console.error('Error in finishReason handler:', error);
      });

      return result;
    } else {
      // Non-streaming version - get complete result immediately
      const result = await generateText(aiConfig);
      
      // Update the interaction with the AI response immediately
      try {
        if (interactionId) {
          await updateAiInteraction(interactionId, result.text, functionCalls, associatedActivityId);
        }
      } catch (error) {
        console.error('Error updating AI interaction:', error);
      }

      return result;
    }
    
  } catch (error) {
    // Log error in the interaction record
    if (interactionId) {
      try {
        await db.update(aiInteractions)
          .set({
            errorMessage: error instanceof Error ? error.message : 'Unknown error'
          })
          .where(eq(aiInteractions.id, interactionId));
      } catch (updateError) {
        console.error('Error updating AI interaction with error:', updateError);
      }
    }
    
    // Re-throw the error
    throw error;
  }
}
