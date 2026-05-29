import crypto from 'crypto';
import { getKV } from '@/lib/kv';

/**
 * HMAC-signed tokens for one-click amend / delete buttons in legal directory
 * admin notification emails. Delete tokens are one-shot (KV consume); amend
 * tokens remain valid until expiry so you can edit from the email link repeatedly.
 */

export type LegalDirectoryAdminAction = 'amend' | 'delete';

export interface LegalDirectoryAdminActionPayload {
  listingId: string;
  action: LegalDirectoryAdminAction;
  exp: number;
  jti: string;
}

export interface LegalDirectoryAdminActionKVRecord {
  listingId: string;
  action: LegalDirectoryAdminAction;
  createdAt: string;
  exp: number;
}

const TOKEN_KV_PREFIX = 'legaldir-admin-token:';
export const LEGAL_DIRECTORY_ADMIN_TOKEN_TTL_SECONDS = 7 * 24 * 60 * 60;

function getSecret(): string {
  const raw = process.env.ADMIN_DECISION_TOKEN_SECRET;
  if (!raw || raw.trim().length < 16) {
    throw new Error(
      'ADMIN_DECISION_TOKEN_SECRET is not configured (need at least 16 chars).',
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
  return base64UrlEncode(crypto.createHmac('sha256', secret).update(payloadB64).digest());
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

export function buildLegalDirectoryAdminToken(payload: LegalDirectoryAdminActionPayload): string {
  const secret = getSecret();
  const payloadB64 = base64UrlEncode(JSON.stringify(payload));
  return `${payloadB64}.${sign(payloadB64, secret)}`;
}

export function verifyLegalDirectoryAdminTokenSignature(
  token: string,
): { ok: true; payload: LegalDirectoryAdminActionPayload } | { ok: false; error: string } {
  if (!token) return { ok: false, error: 'Missing token' };
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
  if (!timingSafeEqualStrings(sig, sign(payloadB64, secret))) {
    return { ok: false, error: 'Invalid signature' };
  }

  let payload: LegalDirectoryAdminActionPayload;
  try {
    payload = JSON.parse(base64UrlDecodeToString(payloadB64)) as LegalDirectoryAdminActionPayload;
  } catch {
    return { ok: false, error: 'Malformed payload' };
  }

  if (
    typeof payload !== 'object' ||
    payload === null ||
    typeof payload.listingId !== 'string' ||
    typeof payload.jti !== 'string' ||
    typeof payload.exp !== 'number' ||
    (payload.action !== 'amend' && payload.action !== 'delete')
  ) {
    return { ok: false, error: 'Malformed payload' };
  }

  if (payload.exp < Math.floor(Date.now() / 1000)) {
    return { ok: false, error: 'Token expired' };
  }

  return { ok: true, payload };
}

export async function issueLegalDirectoryAdminToken(opts: {
  listingId: string;
  action: LegalDirectoryAdminAction;
  ttlSeconds?: number;
}): Promise<string> {
  const ttl = Math.max(60, Math.floor(opts.ttlSeconds ?? LEGAL_DIRECTORY_ADMIN_TOKEN_TTL_SECONDS));
  const exp = Math.floor(Date.now() / 1000) + ttl;
  const jti = crypto.randomUUID();
  const payload: LegalDirectoryAdminActionPayload = {
    listingId: opts.listingId,
    action: opts.action,
    exp,
    jti,
  };
  const token = buildLegalDirectoryAdminToken(payload);

  const kv = getKV();
  if (!kv) {
    throw new Error('KV not configured — cannot issue legal directory admin token');
  }

  const record: LegalDirectoryAdminActionKVRecord = {
    listingId: opts.listingId,
    action: opts.action,
    createdAt: new Date().toISOString(),
    exp,
  };
  await kv.set(tokenKey(jti), record, { ex: ttl });
  return token;
}

export async function peekLegalDirectoryAdminToken(token: string): Promise<
  | { ok: true; payload: LegalDirectoryAdminActionPayload; record: LegalDirectoryAdminActionKVRecord }
  | { ok: false; status: 400 | 401 | 410; error: string }
> {
  const verify = verifyLegalDirectoryAdminTokenSignature(token);
  if (!verify.ok) {
    return {
      ok: false,
      status: verify.error === 'Token expired' ? 410 : 401,
      error: verify.error,
    };
  }

  const kv = getKV();
  if (!kv) return { ok: false, status: 400, error: 'Storage not configured' };

  const record = await kv.get<LegalDirectoryAdminActionKVRecord>(tokenKey(verify.payload.jti));
  if (!record) {
    return {
      ok: false,
      status: 410,
      error: 'This link has already been used or has expired.',
    };
  }

  if (
    record.listingId !== verify.payload.listingId ||
    record.action !== verify.payload.action
  ) {
    return { ok: false, status: 401, error: 'Token does not match its server record.' };
  }

  return { ok: true, payload: verify.payload, record };
}

export async function consumeLegalDirectoryAdminToken(token: string): Promise<
  | { ok: true; payload: LegalDirectoryAdminActionPayload }
  | { ok: false; status: 400 | 401 | 410; error: string }
> {
  const peek = await peekLegalDirectoryAdminToken(token);
  if (!peek.ok) return peek;

  const kv = getKV();
  if (!kv) return { ok: false, status: 400, error: 'Storage not configured' };

  const removed = await kv.del(tokenKey(peek.payload.jti));
  if (removed === 0) {
    return { ok: false, status: 410, error: 'This link has already been used.' };
  }

  return { ok: true, payload: peek.payload };
}
