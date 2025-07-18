'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useUser } from '@clerk/nextjs';

export default function OnboardingRedirect() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!isLoaded || !user) return;

    const checkOnboardingStatus = async () => {
      try {
        const response = await fetch('/api/user/has-children');
        if (!response.ok) return;

        const { hasChildren } = await response.json();
        
        const isOnOnboardingPage = pathname === '/onboarding';
        const isOnInvitationPage = pathname.startsWith('/invite/');

        // Skip redirect logic if user is on an invitation page
        if (isOnInvitationPage) {
          return;
        }

        // Add a small delay to avoid racing conditions with user initialization
        setTimeout(() => {
          // If user has no children and not on onboarding page, redirect to onboarding
          if (!hasChildren && !isOnOnboardingPage) {
            router.push('/onboarding');
          }
          
          // If user has children and is on onboarding page, redirect to dashboard
          if (hasChildren && isOnOnboardingPage) {
            router.push('/dashboard');
          }
        }, 100);
      } catch (error) {
        console.error('Error checking onboarding status:', error);
      }
    };

    // Add a small delay before checking to allow user initialization to complete
    setTimeout(() => {
      checkOnboardingStatus();
    }, 200);
  }, [user, isLoaded, router, pathname]);

  return null; // This component only handles redirects
}