import { Resend } from 'resend';
import { InvitationEmail } from '@/emails/invitation-email';
import { InvitationWithDetails } from '@/lib/db/types';
import { validateAndGetBaseUrl, validateEmailEnvironment } from '@/lib/utils/url';

// Initialize Resend with API key (will be validated when functions are called)
const resend = new Resend(process.env.RESEND_API_KEY);

// Email configuration
const fromEmail = process.env.RESEND_FROM_EMAIL || 'Lovio <sam@eveoky.com>';

export interface SendInvitationEmailParams {
  invitation: InvitationWithDetails;
  invitationUrl: string;
}

export async function sendInvitationEmail({ invitation, invitationUrl }: SendInvitationEmailParams) {
  try {
    // Validate environment variables when actually sending email
    validateEmailEnvironment();
    
    // Validate that invitation URL is properly formatted
    if (!invitationUrl || !invitationUrl.startsWith('http')) {
      throw new Error('Invalid invitation URL provided');
    }

    const expirationDate = new Intl.DateTimeFormat('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(invitation.expiresAt);

    const emailData = await resend.emails.send({
      from: fromEmail,
      to: invitation.inviteeEmail,
      subject: `You're invited to help care for ${invitation.child.name} on Lovio`,
      react: InvitationEmail({
        inviterName: invitation.inviter.fullName,
        childName: invitation.child.name,
        inviteeRole: invitation.inviteeRole,
        invitationUrl,
        personalMessage: invitation.personalMessage || undefined,
        expirationDate,
      }),
    });

    console.log('✅ Invitation email sent successfully:', {
      messageId: emailData.data?.id,
      to: invitation.inviteeEmail,
      subject: `You're invited to help care for ${invitation.child.name} on Lovio`,
    });

    return {
      success: true,
      messageId: emailData.data?.id,
    };
  } catch (error) {
    console.error('❌ Failed to send invitation email:', error);
    
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

export async function sendTestEmail(to: string) {
  try {
    // Validate environment variables when actually sending email
    validateEmailEnvironment();
    
    const baseUrl = validateAndGetBaseUrl();
    const emailData = await resend.emails.send({
      from: fromEmail,
      to,
      subject: 'Test Email from Lovio',
      react: InvitationEmail({
        inviterName: 'Sarah Johnson',
        childName: 'Emma',
        inviteeRole: 'caregiver',
        invitationUrl: `${baseUrl}/invite/test-token`,
        personalMessage: 'This is a test invitation to make sure our email system is working properly.',
        expirationDate: 'January 15, 2025',
      }),
    });

    console.log('✅ Test email sent successfully:', {
      messageId: emailData.data?.id,
      to,
    });

    return {
      success: true,
      messageId: emailData.data?.id,
    };
  } catch (error) {
    console.error('❌ Failed to send test email:', error);
    
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
