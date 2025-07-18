import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Img,
  Link,
  Preview,
  Section,
  Text,
} from '@react-email/components';
import * as React from 'react';

interface InvitationEmailProps {
  inviterName: string;
  childName: string;
  inviteeRole: string;
  invitationUrl: string;
  personalMessage?: string;
  expirationDate: string;
}

export const InvitationEmail = ({
  inviterName = 'Sarah Johnson',
  childName = 'Emma',
  inviteeRole = 'caregiver',
  invitationUrl = 'https://lovio.app/invite/abc123',
  personalMessage,
  expirationDate = 'January 15, 2025',
}: InvitationEmailProps) => {
  const previewText = `${inviterName} has invited you to help care for ${childName}`;

  return (
    <Html>
      <Head />
      <Preview>{previewText}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={logoSection}>
            <Text style={logoText}>👶 Lovio</Text>
          </Section>
          
          <Heading style={heading}>You're Invited to Help Care for {childName}!</Heading>
          
          <Text style={paragraph}>
            Hi there! 👋
          </Text>
          
          <Text style={paragraph}>
            <strong>{inviterName}</strong> has invited you to join as a <strong>{inviteeRole}</strong> 
            to help track and care for <strong>{childName}</strong>'s activities on Lovio.
          </Text>

          {personalMessage && (
            <Section style={messageSection}>
              <Text style={messageTitle}>Personal Message:</Text>
              <Text style={messageText}>"{personalMessage}"</Text>
            </Section>
          )}

          <Section style={buttonSection}>
            <Button style={button} href={invitationUrl}>
              Accept Invitation
            </Button>
          </Section>

          <Text style={paragraph}>
            As a {inviteeRole}, you'll be able to:
          </Text>
          
          <Section style={featuresList}>
            <Text style={featureItem}>• Track {childName}'s sleep, feeding, and diaper changes</Text>
            <Text style={featureItem}>• View daily summaries and activity history</Text>
            <Text style={featureItem}>• Receive updates on {childName}'s care</Text>
            <Text style={featureItem}>• Collaborate with other caregivers</Text>
          </Section>

          <Hr style={hr} />

          <Text style={footerText}>
            This invitation expires on <strong>{expirationDate}</strong>.
          </Text>
          
          <Text style={footerText}>
            If you can't click the button above, copy and paste this link into your browser:
          </Text>
          
          <Link href={invitationUrl} style={link}>
            {invitationUrl}
          </Link>

          <Hr style={hr} />

          <Text style={footerText}>
            If you didn't expect this invitation, you can safely ignore this email.
          </Text>
          
          <Text style={footerText}>
            © 2025 Lovio. Made with ❤️ for families.
          </Text>
        </Container>
      </Body>
    </Html>
  );
};

export default InvitationEmail;

const main = {
  backgroundColor: '#f6f9fc',
  fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Oxygen-Sans,Ubuntu,Cantarell,"Helvetica Neue",sans-serif',
};

const container = {
  margin: '0 auto',
  padding: '20px 0 48px',
  maxWidth: '580px',
};

const logoSection = {
  textAlign: 'center' as const,
  marginBottom: '32px',
};

const logoText = {
  fontSize: '32px',
  fontWeight: 'bold',
  color: '#1a1a1a',
  margin: '0',
};

const heading = {
  fontSize: '24px',
  letterSpacing: '-0.5px',
  lineHeight: '1.3',
  fontWeight: '600',
  color: '#1a1a1a',
  padding: '17px 0 0',
  textAlign: 'center' as const,
};

const paragraph = {
  margin: '0 0 15px',
  fontSize: '16px',
  lineHeight: '1.4',
  color: '#3c4149',
};

const messageSection = {
  backgroundColor: '#e3f2fd',
  borderRadius: '8px',
  padding: '16px',
  margin: '24px 0',
};

const messageTitle = {
  fontSize: '14px',
  fontWeight: '600',
  color: '#1976d2',
  margin: '0 0 8px',
};

const messageText = {
  fontSize: '16px',
  lineHeight: '1.4',
  color: '#1565c0',
  margin: '0',
  fontStyle: 'italic',
};

const buttonSection = {
  textAlign: 'center' as const,
  margin: '32px 0',
};

const button = {
  backgroundColor: '#2563eb',
  borderRadius: '8px',
  color: '#fff',
  fontSize: '16px',
  fontWeight: '600',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'inline-block',
  padding: '12px 32px',
  lineHeight: '1.2',
};

const featuresList = {
  margin: '16px 0',
  paddingLeft: '8px',
};

const featureItem = {
  fontSize: '15px',
  lineHeight: '1.4',
  color: '#3c4149',
  margin: '0 0 8px',
};

const hr = {
  borderColor: '#e6ebf1',
  margin: '32px 0',
};

const link = {
  color: '#2563eb',
  textDecoration: 'underline',
  fontSize: '14px',
  wordBreak: 'break-all' as const,
};

const footerText = {
  fontSize: '12px',
  lineHeight: '1.4',
  color: '#8898aa',
  margin: '8px 0',
};