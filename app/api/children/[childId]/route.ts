import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { children, userChildren } from '@/lib/db/schema';
import { getCurrentUser } from '@/lib/auth';
import { eq, and } from 'drizzle-orm';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { childId: string } }
) {
  try {
    const user = await getCurrentUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const childId = params.childId;
    const body = await request.json();
    const { name, birthDate, gender, avatarUrl } = body;

    // Validate required fields
    if (!name || typeof name !== 'string' || name.trim() === '') {
      return NextResponse.json({ error: 'Child name is required' }, { status: 400 });
    }

    if (!birthDate) {
      return NextResponse.json({ error: 'Birth date is required' }, { status: 400 });
    }

    // Validate birth date format
    const birthDateObj = new Date(birthDate);
    if (isNaN(birthDateObj.getTime())) {
      return NextResponse.json({ error: 'Invalid birth date format' }, { status: 400 });
    }

    // Validate gender if provided
    if (gender && !['male', 'female'].includes(gender)) {
      return NextResponse.json({ error: 'Gender must be either "male" or "female"' }, { status: 400 });
    }

    // Check if user has permission to update this child
    const userChildRelation = await db
      .select()
      .from(userChildren)
      .where(
        and(
          eq(userChildren.userId, user.id),
          eq(userChildren.childId, childId)
        )
      )
      .limit(1);

    if (userChildRelation.length === 0) {
      return NextResponse.json({ 
        error: 'Access denied: You do not have permission to update this child' 
      }, { status: 403 });
    }

    // Prepare update data
    const updateData: {
      name: string;
      birthDate: string;
      gender?: string | null;
      avatarUrl?: string | null;
      updatedAt: Date;
    } = {
      name: name.trim(),
      birthDate,
      updatedAt: new Date(),
    };

    // Add optional fields
    if (gender !== undefined) {
      updateData.gender = gender || null;
    }
    
    if (avatarUrl !== undefined) {
      updateData.avatarUrl = avatarUrl || null;
    }

    // Update the child
    const [updatedChild] = await db
      .update(children)
      .set(updateData)
      .where(eq(children.id, childId))
      .returning();

    if (!updatedChild) {
      return NextResponse.json({ error: 'Child not found' }, { status: 404 });
    }

    return NextResponse.json({ 
      child: updatedChild,
      message: 'Child information updated successfully' 
    });

  } catch (error) {
    console.error('Error updating child:', error);
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}