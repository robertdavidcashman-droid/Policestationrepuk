/**
 * Lightweight startup environment validation.
 *
 * Goals:
 *  - Surface missing/critical configuration EARLY (imported from
 *    `instrumentation.ts` register()), without breaking boot.
 *  - WARN (never crash) for optional/feature-flagged vars so a missing optional
 *    var does not take the site down.
 *  - FAIL FAST only for clearly-broken configuration, and only in a real
 *    production runtime — never during `next build` (where Vercel/CI may not
 *    expose every var) and never under test.
 *
 * This module is intentionally conservative: most of the app already degrades
 * gracefully when a var is absent (Supabase → disabled, Resend → logs instead
 * of sends, KV → file-only data). So the only hard failure we enforce is a
 * half-configured Supabase pair, which is a genuine misconfiguration.
 */
import { z } from 'zod';

const isProduction = process.env.NODE_ENV === 'production';
const isBuildPhase = process.env.NEXT_PHASE === 'phase-production-build';
const isTest = process.env.NODE_ENV === 'test' || !!process.env.VITEST;
// Only hard-fail in a genuine production server runtime.
const shouldFailFast = isProduction && !isBuildPhase && !isTest;

/** Treat empty env strings as unset so audit/shell can strip optional vars safely. */
function optionalNonEmptyString() {
  return z.preprocess(
    (val) => (typeof val === 'string' && val.trim() === '' ? undefined : val),
    z.string().min(1).optional(),
  );
}

function optionalUrl() {
  return z.preprocess(
    (val) => (typeof val === 'string' && val.trim() === '' ? undefined : val),
    z.string().url().optional(),
  );
}

/** Optional/recommended vars — schema documents shape; absence only warns. */
const envSchema = z.object({
  // Supabase (public) — optional, but if used both must be present.
  NEXT_PUBLIC_SUPABASE_URL: optionalUrl(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: optionalNonEmptyString(),
  // Upstash / Vercel KV — either pair enables KV-backed data.
  UPSTASH_REDIS_REST_URL: optionalUrl(),
  UPSTASH_REDIS_REST_TOKEN: optionalNonEmptyString(),
  KV_REST_API_URL: optionalUrl(),
  KV_REST_API_TOKEN: optionalNonEmptyString(),
  // Transactional email.
  RESEND_API_KEY: optionalNonEmptyString(),
  // Cron / privileged endpoint auth.
  CRON_SECRET: optionalNonEmptyString(),
  // Canonical site URL (has a safe default in lib/seo-layer/config).
  NEXT_PUBLIC_SITE_URL: optionalUrl(),
});

let validated = false;

export function validateEnv(): void {
  if (validated) return;
  validated = true;

  const parsed = envSchema.safeParse(process.env);
  const warnings: string[] = [];
  const errors: string[] = [];

  if (!parsed.success) {
    // Malformed values (e.g. a non-URL Supabase URL) are real misconfig.
    for (const issue of parsed.error.issues) {
      errors.push(`${issue.path.join('.')}: ${issue.message}`);
    }
  }

  const e = process.env;
  const has = (k: string) => !!e[k]?.trim();

  // Supabase: warn if absent, but fail fast if only one half is set.
  const supaUrl = has('NEXT_PUBLIC_SUPABASE_URL');
  const supaKey = has('NEXT_PUBLIC_SUPABASE_ANON_KEY');
  if (!supaUrl && !supaKey) {
    warnings.push('Supabase not configured (NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY) — Supabase-backed features are disabled.');
  } else if (supaUrl !== supaKey) {
    errors.push('Supabase is half-configured: set BOTH NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY, or neither.');
  }

  // KV / Upstash: warn if neither pair is present.
  const hasUpstash = has('UPSTASH_REDIS_REST_URL') && has('UPSTASH_REDIS_REST_TOKEN');
  const hasVercelKv = has('KV_REST_API_URL') && has('KV_REST_API_TOKEN');
  if (!hasUpstash && !hasVercelKv) {
    warnings.push('KV not configured (UPSTASH_REDIS_REST_* or KV_REST_API_*) — registered reps, profile overrides and admin features fall back to file data only.');
  }

  if (!has('RESEND_API_KEY')) {
    warnings.push('RESEND_API_KEY not set — transactional emails will be logged instead of sent.');
  }
  if (!has('CRON_SECRET')) {
    if (shouldFailFast) {
      errors.push('CRON_SECRET not set — scheduled/cron endpoints will reject all automation in production.');
    } else {
      warnings.push('CRON_SECRET not set — scheduled/cron endpoints are unauthenticated or disabled.');
    }
  }

  for (const w of warnings) console.warn(`[env] ${w}`);

  if (errors.length > 0) {
    const message = `[env] Invalid environment configuration:\n- ${errors.join('\n- ')}`;
    if (shouldFailFast) {
      throw new Error(message);
    }
    console.error(message);
  }
}

// Validate on import so simply importing this module early triggers the check.
validateEnv();
