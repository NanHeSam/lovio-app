import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { getCurrentUser } from '@/lib/auth';
import { eq } from 'drizzle-orm';

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

    // Validate and add optional fields if provided
    if (timezone !== undefined) {
      if (timezone === null || timezone === '') {
        updateData.timezone = null;
      } else if (typeof timezone === 'string') {
        // Validate timezone string
        if (!isValidTimezone(timezone)) {
          return NextResponse.json({ 
            error: 'Invalid timezone. Please provide a valid timezone string (e.g., "America/New_York", "Europe/London")' 
          }, { status: 400 });
        }
        updateData.timezone = timezone;
      } else {
        return NextResponse.json({ 
          error: 'Timezone must be a string or null' 
        }, { status: 400 });
      }
    }
    
    if (avatarUrl !== undefined) {
      if (avatarUrl === null || avatarUrl === '') {
        updateData.avatarUrl = null;
      } else if (typeof avatarUrl === 'string') {
        // Validate URL format
        if (!isValidUrl(avatarUrl)) {
          return NextResponse.json({ 
            error: 'Invalid avatar URL. Please provide a valid URL format' 
          }, { status: 400 });
        }
        updateData.avatarUrl = avatarUrl;
      } else {
        return NextResponse.json({ 
          error: 'Avatar URL must be a string or null' 
        }, { status: 400 });
      }
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