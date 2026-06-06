import crypto from 'crypto';
import { getKV } from '@/lib/kv';

export interface CustodyDiscoveryAccessPayload {
  email: string;
  batchId: string;
  exp: number;
  jti: string;
}

export interface CustodyDiscoveryAccessKVRecord {
  email: string;
  batchId: string;
  createdAt: string;
  exp: number;
}

const TOKEN_KV_PREFIX = 'custodydiscovery-access:';
export const ACCESS_TOKEN_TTL_SECONDS = 7 * 24 * 60 * 60;

function getSecret(): string {
  const raw = process.env.ADMIN_DECISION_TOKEN_SECRET;
  if (!raw || raw.trim().length < 16) {
    throw new Error('ADMIN_DECISION_TOKEN_SECRET is not configured');
  }
  return raw.trim();
}

function base64UrlEncode(input: Buffer | string): string {
  const buf = typeof input === 'string' ? Buffer.from(input, 'utf8') : input;
  return buf.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
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

export function verifyAccessTokenSignature(
  token: string,
): { ok: true; payload: CustodyDiscoveryAccessPayload } | { ok: false; error: string } {
  if (!token) return { ok: false, error: 'Missing token' };
  const parts = token.split('.');
  if (parts.length !== 2) return { ok: false, error: 'Malformed token' };

  let secret: string;
  try {
    secret = getSecret();
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Secret not configured' };
  }

  const [payloadB64, sig] = parts;
  if (!timingSafeEqualStrings(sig, sign(payloadB64, secret))) {
    return { ok: false, error: 'Invalid signature' };
  }

  let payload: CustodyDiscoveryAccessPayload;
  try {
    payload = JSON.parse(base64UrlDecodeToString(payloadB64)) as CustodyDiscoveryAccessPayload;
  } catch {
    return { ok: false, error: 'Malformed payload' };
  }

  if (
    typeof payload.email !== 'string' ||
    typeof payload.batchId !== 'string' ||
    typeof payload.jti !== 'string' ||
    typeof payload.exp !== 'number'
  ) {
    return { ok: false, error: 'Malformed payload' };
  }

  if (payload.exp < Math.floor(Date.now() / 1000)) {
    return { ok: false, error: 'Token expired' };
  }

  return { ok: true, payload };
}

export async function issueAccessToken(opts: {
  email: string;
  batchId: string;
  ttlSeconds?: number;
}): Promise<string> {
  const ttl = Math.max(60, Math.floor(opts.ttlSeconds ?? ACCESS_TOKEN_TTL_SECONDS));
  const exp = Math.floor(Date.now() / 1000) + ttl;
  const jti = crypto.randomUUID();
  const payload: CustodyDiscoveryAccessPayload = {
    email: opts.email.toLowerCase(),
    batchId: opts.batchId,
    exp,
    jti,
  };
  const payloadB64 = base64UrlEncode(JSON.stringify(payload));
  const token = `${payloadB64}.${sign(payloadB64, getSecret())}`;

  const kv = getKV();
  if (!kv) throw new Error('KV not configured');
  await kv.set(
    tokenKey(jti),
    {
      email: payload.email,
      batchId: opts.batchId,
      createdAt: new Date().toISOString(),
      exp,
    } satisfies CustodyDiscoveryAccessKVRecord,
    { ex: ttl },
  );

  return token;
}

export async function peekAccessToken(token: string): Promise<
  | { ok: true; payload: CustodyDiscoveryAccessPayload }
  | { ok: false; error: string }
> {
  const verify = verifyAccessTokenSignature(token);
  if (!verify.ok) return verify;

  const kv = getKV();
  if (!kv) return { ok: false, error: 'Storage not configured' };
  const record = await kv.get<CustodyDiscoveryAccessKVRecord>(tokenKey(verify.payload.jti));
  if (!record) return { ok: false, error: 'Link expired or invalid' };
  if (record.email !== verify.payload.email || record.batchId !== verify.payload.batchId) {
    return { ok: false, error: 'Token mismatch' };
  }
  return { ok: true, payload: verify.payload };
}
