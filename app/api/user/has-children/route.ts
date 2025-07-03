import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import { userChildren } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export async function GET(_req: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const children = await db
      .select()
      .from(userChildren)
      .where(eq(userChildren.userId, userId))
      .limit(1);

    return NextResponse.json({ 
      hasChildren: children.length > 0 
    });
  } catch (error) {
    console.error('Error checking user children:', error);
    return NextResponse.json(
      { error: 'Failed to check user children' },
      { status: 500 }
    );
  }
}