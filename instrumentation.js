import { registerOTel } from '@vercel/otel';
import { AISDKExporter } from 'langsmith/vercel';

export function register() {
  registerOTel({
    serviceName: 'lovio-app-ai-agent',
    traceExporter: new AISDKExporter(),
  });
}