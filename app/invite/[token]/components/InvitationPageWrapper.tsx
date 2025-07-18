'use client';

import { useEffect, useState } from 'react';
import { useUser } from '@clerk/nextjs';
import { InvitationWithDetails } from '@/lib/db/types';
import { InvitationAcceptanceForm } from './InvitationAcceptanceForm';

interface InvitationPageWrapperProps {
  invitation: InvitationWithDetails;
  userId: string;
}

export function InvitationPageWrapper({ invitation, userId }: InvitationPageWrapperProps) {
  const { user, isLoaded } = useUser();
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    if (!isLoaded || !user) return;

    const initializeUser = async () => {
      try {
        // Initialize user in database if needed (for new users coming from invitations)
        await fetch('/api/user/initialize', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        });
        setIsInitialized(true);
      } catch (error) {
        console.error('Error initializing user:', error);
        // Still allow the user to proceed even if initialization fails
        setIsInitialized(true);
      }
    };

    initializeUser();
  }, [user, isLoaded]);

  if (!isInitialized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Setting up your account...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <InvitationAcceptanceForm
      invitation={invitation}
      userId={userId}
    />
  );
}