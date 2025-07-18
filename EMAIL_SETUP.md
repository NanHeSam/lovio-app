# Email System Setup Guide

This guide explains how to set up and configure the email system for sending invitation emails using Resend and React Email.

## Overview

The email system uses:
- **Resend**: Email delivery service with excellent developer experience
- **React Email**: Beautiful, responsive email templates built with React
- **TypeScript**: Full type safety for email components and API calls

## Features

- 🎨 Beautiful, responsive email templates
- 📧 Professional invitation emails with branding
- 🔒 Secure token-based invitations
- 📱 Mobile-friendly email design
- 🎯 Personalized messages and role-based content
- 🚀 High deliverability with Resend

## Setup Instructions

### 1. Get Resend API Key

1. Go to [Resend.com](https://resend.com)
2. Create an account or sign in
3. Go to your dashboard
4. Navigate to "API Keys" section
5. Create a new API key
6. Copy the API key (starts with `re_`)

### 2. Configure Environment Variables

Add these variables to your `.env.local` file:

```bash
# Resend Email Service
RESEND_API_KEY=re_your_api_key_here

# Email Configuration
RESEND_FROM_EMAIL=Lovio <noreply@yourdomain.com>
NEXT_PUBLIC_BASE_URL=https://your-app-domain.com
```

**Important Notes:**
- Replace `re_your_api_key_here` with your actual Resend API key
- For `RESEND_FROM_EMAIL`, use your verified domain in Resend
- For development, you can use `onboarding@resend.dev` as the from email
- Set `NEXT_PUBLIC_BASE_URL` to your production domain

### 3. Verify Domain (Production)

For production use, you'll need to verify your domain with Resend:

1. In your Resend dashboard, go to "Domains"
2. Click "Add Domain"
3. Enter your domain (e.g., `yourdomain.com`)
4. Add the required DNS records to your domain provider
5. Wait for verification (usually takes a few minutes)

### 4. Test Email System

1. Start your development server: `npm run dev`
2. Navigate to `/dashboard/test-email` (only available in development)
3. Enter your email address
4. Click "Send Test Email"
5. Check your inbox for the test invitation email

## Email Template Components

### InvitationEmail Component

Located at `emails/invitation-email.tsx`, this component creates beautiful invitation emails with:

- **Responsive Design**: Works on all email clients and devices
- **Branding**: Lovio logo and consistent styling
- **Personal Touch**: Inviter name, child name, and custom messages
- **Clear CTA**: Prominent "Accept Invitation" button
- **Feature Benefits**: List of what the invitee can do
- **Security Info**: Expiration date and link information

### Customization

You can customize the email template by editing:

```typescript
// emails/invitation-email.tsx
export const InvitationEmail = ({ 
  inviterName, 
  childName, 
  inviteeRole, 
  invitationUrl, 
  personalMessage, 
  expirationDate 
}) => {
  // Email content and styling
}
```

## Email Service Functions

### sendInvitationEmail()

Sends invitation emails with full template rendering:

```typescript
const emailResult = await sendInvitationEmail({
  invitation: invitationWithDetails,
  invitationUrl: 'https://app.com/invite/token'
});
```

### sendTestEmail()

Sends test emails for development and testing:

```typescript
const emailResult = await sendTestEmail('test@example.com');
```

## API Integration

### Invitation Creation

The invitation API (`/api/children/invite`) automatically:
1. Creates the invitation in the database
2. Generates secure invitation URL
3. Sends invitation email
4. Returns success status and email delivery info

### Error Handling

The system gracefully handles email failures:
- Invitation is still created in database
- Error details are logged for debugging
- User receives appropriate feedback
- Invitation URL is still available for manual sharing

## Development vs Production

### Development
- Uses `onboarding@resend.dev` as sender (no domain verification needed)
- Test email page available at `/dashboard/test-email`
- Detailed logging for debugging

### Production
- Requires verified domain for sender email
- No test email page in navigation
- Optimized error handling and logging

## Email Client Compatibility

The React Email templates are tested across major email clients:
- Gmail (Web, iOS, Android)
- Outlook (Web, Desktop, Mobile)
- Apple Mail (macOS, iOS)
- Yahoo Mail
- Thunderbird
- And many more

## Monitoring and Analytics

Resend provides:
- Delivery status tracking
- Open and click analytics
- Bounce and complaint handling
- Detailed logs and metrics

## Troubleshooting

### Common Issues

1. **Email not sending**
   - Check API key is correct
   - Verify environment variables are set
   - Check console logs for errors

2. **Email in spam folder**
   - Verify your domain with Resend
   - Check SPF/DKIM records
   - Avoid spam trigger words

3. **Template not rendering**
   - Check React Email component syntax
   - Verify all props are passed correctly
   - Test with simple HTML first

### Debug Steps

1. Check server logs for email sending errors
2. Use the test email page to verify basic functionality
3. Verify API key and environment variables
4. Check Resend dashboard for delivery status
5. Test with different email addresses

## Security Considerations

- API keys are stored securely in environment variables
- Invitation tokens are cryptographically secure
- Email content is sanitized to prevent XSS
- Rate limiting can be added to prevent abuse

## Future Enhancements

- Email templates for different invitation types
- Bulk invitation sending
- Email scheduling
- Advanced analytics and reporting
- A/B testing for email templates
- Multi-language support

## Support

For issues with:
- **Resend**: Check their [documentation](https://resend.com/docs) or support
- **React Email**: See their [GitHub repository](https://github.com/resend/react-email)
- **This Implementation**: Check the code comments and error logs