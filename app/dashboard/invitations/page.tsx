import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { getUserInvitations } from '@/lib/db/queries';
import { InvitationManagement } from './components/InvitationManagement';

export default async function InvitationsPage() {
  const { userId } = await auth();
  
  if (!userId) {
    redirect('/sign-in');
  }

  // Get both sent and received invitations
  const [sentInvitations, receivedInvitations] = await Promise.all([
    getUserInvitations({ userId, type: 'sent' }),
    getUserInvitations({ userId, type: 'received' })
  ]);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Invitations</h1>
        <p className="text-gray-600 mt-2">
          Manage invitations you've sent and received
        </p>
      </div>

      <InvitationManagement 
        sentInvitations={sentInvitations}
        receivedInvitations={receivedInvitations}
      />
    </div>
  );
}