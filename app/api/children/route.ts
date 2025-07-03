import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { children, userChildren } from '@/lib/db/schema';
import { getCurrentUser } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { role, name, birthDate, gender } = body;

    if (!name || !birthDate) {
      return NextResponse.json({ error: 'Name and birth date are required' }, { status: 400 });
    }

    // Create the child and user-child relationship in a transaction
    const [child] = await db.transaction(async (tx) => {
      const [newChild] = await tx
        .insert(children)
        .values({
          name,
          birthDate,
          gender: gender || null,
        })
        .returning();

      // Create the user-child relationship
      await tx
        .insert(userChildren)
        .values({
          userId: user.id,
          childId: newChild.id,
          role: role || 'mom',
          permissions: { read: true, write: true, admin: true },
        });
      
      return [newChild];
    });

    return NextResponse.json({ child });
  } catch (error) {
    console.error('Error creating child:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
