// Shared Sentry configuration for all environments
// This reduces duplication across client, server, and edge configs

export const getSentryConfig = (platform: 'client' | 'server' | 'edge') => ({
  dsn: "https://e657c76cc5328bdebb8bed6d8a5c4bea@o4509569243873280.ingest.us.sentry.io/4509571450994688",

  // Environment configuration - this separates your events in Sentry
  environment: process.env.NODE_ENV || 'development',

  // Define how likely traces are sampled. Adjust this value in production, or use tracesSampler for greater control.
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1,

  // Setting this option to true will print useful information to the console while you're setting up Sentry.
  debug: false,

  // Add environment tags for better filtering
  initialScope: {
    tags: {
      environment: process.env.NODE_ENV || 'development',
      version: process.env.npm_package_version || 'unknown',
      platform,
    },
  },

  // Filter out errors from local development
  beforeSend(event: any, hint: any) {
    // Don't send errors from localhost/development
    if (process.env.NODE_ENV === 'development') {
      return null; // This prevents the error from being sent to Sentry
    }
    
    return event;
  },
});

// Client-specific additions
export const getClientConfig = () => ({
  ...getSentryConfig('client'),
  
  // Define how likely Replay events are sampled.
  // This sets the sample rate to be 10%. You may want this to be 100% while
  // in development and sample at a lower rate in production
  replaysSessionSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

  // Define how likely Replay events are sampled when an error occurs.
  replaysOnErrorSampleRate: 1.0,
}); 
