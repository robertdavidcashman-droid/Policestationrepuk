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
