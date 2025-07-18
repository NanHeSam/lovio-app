'use client';

import { SignIn } from '@clerk/nextjs';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

function SignInWithInvitation() {
  const searchParams = useSearchParams();
  const invitation = searchParams.get('invitation');
  
  const redirectUrl = invitation ? `/invite/${invitation}` : '/dashboard';
  
  return (
    <SignIn 
      forceRedirectUrl={redirectUrl}
    />
  );
}

export default function Page() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <Suspense fallback={<div>Loading...</div>}>
        <SignInWithInvitation />
      </Suspense>
    </div>
  );
}