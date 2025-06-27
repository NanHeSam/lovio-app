import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export async function getCurrentUser() {
  const { userId } = await auth();
  
  if (!userId) {
    return null;
  }

  const user = await db
    .select()
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  return user[0] || null;
}

export async function requireAuth() {
  const user = await getCurrentUser();
  
  if (!user) {
    throw new Error('Authentication required');
  }
  
  return user;
}