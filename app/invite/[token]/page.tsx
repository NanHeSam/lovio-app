import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { getInvitationByToken, acceptInvitation } from '@/lib/db/queries';
import { InvitationAcceptanceForm } from './components/InvitationAcceptanceForm';

interface InvitePageProps {
  params: {
    token: string;
  };
}

export default async function InvitePage({ params }: InvitePageProps) {
  const { userId } = await auth();
  
  if (!userId) {
    // Redirect to sign in with the invitation token as a parameter
    redirect(`/sign-in?invitation=${params.token}`);
  }

  // Get the invitation details
  const invitation = await getInvitationByToken(params.token);

  if (!invitation) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Invalid Invitation</h1>
            <p className="text-gray-600 mb-6">
              This invitation link is invalid or has expired.
            </p>
            <a
              href="/dashboard"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Go to Dashboard
            </a>
          </div>
        </div>
      </div>
    );
  }

  // Check if invitation is expired
  if (new Date() > invitation.expiresAt) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Invitation Expired</h1>
            <p className="text-gray-600 mb-6">
              This invitation has expired. Please contact {invitation.inviter.fullName} for a new invitation.
            </p>
            <a
              href="/dashboard"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Go to Dashboard
            </a>
          </div>
        </div>
      </div>
    );
  }

  // Check if invitation is already processed
  if (invitation.status !== 'pending') {
    const statusMessage = invitation.status === 'accepted' 
      ? 'This invitation has already been accepted.'
      : 'This invitation is no longer available.';

    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Invitation Already Processed</h1>
            <p className="text-gray-600 mb-6">{statusMessage}</p>
            <a
              href="/dashboard"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Go to Dashboard
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-8">
        <InvitationAcceptanceForm
          invitation={invitation}
          userId={userId}
        />
      </div>
    </div>
  );
}