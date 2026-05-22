import crypto from 'crypto';
import { getKV } from '@/lib/kv';
import type { ApplicantCategory } from '@/lib/rep-status';

/**
 * One-shot HMAC-signed tokens for one-click admin Approve / Decline buttons in
 * the held-for-review email.
 *
 * Why we don't just use a JWT library:
 *   - We control both ends, so a tiny Base64URL(payload).Base64URL(HMAC) form
 *     keeps the surface small, dependency-free, and trivially auditable.
 *   - We pair the signature check with a KV row keyed by `jti` so the token
 *     can ONLY be used once (delete-on-consume) and can be revoked manually
 *     by deleting the row.
 *
 * Security properties:
 *   - Signature is over the FULL payload (email + action + category + exp +
 *     jti). Tampering to switch the rep, the action or the expiry breaks the
 *     signature.
 *   - One-shot: KV record is deleted on consume so a forwarded link cannot
 *     replay.
 *   - Time-bound: 7-day default TTL.
 *   - GET-prefetch safe at the FEATURE level because the action only happens
 *     on a POST (consume), not on the GET preview (peek). See the route file
 *     for that wiring.
 */

export type AdminDecisionAction = 'approve' | 'decline';

export interface AdminDecisionPayload {
  email: string;
  action: AdminDecisionAction;
  /** Applicant category at registration time — controls which verified-* status to assign on approve. */
  category: ApplicantCategory;
  /** Unix epoch seconds. */
  exp: number;
  /** Random unique id; also used as the KV record key suffix. */
  jti: string;
}

/** What we store in KV against `admin-decision-token:{jti}`. Used for one-shot semantics. */
export interface AdminDecisionKVRecord {
  email: string;
  action: AdminDecisionAction;
  category: ApplicantCategory;
  createdAt: string;
  /** Mirrors the payload exp so KV expiry and signature expiry match. */
  exp: number;
}

const TOKEN_KV_PREFIX = 'admin-decision-token:';
export const DEFAULT_TOKEN_TTL_SECONDS = 7 * 24 * 60 * 60; // 7 days

function getSecret(): string {
  const raw = process.env.ADMIN_DECISION_TOKEN_SECRET;
  if (!raw || raw.trim().length < 16) {
    throw new Error(
      'ADMIN_DECISION_TOKEN_SECRET is not configured (need at least 16 chars). ' +
        'Set it on Vercel for both Production and Preview before using admin email decision links.',
    );
  }
  return raw.trim();
}

function base64UrlEncode(input: Buffer | string): string {
  const buf = typeof input === 'string' ? Buffer.from(input, 'utf8') : input;
  return buf
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '');
}

function base64UrlDecodeToString(input: string): string {
  const padded = input.replace(/-/g, '+').replace(/_/g, '/');
  const padLen = (4 - (padded.length % 4)) % 4;
  return Buffer.from(padded + '='.repeat(padLen), 'base64').toString('utf8');
}

function sign(payloadB64: string, secret: string): string {
  return base64UrlEncode(
    crypto.createHmac('sha256', secret).update(payloadB64).digest(),
  );
}

function timingSafeEqualStrings(a: string, b: string): boolean {
  const ab = Buffer.from(a, 'utf8');
  const bb = Buffer.from(b, 'utf8');
  if (ab.length !== bb.length) return false;
  return crypto.timingSafeEqual(ab, bb);
}

function tokenKey(jti: string): string {
  return `${TOKEN_KV_PREFIX}${jti}`;
}

export function buildToken(payload: AdminDecisionPayload): string {
  const secret = getSecret();
  const payloadB64 = base64UrlEncode(JSON.stringify(payload));
  const sig = sign(payloadB64, secret);
  return `${payloadB64}.${sig}`;
}

/**
 * Validate the signature + expiry without consuming the KV record.
 * Returns the payload on success, or `null` (with `error` set on the result
 * object via the second tuple slot) if the token is malformed, signed wrong
 * or expired. Never throws.
 */
export function verifyTokenSignature(
  token: string,
): { ok: true; payload: AdminDecisionPayload } | { ok: false; error: string } {
  if (typeof token !== 'string' || token.length === 0) {
    return { ok: false, error: 'Missing token' };
  }
  const parts = token.split('.');
  if (parts.length !== 2) return { ok: false, error: 'Malformed token' };

  let secret: string;
  try {
    secret = getSecret();
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Token secret not configured',
    };
  }

  const [payloadB64, sig] = parts;
  const expectedSig = sign(payloadB64, secret);
  if (!timingSafeEqualStrings(sig, expectedSig)) {
    return { ok: false, error: 'Invalid signature' };
  }

  let payload: AdminDecisionPayload;
  try {
    payload = JSON.parse(base64UrlDecodeToString(payloadB64)) as AdminDecisionPayload;
  } catch {
    return { ok: false, error: 'Malformed payload' };
  }

  if (
    typeof payload !== 'object' ||
    payload === null ||
    typeof payload.email !== 'string' ||
    typeof payload.jti !== 'string' ||
    typeof payload.exp !== 'number' ||
    (payload.action !== 'approve' && payload.action !== 'decline') ||
    typeof payload.category !== 'string'
  ) {
    return { ok: false, error: 'Malformed payload' };
  }

  const nowSec = Math.floor(Date.now() / 1000);
  if (payload.exp < nowSec) {
    return { ok: false, error: 'Token expired' };
  }

  return { ok: true, payload };
}

/**
 * Sign a fresh token AND write the matching one-shot KV record. Use this when
 * generating buttons for the held-for-review email so the token is bound to a
 * KV row with the same expiry.
 */
export async function issueDecisionToken(opts: {
  email: string;
  action: AdminDecisionAction;
  category: ApplicantCategory;
  ttlSeconds?: number;
}): Promise<{ token: string; jti: string; exp: number }> {
  const ttl = Math.max(60, Math.floor(opts.ttlSeconds ?? DEFAULT_TOKEN_TTL_SECONDS));
  const exp = Math.floor(Date.now() / 1000) + ttl;
  const jti = crypto.randomUUID();
  const payload: AdminDecisionPayload = {
    email: opts.email.toLowerCase(),
    action: opts.action,
    category: opts.category,
    exp,
    jti,
  };
  const token = buildToken(payload);

  const kv = getKV();
  if (!kv) {
    throw new Error('KV not configured — cannot issue decision token');
  }
  const record: AdminDecisionKVRecord = {
    email: payload.email,
    action: opts.action,
    category: opts.category,
    createdAt: new Date().toISOString(),
    exp,
  };
  await kv.set(tokenKey(jti), record, { ex: ttl });

  return { token, jti, exp };
}

/**
 * Verify signature/expiry AND that the KV one-shot row still exists. Does NOT
 * delete the row — use this on the interstitial GET preview so the link is
 * safe to prefetch.
 */
export async function peekDecisionToken(token: string): Promise<
  | { ok: true; payload: AdminDecisionPayload; record: AdminDecisionKVRecord }
  | { ok: false; status: 400 | 401 | 410; error: string }
> {
  const verify = verifyTokenSignature(token);
  if (!verify.ok) {
    return {
      ok: false,
      status: verify.error === 'Token expired' ? 410 : 401,
      error: verify.error,
    };
  }
  const kv = getKV();
  if (!kv) return { ok: false, status: 400, error: 'Storage not configured' };
  const record = await kv.get<AdminDecisionKVRecord>(tokenKey(verify.payload.jti));
  if (!record) {
    return {
      ok: false,
      status: 410,
      error: 'This decision link has already been used or has expired.',
    };
  }
  // Defence in depth: if the KV record disagrees with the signed payload,
  // refuse — implies tampering or env/secret rotation.
  if (
    record.email !== verify.payload.email ||
    record.action !== verify.payload.action
  ) {
    return { ok: false, status: 401, error: 'Token does not match its server record.' };
  }
  return { ok: true, payload: verify.payload, record };
}

/**
 * Verify + ATOMICALLY consume the token (delete the KV row). Used by the POST
 * confirm endpoint. Returns the payload on success so the caller can act.
 */
export async function consumeDecisionToken(token: string): Promise<
  | { ok: true; payload: AdminDecisionPayload }
  | { ok: false; status: 400 | 401 | 410; error: string }
> {
  const peek = await peekDecisionToken(token);
  if (!peek.ok) return peek;

  const kv = getKV();
  if (!kv) return { ok: false, status: 400, error: 'Storage not configured' };

  // `del` returns the number of keys removed. If 0, someone else consumed it
  // between peek and del — treat as already-consumed.
  const removed = await kv.del(tokenKey(peek.payload.jti));
  if (removed === 0) {
    return {
      ok: false,
      status: 410,
      error: 'This decision link has already been used.',
    };
  }
  return { ok: true, payload: peek.payload };
}

/** Manual revocation — useful if you ever need to invalidate an outstanding token. */
export async function revokeDecisionToken(jti: string): Promise<boolean> {
  const kv = getKV();
  if (!kv) return false;
  const removed = await kv.del(tokenKey(jti));
  return removed > 0;
}
