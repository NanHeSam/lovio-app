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

        // If user has no children and not on onboarding page, redirect to onboarding
        if (!hasChildren && !isOnOnboardingPage) {
          router.push('/onboarding');
        }
        
        // If user has children and is on onboarding page, redirect to dashboard
        if (hasChildren && isOnOnboardingPage) {
          router.push('/dashboard');
        }
      } catch (error) {
        console.error('Error checking onboarding status:', error);
      }
    };

    checkOnboardingStatus();
  }, [user, isLoaded, router, pathname]);

  return null; // This component only handles redirects
}