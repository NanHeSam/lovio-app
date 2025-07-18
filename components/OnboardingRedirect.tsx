'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useUser } from '@clerk/nextjs';

interface OnboardingState {
  isInitialized: boolean;
  hasChildren: boolean | null;
  isLoading: boolean;
  error: string | null;
  retryCount: number;
}

export default function OnboardingRedirect() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const pathname = usePathname();
  
  const [state, setState] = useState<OnboardingState>({
    isInitialized: false,
    hasChildren: null,
    isLoading: false,
    error: null,
    retryCount: 0
  });

  // Calculate delay with exponential backoff
  const getRetryDelay = useCallback((retryCount: number) => {
    return Math.min(1000 * Math.pow(2, retryCount), 10000); // Max 10 seconds
  }, []);

  const checkOnboardingStatus = useCallback(async () => {
    if (!isLoaded || !user) return;

    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const response = await fetch('/api/user/has-children', {
        headers: {
          'Cache-Control': 'no-cache',
        },
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const { hasChildren } = await response.json();
      
      setState(prev => ({
        ...prev,
        isInitialized: true,
        hasChildren,
        isLoading: false,
        error: null,
        retryCount: 0
      }));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('Error checking onboarding status:', errorMessage);
      
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: errorMessage,
        retryCount: prev.retryCount + 1
      }));
    }
  }, [isLoaded, user]);

  // Initialize user data when user is loaded
  useEffect(() => {
    if (isLoaded && user && !state.isInitialized && !state.isLoading) {
      checkOnboardingStatus();
    }
  }, [isLoaded, user, state.isInitialized, state.isLoading, checkOnboardingStatus]);

  // Retry logic with exponential backoff
  useEffect(() => {
    if (state.error && state.retryCount < 3) {
      const delay = getRetryDelay(state.retryCount);
      const timeoutId = setTimeout(() => {
        checkOnboardingStatus();
      }, delay);

      return () => clearTimeout(timeoutId);
    }
  }, [state.error, state.retryCount, getRetryDelay, checkOnboardingStatus]);

  // Handle redirects once data is loaded
  useEffect(() => {
    if (!state.isInitialized || state.hasChildren === null) return;

    const isOnOnboardingPage = pathname === '/onboarding';
    const isOnInvitationPage = pathname.startsWith('/invite/');

    // Skip redirect logic if user is on an invitation page
    if (isOnInvitationPage) {
      return;
    }

    // Perform redirects based on user state
    if (!state.hasChildren && !isOnOnboardingPage) {
      router.push('/onboarding');
    } else if (state.hasChildren && isOnOnboardingPage) {
      router.push('/dashboard');
    }
  }, [state.isInitialized, state.hasChildren, pathname, router]);

  return null; // This component only handles redirects
}