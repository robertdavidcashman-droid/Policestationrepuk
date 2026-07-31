export interface OutreachEnvValidation {
  ok: boolean;
  errors: string[];
  warnings?: string[];
  dryRun: boolean;
  sendingEnabled: boolean;
}

function hasKvCreds(): boolean {
  const url =
    process.env.UPSTASH_REDIS_REST_URL?.trim() || process.env.KV_REST_API_URL?.trim() || '';
  const token =
    process.env.UPSTASH_REDIS_REST_TOKEN?.trim() || process.env.KV_REST_API_TOKEN?.trim() || '';
  return Boolean(url && token);
}

function truthy(v: string | undefined): boolean {
  const t = v?.trim().toLowerCase();
  return t === '1' || t === 'true' || t === 'yes' || t === 'on';
}

function falsy(v: string | undefined): boolean {
  const t = v?.trim().toLowerCase();
  return t === '0' || t === 'false' || t === 'no' || t === 'off';
}

function parsePositiveInt(raw: string | undefined, fallback: number): number {
  if (raw == null || raw.trim() === '') return fallback;
  const n = Number(raw);
  return Number.isFinite(n) && n >= 0 ? Math.floor(n) : NaN;
}

function looksLikeEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function extractEmailFromFromHeader(from: string): string | null {
  const angle = from.match(/<([^>]+)>/);
  const addr = (angle?.[1] ?? from).trim();
  return looksLikeEmail(addr) ? addr.toLowerCase() : null;
}

/**
 * Loud fail helper for cron routes — lists missing production config.
 * FROM/DIGEST are warnings only: runtime already falls back to
 * `PoliceStationRepUK <noreply@policestationrepuk.org>` and a digest default.
 *
 * Live sending fails closed when critical config is invalid.
 */
export function validateOutreachEnv(opts?: {
  requireCronSecret?: boolean;
  requireWebhookSecret?: boolean;
  /** When true, live sending without dry-run requires stricter checks. */
  forLiveSend?: boolean;
}): OutreachEnvValidation {
  const errors: string[] = [];
  const warnings: string[] = [];

  const dryRun = truthy(process.env.FIRM_OUTREACH_DRY_RUN);
  const sendingEnabled =
    !falsy(process.env.FIRM_OUTREACH_ENABLED) &&
    !falsy(process.env.FIRM_OUTREACH_SEND_ENABLED) &&
    !truthy(process.env.FIRM_OUTREACH_PAUSED);

  if (!process.env.RESEND_API_KEY?.trim()) {
    errors.push('RESEND_API_KEY missing');
  }
  if (!hasKvCreds()) {
    errors.push('UPSTASH_REDIS_REST_URL/TOKEN (or KV_REST_API_*) missing');
  }
  if (opts?.requireCronSecret && !process.env.CRON_SECRET?.trim()) {
    errors.push('CRON_SECRET missing');
  }
  if (
    (opts?.requireWebhookSecret || opts?.forLiveSend) &&
    !process.env.RESEND_WEBHOOK_SECRET?.trim() &&
    !process.env.FIRM_OUTREACH_WEBHOOK_SECRET?.trim()
  ) {
    warnings.push('RESEND_WEBHOOK_SECRET missing — delivery/bounce webhooks cannot be verified');
  }

  const digest =
    process.env.FIRM_OUTREACH_DIGEST_EMAIL?.trim() ||
    process.env.BUFFER_SCHEDULER_NOTIFY_EMAIL?.trim() ||
    process.env.OWNER_EMAIL?.trim();
  if (!digest) {
    warnings.push(
      'FIRM_OUTREACH_DIGEST_EMAIL unset — using code fallback for operator notifications',
    );
  } else if (!looksLikeEmail(digest)) {
    errors.push('FIRM_OUTREACH_DIGEST_EMAIL is not a valid email address');
  }

  const from = process.env.FIRM_OUTREACH_FROM_EMAIL?.trim();
  if (!from) {
    warnings.push(
      'FIRM_OUTREACH_FROM_EMAIL unset — using PoliceStationRepUK <noreply@policestationrepuk.org>',
    );
  } else if (!extractEmailFromFromHeader(from)) {
    errors.push('FIRM_OUTREACH_FROM_EMAIL is malformed');
  }

  const psaFrom = process.env.FIRM_OUTREACH_PSA_FROM_EMAIL?.trim();
  if (!psaFrom) {
    warnings.push(
      'FIRM_OUTREACH_PSA_FROM_EMAIL unset — PSA prefers noreply@policestationagent.com and falls back to verified RepUK domain until that domain is verified on Resend',
    );
  } else if (!extractEmailFromFromHeader(psaFrom)) {
    errors.push('FIRM_OUTREACH_PSA_FROM_EMAIL is malformed');
  }

  const dailyCap = parsePositiveInt(process.env.FIRM_OUTREACH_DAILY_CAP, 150);
  if (!Number.isFinite(dailyCap)) {
    errors.push('FIRM_OUTREACH_DAILY_CAP must be a non-negative integer');
  }

  const hourlyCap = parsePositiveInt(process.env.FIRM_OUTREACH_HOURLY_CAP, 0);
  if (!Number.isFinite(hourlyCap)) {
    errors.push('FIRM_OUTREACH_HOURLY_CAP must be a non-negative integer');
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (siteUrl) {
    try {
      // eslint-disable-next-line no-new
      new URL(siteUrl);
    } catch {
      errors.push('NEXT_PUBLIC_SITE_URL is not a valid URL');
    }
  }

  if (opts?.forLiveSend && sendingEnabled && !dryRun && errors.length > 0) {
    // already failing closed via ok=false
  }

  if (sendingEnabled && !dryRun && !process.env.RESEND_API_KEY?.trim()) {
    errors.push('live sending enabled but RESEND_API_KEY missing');
  }

  return { ok: errors.length === 0, errors, warnings, dryRun, sendingEnabled };
}
