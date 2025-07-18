import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import { activities, children, users, aiInteractions, userChildren } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { buildLangsmithTraceUrl } from '@/lib/utils';

/**
 * GET /api/activities/[childId]/[activityId]
 * Get detailed activity information including AI interaction data
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ childId: string; activityId: string }> }
) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { childId, activityId } = await params;

    // Verify user has access to this child
    const userChild = await db
      .select()
      .from(userChildren)
      .where(
        and(
          eq(userChildren.userId, userId),
          eq(userChildren.childId, childId)
        )
      )
      .limit(1);

    if (!userChild[0]) {
      return NextResponse.json({ 
        error: 'Access denied: Child not found or unauthorized' 
      }, { status: 403 });
    }

    // Get activity details with AI interaction information
    const activityDetails = await db
      .select({
        activity: activities,
        child: children,
        createdByUser: users,
        aiInteraction: {
          id: aiInteractions.id,
          userInput: aiInteractions.userInput,
          aiResponse: aiInteractions.aiResponse,
          userFeedback: aiInteractions.userFeedback,
          feedbackNote: aiInteractions.feedbackNote,
          createdAt: aiInteractions.createdAt,
        }
      })
      .from(activities)
      .innerJoin(children, eq(activities.childId, children.id))
      .innerJoin(users, eq(activities.createdBy, users.id))
      .leftJoin(aiInteractions, eq(aiInteractions.activityId, activities.id))
      .where(
        and(
          eq(activities.id, activityId),
          eq(activities.childId, childId)
        )
      )
      .limit(1);

    if (!activityDetails || activityDetails.length === 0) {
      return NextResponse.json({ 
        error: 'Activity not found' 
      }, { status: 404 });
    }

    const result = activityDetails[0];
    
    return NextResponse.json({
      ...result.activity,
      child: result.child,
      createdByUser: result.createdByUser,
      aiInteraction: result.aiInteraction?.id ? result.aiInteraction : null,
      langsmithTraceUrl: result.aiInteraction?.id 
        ? buildLangsmithTraceUrl(result.aiInteraction.id)
        : null
    });

  } catch (error) {
    console.error('Error fetching activity details:', error);
    return NextResponse.json(
      { error: 'Failed to fetch activity details' },
      { status: 500 }
    );
  }
}