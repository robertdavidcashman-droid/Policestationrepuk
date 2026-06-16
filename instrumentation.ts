import * as Sentry from '@sentry/nextjs';

// Next.js server instrumentation hook. Runs once when a server runtime boots.
export async function register() {
  // Validate critical environment configuration early (warns by default;
  // fails fast only on clear misconfiguration in production runtime).
  await import('@/lib/env');

  if (process.env.NEXT_RUNTIME === 'nodejs') {
    await import('./sentry.server.config');
  }
  if (process.env.NEXT_RUNTIME === 'edge') {
    await import('./sentry.edge.config');
  }
}

// Forwards nested React Server Component errors to Sentry. No-op when Sentry
// is not initialised (no DSN configured).
export const onRequestError = Sentry.captureRequestError;
