import { auth, currentUser } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import { users, userChildren } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export async function getCurrentUser() {
  const { userId } = await auth();
  
  if (!userId) {
    return null;
  }

  // Check if user exists in our database
  const existingUser = await db
    .select()
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (existingUser[0]) {
    return existingUser[0];
  }

  // User doesn't exist in our DB yet, create them
  const clerkUser = await currentUser();
  if (!clerkUser) {
    return null;
  }

  const newUser = await db
    .insert(users)
    .values({
      id: userId,
      fullName: `${clerkUser.firstName || ''} ${clerkUser.lastName || ''}`.trim() || 'User',
      avatarUrl: clerkUser.imageUrl,
    })
    .returning();

  return newUser[0];
}

export async function getCurrentUserWithChildren() {
  const user = await getCurrentUser();
  if (!user) return null;

  const children = await db
    .select()
    .from(userChildren)
    .where(eq(userChildren.userId, user.id))
    .limit(1);

  return {
    ...user,
    hasChildren: children.length > 0
  };
}

export async function requireAuth() {
  const user = await getCurrentUser();
  
  if (!user) {
    throw new Error('Authentication required');
  }
  
  return user;
}