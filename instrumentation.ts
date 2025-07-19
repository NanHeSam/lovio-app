import { registerOTel } from '@vercel/otel';
import { AISDKExporter } from 'langsmith/vercel';
import { Client } from 'langsmith';
import * as Sentry from '@sentry/nextjs';

export async function register() {
  // Create LangSmith client with proper API key configuration
  const langsmithClient = new Client({
    apiKey: process.env.LANGCHAIN_API_KEY || process.env.LANGSMITH_API_KEY,
    batchSizeBytesLimit: 1024, // Smaller batches for serverless
  });

  // Initialize OpenTelemetry with properly configured AISDKExporter
  registerOTel({
    serviceName: 'lovio-app-ai-agent',
    traceExporter: new AISDKExporter({
      client: langsmithClient,
      debug: true,
      projectName: process.env.LANGCHAIN_PROJECT,
    }),
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