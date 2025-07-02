import { NextRequest, NextResponse } from 'next/server';
import { withApiKeyAuth } from '@/lib/middleware/api-auth';
import { db } from '@/lib/db';
import { activities, children, userChildren } from '@/lib/db/schema';
import { eq, and, desc, inArray } from 'drizzle-orm';

/**
 * GET /api/v1/activities
 * Get activities for the authenticated user
 */
export const GET = withApiKeyAuth(async (request: NextRequest, user) => {
  try {
    const { searchParams } = new URL(request.url);
    const childId = searchParams.get('childId');
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100);
    const offset = parseInt(searchParams.get('offset') || '0');

    // Get user's children
    const userChildrenData = await db
      .select({ childId: userChildren.childId })
      .from(userChildren)
      .where(eq(userChildren.userId, user.id));

    const childIds = userChildrenData.map(uc => uc.childId);

    if (childIds.length === 0) {
      return NextResponse.json({
        activities: [],
        total: 0,
        message: 'No children found for this user'
      });
    }

    // Build query conditions
    let whereConditions = inArray(activities.childId, childIds);
    
    if (childId) {
      // Verify the child belongs to the user
      if (!childIds.includes(childId)) {
        return NextResponse.json(
          { error: 'Child not found or access denied' },
          { status: 404 }
        );
      }
      whereConditions = and(whereConditions, eq(activities.childId, childId)) || whereConditions;
    }

    // Fetch activities
    const userActivities = await db
      .select({
        id: activities.id,
        childId: activities.childId,
        type: activities.type,
        startTime: activities.startTime,
        endTime: activities.endTime,
        details: activities.details,
        createdAt: activities.createdAt,
        child: {
          id: children.id,
          name: children.name,
        }
      })
      .from(activities)
      .leftJoin(children, eq(activities.childId, children.id))
      .where(whereConditions)
      .orderBy(desc(activities.startTime))
      .limit(limit)
      .offset(offset);

    // Get total count for pagination
    const totalResult = await db
      .select({ count: activities.id })
      .from(activities)
      .where(whereConditions);

    return NextResponse.json({
      activities: userActivities,
      total: totalResult.length,
      limit,
      offset,
      user: {
        id: user.id,
        name: user.fullName
      }
    });

  } catch (error) {
    console.error('Error fetching activities:', error);
    return NextResponse.json(
      { error: 'Failed to fetch activities' },
      { status: 500 }
    );
  }
});

/**
 * POST /api/v1/activities
 * Create a new activity for the authenticated user
 */
export const POST = withApiKeyAuth(async (request: NextRequest, user) => {
  try {
    const body = await request.json();
    const { childId, type, startTime, endTime, details } = body;

    // Validate required fields
    if (!childId || !type || !startTime) {
      return NextResponse.json(
        { error: 'Missing required fields: childId, type, startTime' },
        { status: 400 }
      );
    }

    // Verify the child belongs to the user
    const userChild = await db
      .select()
      .from(userChildren)
      .where(and(
        eq(userChildren.userId, user.id),
        eq(userChildren.childId, childId)
      ))
      .limit(1);

    if (!userChild[0]) {
      return NextResponse.json(
        { error: 'Child not found or access denied' },
        { status: 404 }
      );
    }

    // Create the activity
    const newActivity = await db
      .insert(activities)
      .values({
        childId,
        createdBy: user.id,
        type,
        startTime: new Date(startTime),
        endTime: endTime ? new Date(endTime) : null,
        details: details || {},
      })
      .returning();

    return NextResponse.json({
      message: 'Activity created successfully',
      activity: newActivity[0]
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating activity:', error);
    return NextResponse.json(
      { error: 'Failed to create activity' },
      { status: 500 }
    );
  }
});