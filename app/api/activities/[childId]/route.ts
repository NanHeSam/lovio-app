import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db, activities, children, userChildren } from '@/lib/db';
import { eq, and, desc, asc, count } from 'drizzle-orm';
import { deleteActivity, deleteActivities, updateActivity } from '@/lib/db/queries';
import type { ActivityType } from '@/lib/db/types';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ childId: string }> }
) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const type = searchParams.get('type') as ActivityType | null;
    const sortBy = searchParams.get('sortBy') || 'startTime';
    const sortOrder = searchParams.get('sortOrder') || 'desc';
    
    const offset = (page - 1) * limit;
    const { childId } = await params;

    // Verify user has access to this child
    const userChild = await db
      .select()
      .from(userChildren)
      .where(and(
        eq(userChildren.userId, userId),
        eq(userChildren.childId, childId)
      ))
      .limit(1);

    if (userChild.length === 0) {
      return NextResponse.json({ error: 'Child not found or access denied' }, { status: 404 });
    }

    // Build query conditions
    let whereConditions = eq(activities.childId, childId);
    if (type) {
      whereConditions = and(whereConditions, eq(activities.type, type));
    }

    // Get total count for pagination
    const [totalCount] = await db
      .select({ count: count() })
      .from(activities)
      .where(whereConditions);

    // Build sort condition
    const sortColumn = activities[sortBy as keyof typeof activities] || activities.startTime;
    const sortDirection = sortOrder === 'asc' ? asc(sortColumn) : desc(sortColumn);

    // Get paginated activities
    const activitiesData = await db
      .select({
        id: activities.id,
        type: activities.type,
        startTime: activities.startTime,
        endTime: activities.endTime,
        details: activities.details,
        createdAt: activities.createdAt,
      })
      .from(activities)
      .where(whereConditions)
      .orderBy(sortDirection)
      .limit(limit)
      .offset(offset);

    // Calculate pagination info
    const totalPages = Math.ceil(totalCount.count / limit);
    const hasNext = page < totalPages;
    const hasPrev = page > 1;

    return NextResponse.json({
      activities: activitiesData,
      pagination: {
        page,
        limit,
        total: totalCount.count,
        totalPages,
        hasNext,
        hasPrev,
      },
      filters: {
        type,
        sortBy,
        sortOrder,
      },
    });
  } catch (error) {
    console.error('Error fetching activities:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ childId: string }> }
) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const activityId = searchParams.get('activityId');
    const activityIds = searchParams.get('activityIds');

    if (!activityId && !activityIds) {
      return NextResponse.json({ error: 'Activity ID(s) required' }, { status: 400 });
    }

    if (activityId) {
      // Delete single activity
      const deletedActivity = await deleteActivity({
        activityId,
        userId,
      });
      
      return NextResponse.json({ 
        success: true, 
        message: 'Activity deleted successfully',
        activity: deletedActivity 
      });
    } else if (activityIds) {
      // Delete multiple activities
      const ids = activityIds.split(',').filter(id => id.trim());
      const deletedActivities = await deleteActivities({
        activityIds: ids,
        userId,
      });
      
      return NextResponse.json({ 
        success: true, 
        message: `${deletedActivities.length} activities deleted successfully`,
        activities: deletedActivities 
      });
    }
  } catch (error) {
    console.error('Error deleting activities:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ childId: string }> }
) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { activityId, startTime, endTime, details } = body;

    if (!activityId) {
      return NextResponse.json({ error: 'Activity ID required' }, { status: 400 });
    }

    // Update activity
    const updatedActivity = await updateActivity({
      activityId,
      startTime: startTime ? new Date(startTime) : undefined,
      endTime: endTime ? new Date(endTime) : undefined,
      details: details || undefined,
    });

    return NextResponse.json({ 
      success: true, 
      message: 'Activity updated successfully',
      activity: updatedActivity 
    });
  } catch (error) {
    console.error('Error updating activity:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}