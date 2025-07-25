import { NextRequest, NextResponse } from 'next/server';
import { auth, currentUser } from '@clerk/nextjs/server';
import { acceptInvitation } from '@/lib/db/queries';

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { token } = body;

    if (!token) {
      return NextResponse.json({ 
        error: 'Invitation token is required' 
      }, { status: 400 });
    }

    // Get user email from Clerk
    const clerkUser = await currentUser();
    const userEmail = clerkUser?.emailAddresses[0]?.emailAddress;

    // Accept the invitation
    const result = await acceptInvitation({
      token,
      acceptingUserId: userId,
      userEmail,
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
    console.error('Error accepting invitation:', error);
    
    return NextResponse.json({ 
      success: false,
      message: 'Internal server error' 
    }, { status: 500 });
  }
}