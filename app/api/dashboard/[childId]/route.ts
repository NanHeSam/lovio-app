import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getDashboardData } from '@/lib/db/queries';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ childId: string }> }
) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { childId } = await params;
    
    if (!childId) {
      return NextResponse.json({ error: 'Child ID is required' }, { status: 400 });
    }

    const dashboardData = await getDashboardData(userId, childId);
    
    return NextResponse.json(dashboardData);
  } catch (error) {
    console.error('Dashboard API error:', error);
    
    if (error instanceof Error && error.message.includes('Access denied')) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}