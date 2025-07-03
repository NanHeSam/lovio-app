import { NextResponse } from 'next/server';
import { auth, currentUser } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export async function POST() {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user already exists in our database
    const existingUser = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (existingUser[0]) {
      return NextResponse.json({ 
        message: 'User already exists',
        user: existingUser[0] 
      });
    }

    // Get user data from Clerk
    const clerkUser = await currentUser();
    if (!clerkUser) {
      return NextResponse.json({ error: 'User not found in Clerk' }, { status: 404 });
    }

    const fullName = `${clerkUser.firstName || ''} ${clerkUser.lastName || ''}`.trim();
    
    // Create user in database
    const userData = {
      id: userId,
      fullName: fullName || 'Unknown User',
      avatarUrl: clerkUser.imageUrl || null,
      createdAt: new Date(),
      updatedAt: new Date(),
      lastActiveAt: new Date(),
    };

    const newUser = await db
      .insert(users)
      .values(userData)
      .returning();

    console.log(`User initialized successfully: ${userId}`);

    return NextResponse.json({ 
      message: 'User initialized successfully',
      user: newUser[0] 
    });
  } catch (error) {
    console.error('Error initializing user:', error);
    return NextResponse.json(
      { error: 'Failed to initialize user' },
      { status: 500 }
    );
  }
}