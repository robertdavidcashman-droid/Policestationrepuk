// Sentry server-side init. No-op unless a DSN is configured via
// SENTRY_DSN (server) or NEXT_PUBLIC_SENTRY_DSN. We never hardcode a DSN.
import * as Sentry from '@sentry/nextjs';

const dsn = process.env.SENTRY_DSN?.trim() || process.env.NEXT_PUBLIC_SENTRY_DSN?.trim();

if (dsn) {
  Sentry.init({
    dsn,
    // Low trace sample to keep volume/cost down; override per-env if needed.
    tracesSampleRate: Number(process.env.SENTRY_TRACES_SAMPLE_RATE) || 0.05,
    enabled: process.env.NODE_ENV === 'production',
    environment: process.env.VERCEL_ENV || process.env.NODE_ENV,
  });
}
