import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { invitations } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { token } = body;

    if (!token) {
      return NextResponse.json({ 
        error: 'Invitation token is required' 
      }, { status: 400 });
    }

    // Find the invitation
    const [invitation] = await db
      .select()
      .from(invitations)
      .where(eq(invitations.token, token))
      .limit(1);

    if (!invitation) {
      return NextResponse.json({ 
        success: false,
        message: 'Invalid invitation token' 
      }, { status: 400 });
    }

    // Check if invitation is still pending
    if (invitation.status !== 'pending') {
      return NextResponse.json({ 
        success: false,
        message: 'This invitation has already been processed' 
      }, { status: 400 });
    }

    // Check if invitation is expired
    if (new Date() > invitation.expiresAt) {
      // Mark as expired
      await db
        .update(invitations)
        .set({ status: 'expired' })
        .where(eq(invitations.id, invitation.id));
      
      return NextResponse.json({ 
        success: false,
        message: 'This invitation has expired' 
      }, { status: 400 });
    }

    // Mark invitation as rejected
    await db
      .update(invitations)
      .set({ status: 'rejected' })
      .where(eq(invitations.id, invitation.id));

    return NextResponse.json({ 
      success: true,
      message: 'Invitation declined successfully' 
    });

  } catch (error) {
    console.error('Error rejecting invitation:', error);
    
    return NextResponse.json({ 
      success: false,
      message: 'Internal server error' 
    }, { status: 500 });
  }
}