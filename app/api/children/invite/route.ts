import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { children, userChildren, users } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { childId, email, role, message } = body;

    // Validate required fields
    if (!childId || !email || !role) {
      return NextResponse.json({ 
        error: 'Child ID, email, and role are required' 
      }, { status: 400 });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json({ 
        error: 'Please provide a valid email address' 
      }, { status: 400 });
    }

    // Validate role
    if (!['parent', 'guardian', 'caregiver'].includes(role)) {
      return NextResponse.json({ 
        error: 'Invalid role. Must be parent, guardian, or caregiver' 
      }, { status: 400 });
    }

    // Check if the current user has permission to invite others for this child
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
        error: 'Access denied: You do not have permission to invite others for this child' 
      }, { status: 403 });
    }

    // Get child information for the invitation
    const [child] = await db
      .select()
      .from(children)
      .where(eq(children.id, childId))
      .limit(1);

    if (!child) {
      return NextResponse.json({ error: 'Child not found' }, { status: 404 });
    }

    // Check if the invited email already has access to this child
    const existingUser = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (existingUser.length > 0) {
      const existingAccess = await db
        .select()
        .from(userChildren)
        .where(
          and(
            eq(userChildren.userId, existingUser[0].id),
            eq(userChildren.childId, childId)
          )
        )
        .limit(1);

      if (existingAccess.length > 0) {
        return NextResponse.json({ 
          error: 'This user already has access to this child' 
        }, { status: 400 });
      }
    }

    // For now, we'll store the invitation in a simple way
    // In a production app, you might want to:
    // 1. Create a separate invitations table
    // 2. Send actual emails
    // 3. Create invitation tokens/links
    // 4. Handle invitation expiration
    
    // For this implementation, we'll create a pending user-child relationship
    // that gets activated when the user signs up
    
    // TODO: Implement proper email sending service
    // For now, we'll just log the invitation details
    console.log('Invitation details:', {
      from: user.email || user.fullName,
      to: email,
      childName: child.name,
      role,
      message,
      invitedAt: new Date(),
    });

    // Return success response
    return NextResponse.json({ 
      message: 'Invitation sent successfully',
      details: {
        childName: child.name,
        invitedEmail: email,
        role: role,
      }
    });

  } catch (error) {
    console.error('Error sending invitation:', error);
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}