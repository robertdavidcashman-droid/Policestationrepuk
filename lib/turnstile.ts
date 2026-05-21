/**
 * Cloudflare Turnstile (free CAPTCHA, no consent banner) server-side
 * verification helper.
 *
 * To enable:
 *   1) Create a site at https://dash.cloudflare.com/?to=/:account/turnstile
 *   2) Set env vars:
 *        TURNSTILE_SITE_KEY     (public, exposed via NEXT_PUBLIC_TURNSTILE_SITE_KEY)
 *        TURNSTILE_SECRET       (server-only)
 *        ENABLE_TURNSTILE=1     (master switch)
 *
 * If `ENABLE_TURNSTILE` is unset or `TURNSTILE_SECRET` is missing, this module
 * silently returns `{ ok: true }` so the site keeps working in local dev and
 * preview deploys that don't have keys provisioned.
 *
 * Verification follows the official spec:
 *   https://developers.cloudflare.com/turnstile/get-started/server-side-validation/
 */

const VERIFY_ENDPOINT =
  'https://challenges.cloudflare.com/turnstile/v0/siteverify';

export interface TurnstileResult {
  ok: boolean;
  /** `disabled` means Turnstile is not configured; treat as passthrough. */
  reason?: 'missing-token' | 'failed' | 'disabled' | 'network-error';
  errorCodes?: string[];
}

export function turnstileEnabled(): boolean {
  return (
    (process.env.ENABLE_TURNSTILE === '1' ||
      process.env.ENABLE_TURNSTILE === 'true') &&
    Boolean(process.env.TURNSTILE_SECRET)
  );
}

export function turnstileSiteKey(): string | null {
  return (
    process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ||
    process.env.TURNSTILE_SITE_KEY ||
    null
  );
}

/**
 * Verify a Turnstile token from a public form submission.
 *
 * @param token   The `cf-turnstile-response` field value posted from the form.
 * @param remoteIp Optional originating IP for Cloudflare's checks.
 */
export async function verifyTurnstile(
  token: string | undefined | null,
  remoteIp?: string | null,
): Promise<TurnstileResult> {
  if (!turnstileEnabled()) {
    return { ok: true, reason: 'disabled' };
  }
  if (!token || typeof token !== 'string') {
    return { ok: false, reason: 'missing-token' };
  }

  const body = new URLSearchParams();
  body.set('secret', process.env.TURNSTILE_SECRET as string);
  body.set('response', token);
  if (remoteIp && remoteIp !== 'unknown') body.set('remoteip', remoteIp);

  try {
    const res = await fetch(VERIFY_ENDPOINT, {
      method: 'POST',
      body,
    });
    if (!res.ok) {
      return { ok: false, reason: 'failed', errorCodes: [`http-${res.status}`] };
    }
    const json = (await res.json()) as {
      success: boolean;
      'error-codes'?: string[];
    };
    if (json.success) return { ok: true };
    return {
      ok: false,
      reason: 'failed',
      errorCodes: json['error-codes'] || [],
    };
  } catch (err) {
    console.warn('[turnstile] verification network error:', err);
    return { ok: false, reason: 'network-error' };
  }
}
