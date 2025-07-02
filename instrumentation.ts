import { registerOTel } from '@vercel/otel';
import { AISDKExporter } from 'langsmith/vercel';
import * as Sentry from '@sentry/nextjs';

export async function register() {
  // Initialize OpenTelemetry
  registerOTel({
    serviceName: 'lovio-app-ai-agent',
    traceExporter: new AISDKExporter(),
  });

  // Initialize Sentry based on runtime environment
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    await import('./sentry.server.config');
  }

  if (process.env.NEXT_RUNTIME === 'edge') {
    await import('./sentry.edge.config');
  }

  // Note: Database migrations are now run at build time via npm scripts
  // This ensures the database is ready before deployment
}

export const onRequestError = Sentry.captureRequestError;