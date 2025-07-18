import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import { aiInteractions, activities } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';

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

    // First verify the activity exists and belongs to the user
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

    // Check if user has access to this activity
    if (activity[0].createdBy !== userId) {
      return NextResponse.json({ 
        error: 'Access denied' 
      }, { status: 403 });
    }

    // Find the AI interaction associated with this activity
    const aiInteraction = await db
      .select({ id: aiInteractions.id })
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
        langsmithTraceId: aiInteraction[0].id, // Use interaction ID as trace ID
      })
      .where(eq(aiInteractions.id, aiInteraction[0].id))
      .returning();

    // TODO: Send feedback to LangSmith
    // This would be implemented based on your LangSmith integration
    if (feedback === 'thumbs_down') {
      console.log(`Negative feedback for activity ${activityId}:`, {
        interactionId: aiInteraction[0].id,
        feedback,
        note,
        langsmithTraceUrl: `https://smith.langchain.com/o/YOUR_ORG_ID/p/lovio-app/r/${aiInteraction[0].id}`
      });
    }

    return NextResponse.json({
      message: 'Feedback submitted successfully',
      feedbackId: updatedInteraction[0].id,
      langsmithTraceUrl: `https://smith.langchain.com/o/YOUR_ORG_ID/p/lovio-app/r/${aiInteraction[0].id}`
    });

  } catch (error) {
    console.error('Error submitting feedback:', error);
    return NextResponse.json(
      { error: 'Failed to submit feedback' },
      { status: 500 }
    );
  }
}