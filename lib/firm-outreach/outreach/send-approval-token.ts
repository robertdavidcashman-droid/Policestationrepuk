import crypto from 'crypto';
import { localDateInTimezone } from '@/lib/buffer/scheduler-core';
import { getKV } from '@/lib/kv';

export interface SendApprovalPayload {
  action: 'send_batch';
  date: string;
  recipient: string;
  exp: number;
  jti: string;
}

export interface SendApprovalKVRecord {
  date: string;
  recipient: string;
  createdAt: string;
  exp: number;
}

const TOKEN_KV_PREFIX = 'firmoutreach:send-approval:';
const SEND_LOCK_PREFIX = 'firmoutreach:send-approval-lock:';
const APPROVAL_EMAIL_PREFIX = 'firmoutreach:approval-email:';
const SEND_APPROVAL_JTI_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const NOTIFY_TIMEZONE =
  process.env.FIRM_OUTREACH_DIGEST_TIMEZONE?.trim() || 'Europe/London';

function getSecret(): string {
  const raw =
    process.env.ADMIN_DECISION_TOKEN_SECRET?.trim() ??
    process.env.CRON_SECRET?.trim() ??
    'firm-outreach-dev-secret-change-me';
  return raw;
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

function sign(payloadB64: string): string {
  return base64UrlEncode(crypto.createHmac('sha256', getSecret()).update(payloadB64).digest());
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

function sendLockKey(jti: string): string {
  return `${SEND_LOCK_PREFIX}${jti}`;
}

export function normalizeSendApprovalRef(raw: string): string {
  const trimmed = raw.trim();
  try {
    return decodeURIComponent(trimmed);
  } catch {
    return trimmed;
  }
}

export function isSendApprovalJti(ref: string): boolean {
  return SEND_APPROVAL_JTI_RE.test(ref);
}

export function outreachApprovalDate(now = new Date()): string {
  return localDateInTimezone(now, NOTIFY_TIMEZONE);
}

/** Seconds until end of London calendar day (+ 1h buffer). */
export function secondsUntilLondonDayEnd(now = new Date()): number {
  const today = outreachApprovalDate(now);
  const probe = new Date(now.getTime() + 3600_000);
  for (let h = 1; h <= 30; h++) {
    probe.setTime(now.getTime() + h * 3600_000);
    if (outreachApprovalDate(probe) !== today) {
      const endMs = probe.getTime() + 3600_000;
      return Math.max(3600, Math.floor((endMs - now.getTime()) / 1000));
    }
  }
  return 86400;
}

export function buildSendApprovalToken(payload: SendApprovalPayload): string {
  const payloadB64 = base64UrlEncode(JSON.stringify(payload));
  return `${payloadB64}.${sign(payloadB64)}`;
}

export function verifySendApprovalTokenSignature(
  token: string,
): { ok: true; payload: SendApprovalPayload } | { ok: false; error: string } {
  if (!token?.includes('.')) return { ok: false, error: 'Malformed token' };
  const [payloadB64, sig] = token.split('.');
  if (!payloadB64 || !sig) return { ok: false, error: 'Malformed token' };

  const expectedSig = sign(payloadB64);
  if (!timingSafeEqualStrings(sig, expectedSig)) {
    return { ok: false, error: 'Invalid signature' };
  }

  let payload: SendApprovalPayload;
  try {
    payload = JSON.parse(base64UrlDecodeToString(payloadB64)) as SendApprovalPayload;
  } catch {
    return { ok: false, error: 'Malformed payload' };
  }

  if (
    payload.action !== 'send_batch' ||
    typeof payload.date !== 'string' ||
    typeof payload.recipient !== 'string' ||
    typeof payload.jti !== 'string' ||
    typeof payload.exp !== 'number'
  ) {
    return { ok: false, error: 'Malformed payload' };
  }

  if (payload.exp < Math.floor(Date.now() / 1000)) {
    return { ok: false, error: 'Token expired' };
  }

  if (payload.date !== outreachApprovalDate()) {
    return { ok: false, error: 'Token is for a different day' };
  }

  return { ok: true, payload };
}

export async function wasOutreachApprovalEmailSent(date: string): Promise<boolean> {
  const kv = getKV();
  if (!kv) return false;
  return Boolean(await kv.get(`${APPROVAL_EMAIL_PREFIX}${date}`));
}

export async function markOutreachApprovalEmailSent(date: string): Promise<void> {
  const kv = getKV();
  if (!kv) return;
  await kv.set(`${APPROVAL_EMAIL_PREFIX}${date}`, new Date().toISOString(), {
    ex: 60 * 60 * 24 * 14,
  });
}

export async function issueSendApprovalToken(opts: {
  date?: string;
  recipient: string;
}): Promise<{ token: string; jti: string; exp: number; date: string }> {
  const date = opts.date ?? outreachApprovalDate();
  const ttl = secondsUntilLondonDayEnd();
  const exp = Math.floor(Date.now() / 1000) + ttl;
  const jti = crypto.randomUUID();
  const payload: SendApprovalPayload = {
    action: 'send_batch',
    date,
    recipient: opts.recipient.trim().toLowerCase(),
    exp,
    jti,
  };
  const token = buildSendApprovalToken(payload);

  const kv = getKV();
  if (!kv) throw new Error('KV not configured — cannot issue send approval token');

  const record: SendApprovalKVRecord = {
    date,
    recipient: payload.recipient,
    createdAt: new Date().toISOString(),
    exp,
  };
  await kv.set(tokenKey(jti), record, { ex: ttl });

  return { token, jti, exp, date };
}

export async function peekSendApprovalByJti(jti: string): Promise<
  | { ok: true; payload: SendApprovalPayload; record: SendApprovalKVRecord }
  | { ok: false; status: 400 | 401 | 410; error: string }
> {
  const kv = getKV();
  if (!kv) return { ok: false, status: 400, error: 'Storage not configured' };

  const record = await kv.get<SendApprovalKVRecord>(tokenKey(jti));
  if (!record) {
    return {
      ok: false,
      status: 410,
      error: 'This send link has already been used or has expired.',
    };
  }

  if (record.exp < Math.floor(Date.now() / 1000)) {
    return { ok: false, status: 410, error: 'Token expired' };
  }

  if (record.date !== outreachApprovalDate()) {
    return { ok: false, status: 410, error: 'Token is for a different day' };
  }

  const payload: SendApprovalPayload = {
    action: 'send_batch',
    date: record.date,
    recipient: record.recipient,
    exp: record.exp,
    jti,
  };

  return { ok: true, payload, record };
}

/** Accepts a short jti (email link) or legacy signed token string. */
export async function peekSendApprovalRef(ref: string): Promise<
  | { ok: true; payload: SendApprovalPayload; record: SendApprovalKVRecord }
  | { ok: false; status: 400 | 401 | 410; error: string }
> {
  const normalized = normalizeSendApprovalRef(ref);
  if (isSendApprovalJti(normalized)) {
    return peekSendApprovalByJti(normalized);
  }
  return peekSendApprovalToken(normalized);
}

export async function peekSendApprovalToken(token: string): Promise<
  | { ok: true; payload: SendApprovalPayload; record: SendApprovalKVRecord }
  | { ok: false; status: 400 | 401 | 410; error: string }
> {
  const verify = verifySendApprovalTokenSignature(token);
  if (!verify.ok) {
    return {
      ok: false,
      status: verify.error === 'Token expired' || verify.error === 'Token is for a different day' ? 410 : 401,
      error: verify.error,
    };
  }

  const kv = getKV();
  if (!kv) return { ok: false, status: 400, error: 'Storage not configured' };

  const record = await kv.get<SendApprovalKVRecord>(tokenKey(verify.payload.jti));
  if (!record) {
    return {
      ok: false,
      status: 410,
      error: 'This send link has already been used or has expired.',
    };
  }

  if (
    record.date !== verify.payload.date ||
    record.recipient !== verify.payload.recipient
  ) {
    return { ok: false, status: 401, error: 'Token does not match its server record.' };
  }

  return { ok: true, payload: verify.payload, record };
}

export async function tryClaimSendApproval(ref: string): Promise<
  | { ok: true; payload: SendApprovalPayload }
  | { ok: false; status: 400 | 401 | 409 | 410; error: string; inProgress?: boolean }
> {
  const peek = await peekSendApprovalRef(ref);
  if (!peek.ok) return peek;

  const kv = getKV();
  if (!kv) return { ok: false, status: 400, error: 'Storage not configured' };

  const lockKey = sendLockKey(peek.payload.jti);
  const acquired = await kv.set(lockKey, new Date().toISOString(), { nx: true, ex: 600 });
  if (!acquired) {
    return {
      ok: false,
      status: 409,
      inProgress: true,
      error: 'A send is already in progress for this link.',
    };
  }

  return { ok: true, payload: peek.payload };
}

export async function releaseSendApprovalClaim(ref: string): Promise<void> {
  const normalized = normalizeSendApprovalRef(ref);
  let jti: string | null = null;
  if (isSendApprovalJti(normalized)) {
    jti = normalized;
  } else {
    const peek = await peekSendApprovalToken(normalized);
    if (peek.ok) jti = peek.payload.jti;
  }
  if (!jti) return;
  const kv = getKV();
  if (!kv) return;
  await kv.del(sendLockKey(jti));
}

export async function finalizeSendApproval(ref: string): Promise<void> {
  const peek = await peekSendApprovalRef(ref);
  if (!peek.ok) return;
  const kv = getKV();
  if (!kv) return;
  await kv.del(tokenKey(peek.payload.jti));
  await kv.del(sendLockKey(peek.payload.jti));
}

/** @deprecated Prefer tryClaimSendApproval + finalizeSendApproval so failed sends can retry. */
export async function consumeSendApprovalToken(token: string): Promise<
  | { ok: true; payload: SendApprovalPayload }
  | { ok: false; status: 400 | 401 | 410; error: string }
> {
  const peek = await peekSendApprovalRef(token);
  if (!peek.ok) return peek;

  const kv = getKV();
  if (!kv) return { ok: false, status: 400, error: 'Storage not configured' };

  const removed = await kv.del(tokenKey(peek.payload.jti));
  if (removed === 0) {
    return {
      ok: false,
      status: 410,
      error: 'This send link has already been used.',
    };
  }

  return { ok: true, payload: peek.payload };
}
