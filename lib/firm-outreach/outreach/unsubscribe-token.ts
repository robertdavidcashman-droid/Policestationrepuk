import crypto from 'crypto';

export interface UnsubscribePayload {
  email: string;
  exp: number;
}

function getSecret(): string {
  const raw =
    process.env.ADMIN_DECISION_TOKEN_SECRET ??
    process.env.CRON_SECRET ??
    'firm-outreach-dev-secret-change-me';
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

function sign(payloadB64: string): string {
  return base64UrlEncode(crypto.createHmac('sha256', getSecret()).update(payloadB64).digest());
}

export function issueUnsubscribeToken(email: string, ttlDays = 90): string {
  const payload: UnsubscribePayload = {
    email: email.trim().toLowerCase(),
    exp: Math.floor(Date.now() / 1000) + ttlDays * 24 * 60 * 60,
  };
  const payloadB64 = base64UrlEncode(JSON.stringify(payload));
  return `${payloadB64}.${sign(payloadB64)}`;
}

export function verifyUnsubscribeToken(token: string): UnsubscribePayload | null {
  const [payloadB64, sig] = token.split('.');
  if (!payloadB64 || !sig) return null;
  if (sign(payloadB64) !== sig) return null;
  try {
    const payload = JSON.parse(base64UrlDecodeToString(payloadB64)) as UnsubscribePayload;
    if (!payload.email || payload.exp < Math.floor(Date.now() / 1000)) return null;
    return payload;
  } catch {
    return null;
  }
}
