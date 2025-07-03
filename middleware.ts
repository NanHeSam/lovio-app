import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { UserPublicMetadata } from '@/types/clerk';

const isOnboardingRoute = createRouteMatcher(['/onboarding']);
const isPublicRoute = createRouteMatcher(['/sign-in', '/sign-up', '/']);

export default clerkMiddleware(async (auth, req) => {
  const { userId, sessionClaims } = await auth();

  // If user is not signed in and trying to access protected route, redirect to sign-in
  if (!userId && !isPublicRoute(req)) {
    return (await auth()).redirectToSignIn({ returnBackUrl: req.url });
  }

  // If user is signed in, check onboarding status
  if (userId) {
    const isOnboardingComplete = (sessionClaims?.metadata as UserPublicMetadata)?.onboardingComplete === true;
    
    // If onboarding is not complete and user is not on onboarding page, redirect to onboarding
    if (!isOnboardingComplete && !isOnboardingRoute(req)) {
      const onboardingUrl = new URL('/onboarding', req.url);
      return NextResponse.redirect(onboardingUrl);
    }
    
    // If onboarding is complete and user is on onboarding page, redirect to dashboard
    if (isOnboardingComplete && isOnboardingRoute(req)) {
      const dashboardUrl = new URL('/dashboard', req.url);
      return NextResponse.redirect(dashboardUrl);
    }
  }
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
};