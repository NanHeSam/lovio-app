import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { getCurrentUser } from '@/lib/auth';
import { eq } from 'drizzle-orm';

/**
 * Handles PATCH requests to update the authenticated user's profile.
 *
 * Validates and updates the user's full name, timezone, and avatar URL based on the request body.
 * Returns the updated user data and a success message on success, or an appropriate error response on failure.
 */
export async function PATCH(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { fullName, timezone, avatarUrl } = body;

    // Validate required fields
    if (!fullName || typeof fullName !== 'string' || fullName.trim() === '') {
      return NextResponse.json({ error: 'Full name is required' }, { status: 400 });
    }

    // Prepare update data
    const updateData: {
      fullName: string;
      timezone?: string | null;
      avatarUrl?: string | null;
      updatedAt: Date;
    } = {
      fullName: fullName.trim(),
      updatedAt: new Date(),
    };

    // Add optional fields if provided
    if (timezone !== undefined) {
      updateData.timezone = timezone || null;
    }
    
    if (avatarUrl !== undefined) {
      updateData.avatarUrl = avatarUrl || null;
    }

    // Update the user
    const [updatedUser] = await db
      .update(users)
      .set(updateData)
      .where(eq(users.id, user.id))
      .returning();

    return NextResponse.json({ 
      user: updatedUser,
      message: 'Profile updated successfully' 
    });

  } catch (error) {
    console.error('Error updating user profile:', error);
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}