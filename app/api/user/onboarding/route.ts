import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { timezone, notifications, reminderFrequency } = await req.json();

    // Validate input data
    if (!timezone || typeof timezone !== 'string') {
      return NextResponse.json({ error: 'Invalid timezone' }, { status: 400 });
    }
    
    if (notifications !== undefined && typeof notifications !== 'boolean') {
      return NextResponse.json({ error: 'Invalid notifications format' }, { status: 400 });
    }
    
    if (reminderFrequency !== undefined && typeof reminderFrequency !== 'string') {
      return NextResponse.json({ error: 'Invalid reminderFrequency format' }, { status: 400 });
    }

    // Update user with onboarding data
    await db
      .update(users)
      .set({
        timezone,
        preferences: {
          notifications,
          reminderFrequency,
        },
        updatedAt: new Date(),
      })
      .where(eq(users.id, user.id));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error completing onboarding:', error);
    return NextResponse.json(
      { error: 'Failed to complete onboarding' },
      { status: 500 }
    );
  }
}