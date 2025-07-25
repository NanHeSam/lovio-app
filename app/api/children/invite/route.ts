import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createInvitation } from '@/lib/db/queries';
import { UserRole, isValidUserRole, getUserRoles } from '@/lib/db/types';
import { sendInvitationEmail } from '@/lib/email';
import { validateAndGetBaseUrl } from '@/lib/utils/url';

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { childId, email, role, message } = body;

    // Validate required fields
    if (!childId || !email || !role) {
      return NextResponse.json({ 
        error: 'Child ID, email, and role are required' 
      }, { status: 400 });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json({ 
        error: 'Please provide a valid email address' 
      }, { status: 400 });
    }

    // Validate role using type-safe validation
    if (!isValidUserRole(role)) {
      const validRoles = getUserRoles().join(', ');
      return NextResponse.json({ 
        error: `Invalid role. Must be one of: ${validRoles}` 
      }, { status: 400 });
    }

    // Create the invitation
    const invitation = await createInvitation({
      inviterUserId: userId,
      childId,
      inviteeEmail: email,
      inviteeRole: role as UserRole,
      personalMessage: message,
      expiresInDays: 7, // Invitations expire in 7 days
    });

    // Generate invitation URL with validation
    const baseUrl = validateAndGetBaseUrl();
    const invitationUrl = `${baseUrl}/invite/${invitation.token}`;

    // Send invitation email
    const emailResult = await sendInvitationEmail({
      invitation,
      invitationUrl,
    });

    // Log invitation details
    console.log('Invitation created:', {
      id: invitation.id,
      token: invitation.token,
      from: invitation.inviter.fullName,
      to: invitation.inviteeEmail,
      childName: invitation.child.name,
      role: invitation.inviteeRole,
      message: invitation.personalMessage,
      expiresAt: invitation.expiresAt,
      invitationUrl,
      emailSent: emailResult.success,
      emailError: emailResult.success ? null : emailResult.error,
    });

    // Return success response with invitation details
    return NextResponse.json({ 
      message: emailResult.success ? 'Invitation sent successfully' : 'Invitation created but email failed to send',
      invitation: {
        id: invitation.id,
        childName: invitation.child.name,
        invitedEmail: invitation.inviteeEmail,
        role: invitation.inviteeRole,
        status: invitation.status,
        expiresAt: invitation.expiresAt,
        invitationUrl,
        emailSent: emailResult.success,
      },
      emailResult: emailResult.success ? { sent: true } : { sent: false, error: emailResult.error }
    });

  } catch (error) {
    console.error('Error creating invitation:', error);
    
    // Return specific error messages
    if (error instanceof Error) {
      return NextResponse.json({ 
        error: error.message 
      }, { status: 400 });
    }
    
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}