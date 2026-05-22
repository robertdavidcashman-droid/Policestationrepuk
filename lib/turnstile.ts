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
 *   The allowed-hostnames list on the Cloudflare Turnstile dashboard MUST
 *   include every production domain plus `localhost`. The current production
 *   list should be:
 *     - policestationrepuk.org
 *     - www.policestationrepuk.org
 *     - policestationrepuk.com
 *     - www.policestationrepuk.com
 *     - localhost
 *
 * If `ENABLE_TURNSTILE` is unset or `TURNSTILE_SECRET` is missing, this module
 * silently returns `{ ok: true, reason: 'disabled' }` so the site keeps
 * working in local dev and preview deploys that don't have keys provisioned.
 *
 * Verification follows the official spec:
 *   https://developers.cloudflare.com/turnstile/get-started/server-side-validation/
 */

const VERIFY_ENDPOINT =
  'https://challenges.cloudflare.com/turnstile/v0/siteverify';

/** Stable machine-readable codes returned by `verifyTurnstile`. */
export type TurnstileErrorCode =
  | 'TURNSTILE_OK'
  /** Turnstile not configured server-side — treat as passthrough. */
  | 'TURNSTILE_NOT_CONFIGURED'
  /** Client sent an empty / non-string token (most likely widget didn't load). */
  | 'TURNSTILE_MISSING'
  /** Cloudflare reported `timeout-or-duplicate` — token expired or already used. */
  | 'TURNSTILE_EXPIRED'
  /** Cloudflare returned `success:false` for any other reason. */
  | 'TURNSTILE_FAILED'
  /** Could not reach Cloudflare at all. */
  | 'TURNSTILE_NETWORK_ERROR';

export interface TurnstileResult {
  ok: boolean;
  /** Stable machine-readable code; safe to send to clients. */
  code: TurnstileErrorCode;
  /** Human-readable message — safe to surface to the user. */
  message: string;
  /** Raw Cloudflare error codes when applicable (admin diagnostic only). */
  errorCodes?: string[];
}

const EXPIRY_CODES = new Set([
  'timeout-or-duplicate',
  'expired-token',
  'invalid-input-token-stale',
]);

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
    return {
      ok: true,
      code: 'TURNSTILE_NOT_CONFIGURED',
      message: 'Bot-protection check is not configured for this environment.',
    };
  }
  if (!token || typeof token !== 'string') {
    return {
      ok: false,
      code: 'TURNSTILE_MISSING',
      message:
        'Please complete the bot-protection check before continuing. If the box did not appear, refresh the page and try again.',
    };
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
      console.warn('[turnstile] siteverify HTTP', res.status);
      return {
        ok: false,
        code: 'TURNSTILE_NETWORK_ERROR',
        message:
          'Bot-protection service temporarily unavailable. Please try again in a moment.',
        errorCodes: [`http-${res.status}`],
      };
    }
    const json = (await res.json()) as {
      success: boolean;
      'error-codes'?: string[];
    };
    if (json.success) {
      return { ok: true, code: 'TURNSTILE_OK', message: 'Bot check complete.' };
    }
    const codes = json['error-codes'] || [];
    if (codes.some((c) => EXPIRY_CODES.has(c))) {
      return {
        ok: false,
        code: 'TURNSTILE_EXPIRED',
        message:
          'The bot-protection check has expired. Please tick the box again and resubmit.',
        errorCodes: codes,
      };
    }
    console.warn('[turnstile] siteverify rejected token:', codes.join(','));
    return {
      ok: false,
      code: 'TURNSTILE_FAILED',
      message:
        'Bot-protection check failed. Please refresh the page and try again.',
      errorCodes: codes,
    };
  } catch (err) {
    console.warn('[turnstile] verification network error:', err);
    return {
      ok: false,
      code: 'TURNSTILE_NETWORK_ERROR',
      message:
        'Could not reach the bot-protection service. Please check your connection and try again.',
    };
  }
}
