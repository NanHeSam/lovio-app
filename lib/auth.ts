import { auth } from '@clerk/nextjs/server';
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

  return existingUser[0] || null;
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