import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import { aiInteractions, activities } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { Client } from 'langsmith';
import { validateChildAccess } from '@/lib/db/queries';
import { buildLangsmithTraceUrl } from '@/lib/utils';

/**
 * POST /api/feedback
 * Submit feedback for an AI interaction
 */
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { activityId, feedback, note } = body;

    if (!activityId || !feedback) {
      return NextResponse.json({ 
        error: 'Missing required fields: activityId and feedback' 
      }, { status: 400 });
    }

    if (!['thumbs_up', 'thumbs_down'].includes(feedback)) {
      return NextResponse.json({ 
        error: 'Invalid feedback type. Must be thumbs_up or thumbs_down' 
      }, { status: 400 });
    }

    // First verify the activity exists and check if user has access to the child
    const activity = await db
      .select({ 
        id: activities.id, 
        childId: activities.childId,
        createdBy: activities.createdBy 
      })
      .from(activities)
      .where(eq(activities.id, activityId))
      .limit(1);

    if (!activity || activity.length === 0) {
      return NextResponse.json({ 
        error: 'Activity not found' 
      }, { status: 404 });
    }

    // Check if user has access to this child (supports collaborative childcare)
    const hasAccess = await validateChildAccess(userId, activity[0].childId);
    if (!hasAccess) {
      return NextResponse.json({ 
        error: 'Access denied: You do not have permission to access this child' 
      }, { status: 403 });
    }

    // Find the AI interaction associated with this activity
    const aiInteraction = await db
      .select({ 
        id: aiInteractions.id
      })
      .from(aiInteractions)
      .where(
        and(
          eq(aiInteractions.activityId, activityId),
          eq(aiInteractions.userId, userId)
        )
      )
      .limit(1);

    if (!aiInteraction || aiInteraction.length === 0) {
      return NextResponse.json({ 
        error: 'No AI interaction found for this activity' 
      }, { status: 404 });
    }

    // Update the AI interaction with feedback
    const updatedInteraction = await db
      .update(aiInteractions)
      .set({
        userFeedback: feedback,
        feedbackNote: note || null,
      })
      .where(eq(aiInteractions.id, aiInteraction[0].id))
      .returning();

    // Send feedback to LangSmith using the AI interaction ID as the trace ID
    const langsmithTraceId = aiInteraction[0].id;
    try {
      const langsmithClient = new Client({
        apiKey: process.env.LANGCHAIN_API_KEY,
      });

      // Submit feedback to LangSmith
      await langsmithClient.createFeedback(langsmithTraceId, 'user_feedback', {
        score: feedback === 'thumbs_up' ? 1 : 0,
        value: feedback === 'thumbs_up' ? 'positive' : 'negative',
        comment: note || undefined,
        feedbackSourceType: 'app'
      });

      console.log(`Feedback sent to LangSmith for trace ${langsmithTraceId}: ${feedback}`);
    } catch (error) {
      console.error('Error sending feedback to LangSmith:', error);
      // Don't fail the request if LangSmith feedback fails
    }

    return NextResponse.json({
      message: 'Feedback submitted successfully',
      feedbackId: updatedInteraction[0].id,
      langsmithTraceUrl: buildLangsmithTraceUrl(langsmithTraceId)
    });

  } catch (error) {
    console.error('Error submitting feedback:', error);
    return NextResponse.json(
      { error: 'Failed to submit feedback' },
      { status: 500 }
    );
  }
}