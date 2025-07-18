import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { rejectInvitation } from '@/lib/db/queries';

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ 
        error: 'Unauthorized' 
      }, { status: 401 });
    }

    const body = await request.json();
    const { token } = body;

    if (!token) {
      return NextResponse.json({ 
        error: 'Invitation token is required' 
      }, { status: 400 });
    }

    // Use the centralized rejectInvitation function
    const result = await rejectInvitation({
      token,
      rejectingUserId: userId,
    });

    if (result.success) {
      return NextResponse.json({ 
        success: true,
        message: result.message 
      });
    } else {
      return NextResponse.json({ 
        success: false,
        message: result.message 
      }, { status: 400 });
    }

  } catch (error) {
    console.error('Error rejecting invitation:', error);
    
    return NextResponse.json({ 
      success: false,
      message: 'Internal server error' 
    }, { status: 500 });
  }
}