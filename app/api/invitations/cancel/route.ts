import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { cancelInvitation } from '@/lib/db/queries';

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { invitationId } = body;

    if (!invitationId) {
      return NextResponse.json({ 
        error: 'Invitation ID is required' 
      }, { status: 400 });
    }

    // Cancel the invitation
    const result = await cancelInvitation({
      invitationId,
      userId,
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
    console.error('Error cancelling invitation:', error);
    
    return NextResponse.json({ 
      success: false,
      message: 'Internal server error' 
    }, { status: 500 });
  }
}