export interface PipelineEnvValidation {
  ok: boolean;
  errors: string[];
}

function isProductionRuntime(): boolean {
  return (
    process.env.NODE_ENV === 'production' &&
    process.env.NEXT_PHASE !== 'phase-production-build' &&
    process.env.VITEST !== 'true'
  );
}

function hasKvCreds(): boolean {
  const url =
    process.env.UPSTASH_REDIS_REST_URL?.trim() || process.env.KV_REST_API_URL?.trim() || '';
  const token =
    process.env.UPSTASH_REDIS_REST_TOKEN?.trim() || process.env.KV_REST_API_TOKEN?.trim() || '';
  return Boolean(url && token);
}

/** Validate Buffer scheduler cron prerequisites. */
export function validateBufferEnv(): PipelineEnvValidation {
  const errors: string[] = [];
  if (!isProductionRuntime()) {
    return { ok: true, errors };
  }

  if (!process.env.BUFFER_API_KEY?.trim()) {
    errors.push('BUFFER_API_KEY missing');
  }
  const twitter = process.env.BUFFER_CHANNEL_TWITTER_ID?.trim();
  const linkedin = process.env.BUFFER_CHANNEL_LINKEDIN_ID?.trim();
  const google = process.env.BUFFER_CHANNEL_GOOGLEBUSINESS_ID?.trim();
  if (!twitter || !linkedin || !google) {
    errors.push(
      'BUFFER_CHANNEL_TWITTER_ID, BUFFER_CHANNEL_LINKEDIN_ID, and BUFFER_CHANNEL_GOOGLEBUSINESS_ID must all be set in production',
    );
  }
  if (!hasKvCreds()) {
    errors.push('KV credentials missing (required for scheduler state)');
  }

  return { ok: errors.length === 0, errors };
}

/** Validate custody discovery cron prerequisites. */
export function validateCustodyEnv(): PipelineEnvValidation {
  const errors: string[] = [];
  if (!isProductionRuntime()) {
    return { ok: true, errors };
  }

  if (!process.env.SERPER_API_KEY?.trim()) {
    errors.push('SERPER_API_KEY missing (custody search discovery disabled)');
  }
  if (!hasKvCreds()) {
    errors.push('KV credentials missing (required for custody findings)');
  }

  return { ok: errors.length === 0, errors };
}

/** Combined automation env check for ops scripts (always strict, not test-skipped). */
export function validateAutomationEnv(): PipelineEnvValidation {
  const errors: string[] = [];

  if (!process.env.CRON_SECRET?.trim()) {
    errors.push('CRON_SECRET missing');
  }
  if (!process.env.RESEND_API_KEY?.trim()) {
    errors.push('RESEND_API_KEY missing');
  }
  if (!hasKvCreds()) {
    errors.push('KV credentials missing');
  }
  if (!process.env.BUFFER_API_KEY?.trim()) {
    errors.push('BUFFER_API_KEY missing');
  }
  const twitter = process.env.BUFFER_CHANNEL_TWITTER_ID?.trim();
  const linkedin = process.env.BUFFER_CHANNEL_LINKEDIN_ID?.trim();
  const google = process.env.BUFFER_CHANNEL_GOOGLEBUSINESS_ID?.trim();
  if (!twitter || !linkedin || !google) {
    errors.push('BUFFER_CHANNEL_*_ID missing (all three required)');
  }
  if (!process.env.SERPER_API_KEY?.trim()) {
    errors.push('SERPER_API_KEY missing');
  }
  if (!process.env.DECISION_TOKEN_SECRET?.trim()) {
    errors.push('DECISION_TOKEN_SECRET missing');
  }
  if (!process.env.FIRM_OUTREACH_WEBHOOK_SECRET?.trim()) {
    errors.push('FIRM_OUTREACH_WEBHOOK_SECRET missing');
  }

  return { ok: errors.length === 0, errors };
}

/** Safe test-environment guard — rejects production hosts/credentials in local gates. */
export function validateSafeTestEnv(): PipelineEnvValidation {
  const errors: string[] = [];
  const forbiddenHosts = ['policestationrepuk.org', 'www.policestationrepuk.org'];
  const baseUrl = (
    process.env.AUDIT_BASE_URL ||
    process.env.PREVIEW_BASE_URL ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    ''
  ).toLowerCase();

  for (const host of forbiddenHosts) {
    if (baseUrl.includes(host)) {
      errors.push(`Unsafe test base URL references production host: ${host}`);
    }
  }

  if (process.env.FIRM_OUTREACH_DRY_RUN !== '1' && process.env.FIRM_OUTREACH_DRY_RUN !== 'true') {
    errors.push('FIRM_OUTREACH_DRY_RUN must be 1 during local/predeploy gates');
  }

  return { ok: errors.length === 0, errors };
}
