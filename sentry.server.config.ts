// This file configures the initialization of Sentry on the server.
// The config you add here will be used whenever the server handles a request.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  // Define how likely traces are sampled. Adjust this value in production, or use tracesSampler for greater control.
  tracesSampleRate: 1,

  // Adds request headers and IP for users, for more info visit:
  // https://docs.sentry.io/platforms/javascript/guides/nextjs/configuration/options/#sendDefaultPii
  sendDefaultPii: true,
});

import { generateText } from 'ai';
import { openai } from '@ai-sdk/openai';
// Your AI agent function
async function aiAgent(userQuery) {
  const result = await generateText({
    model: openai('gpt-4o'),
    prompt: userQuery,
    experimental_telemetry: {
      isEnabled: true,
      functionId: 'ai-agent-main',
    },
  });
  return result.text;
}
