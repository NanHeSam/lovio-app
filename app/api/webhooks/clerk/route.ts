import { NextRequest, NextResponse } from 'next/server';
import { Webhook } from 'svix';
import { headers } from 'next/headers';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

type WebhookEvent = {
  data: {
    id: string;
    email_addresses: Array<{ email_address: string }>;
    first_name: string;
    last_name: string;
    image_url?: string;
  };
  type: 'user.created' | 'user.updated' | 'user.deleted';
};

export async function POST(req: NextRequest) {
  // Get the headers
  const headerPayload = await headers();
  const svix_id = headerPayload.get('svix-id');
  const svix_timestamp = headerPayload.get('svix-timestamp');
  const svix_signature = headerPayload.get('svix-signature');

  // If there are no headers, error out
  if (!svix_id || !svix_timestamp || !svix_signature) {
    return new Response('Error occured -- no svix headers', {
      status: 400,
    });
  }

  // Get the body
  const payload = await req.json();
  const body = JSON.stringify(payload);

  // Create a new Svix instance with your webhook secret
  const wh = new Webhook(process.env.CLERK_WEBHOOK_SECRET || '');

  let evt: WebhookEvent;

  // Verify the payload with the headers
  try {
    evt = wh.verify(body, {
      'svix-id': svix_id,
      'svix-timestamp': svix_timestamp,
      'svix-signature': svix_signature,
    }) as WebhookEvent;
  } catch (err) {
    console.error('Error verifying webhook:', err);
    return new Response('Error occured', {
      status: 400,
    });
  }

  // Handle the webhook
  const { id } = evt.data;
  const eventType = evt.type;

  try {
    switch (eventType) {
      case 'user.created':
        // User creation is now handled in the onboarding flow
        // Just log the event for monitoring purposes
        console.log(`User creation webhook received for: ${id} (handled in onboarding)`);
        break;

      case 'user.updated':
        {
          const updatedFullName = `${evt.data.first_name || ''} ${evt.data.last_name || ''}`.trim();
          const updatedEmail = evt.data.email_addresses[0]?.email_address || null;
          
          // Update existing user (don't regenerate API key)
          await db
            .update(users)
            .set({
              fullName: updatedFullName || 'Unknown User',
              email: updatedEmail,
              avatarUrl: evt.data.image_url || null,
              updatedAt: new Date(),
              lastActiveAt: new Date(),
            })
            .where(eq(users.id, id));

          console.log(`User updated: ${id}`);
        }
        break;

      case 'user.deleted':
        await db.delete(users).where(eq(users.id, id));
        console.log(`User deleted: ${id}`);
        break;

      default:
        console.log(`Unhandled event type: ${eventType}`);
    }

    return NextResponse.json({ message: 'Webhook processed successfully' });
  } catch (error) {
    console.error('Error processing webhook:', error);
    return new Response('Error processing webhook', { status: 500 });
  }
}
