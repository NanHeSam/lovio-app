// This file configures the initialization of Sentry on the client.
// The added config here will be used whenever a users loads a page in their browser.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs";
import { getClientConfig } from "./lib/sentry-config";

const config = {
  ...getClientConfig(),
  // Add client-specific integrations
  integrations: [
    Sentry.replayIntegration(),
  ],
};

Sentry.init(config);

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
