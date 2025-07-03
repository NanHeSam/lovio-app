import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';

const isPublicRoute = createRouteMatcher([
  '/sign-in', 
  '/sign-up', 
  '/',
  '/monitoring',
  '/favicon.ico'
]);

export default clerkMiddleware(async (auth, req) => {
  const { userId } = await auth();

  // Skip redirect logic for API routes - they handle their own auth
  if (req.nextUrl.pathname.startsWith('/api/')) {
    return;
  }

  // If user is not signed in and trying to access protected route, redirect to sign-in
  if (!userId && !isPublicRoute(req)) {
    return (await auth()).redirectToSignIn({ returnBackUrl: req.url });
  }

  // For authenticated users, we'll handle onboarding checks client-side
  // since Edge Runtime doesn't support database connections
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
};
