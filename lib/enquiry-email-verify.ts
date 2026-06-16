/**
 * Email-verification (one-time numeric code) for the public enquiry form.
 *
 * Independent of the existing magic-login flow at /api/auth/* — we want a
 * separate KV namespace so enquiry codes don't collide with login codes and
 * cannot accidentally log anyone in.
 *
 * Flow:
 *   1) POST /api/register/send-code  { email } -> 200 { sent: true }
 *      (stores `enquiry-code:{email}` = { code, expiresAt, attempts })
 *   2) POST /api/register            { ...enquiry, emailCode }
 *      The handler calls `consumeEnquiryEmailCode(email, code)` and rejects
 *      the enquiry if it fails.
 *
 * If KV is not configured the verifier short-circuits to allow submission so
 * local dev keeps working; this is documented in the audit report so the
 * Vercel production env can flip the master switch.
 */

import crypto from 'crypto';
import { getKV } from '@/lib/kv';

/** Constant-time comparison so a wrong code can't be guessed via timing. */
function timingSafeEqualStrings(a: string, b: string): boolean {
  const ab = Buffer.from(String(a), 'utf8');
  const bb = Buffer.from(String(b), 'utf8');
  if (ab.length !== bb.length) return false;
  return crypto.timingSafeEqual(ab, bb);
}

const PREFIX = 'enquiry-code:';
const TTL_SECONDS = 15 * 60; // 15 minutes
const MAX_ATTEMPTS = 5;

interface CodeRecord {
  code: string;
  email: string;
  createdAt: number;
  expiresAt: number;
  attempts: number;
}

export function enquiryEmailVerificationEnabled(): boolean {
  return (
    process.env.REQUIRE_ENQUIRY_EMAIL_VERIFICATION === '1' ||
    process.env.REQUIRE_ENQUIRY_EMAIL_VERIFICATION === 'true'
  );
}

function generateCode(): string {
  // 6-digit numeric code; cryptographically random when available.
  const arr = new Uint32Array(1);
  if (typeof crypto !== 'undefined' && 'getRandomValues' in crypto) {
    crypto.getRandomValues(arr);
  } else {
    arr[0] = Math.floor(Math.random() * 1_000_000);
  }
  return String(arr[0] % 1_000_000).padStart(6, '0');
}

/** Mint and store a verification code for `email`. Returns the code. */
export async function issueEnquiryEmailCode(email: string): Promise<string | null> {
  const kv = getKV();
  if (!kv) return null;
  const code = generateCode();
  const now = Date.now();
  const record: CodeRecord = {
    code,
    email: email.toLowerCase(),
    createdAt: now,
    expiresAt: now + TTL_SECONDS * 1000,
    attempts: 0,
  };
  await kv.set(`${PREFIX}${email.toLowerCase()}`, record, { ex: TTL_SECONDS });
  return code;
}

export type EnquiryCodeResult =
  | { ok: true }
  | { ok: false; reason: 'missing' | 'expired' | 'wrong' | 'too-many-attempts' | 'disabled-no-kv' };

/**
 * Check the code submitted with the enquiry form. On success, the record is
 * deleted (single-use). On failure with attempts remaining, the attempts
 * counter is incremented.
 */
export async function consumeEnquiryEmailCode(
  email: string,
  submittedCode: string,
): Promise<EnquiryCodeResult> {
  const kv = getKV();
  if (!kv) return { ok: false, reason: 'disabled-no-kv' };
  const key = `${PREFIX}${email.toLowerCase()}`;
  const record = await kv.get<CodeRecord>(key);
  if (!record) return { ok: false, reason: 'missing' };
  if (Date.now() > record.expiresAt) {
    await kv.del(key);
    return { ok: false, reason: 'expired' };
  }
  if (record.attempts >= MAX_ATTEMPTS) {
    await kv.del(key);
    return { ok: false, reason: 'too-many-attempts' };
  }
  const submitted = String(submittedCode || '').trim();
  if (!timingSafeEqualStrings(submitted, record.code)) {
    const updated: CodeRecord = { ...record, attempts: record.attempts + 1 };
    const remainingTtl = Math.max(60, Math.floor((record.expiresAt - Date.now()) / 1000));
    await kv.set(key, updated, { ex: remainingTtl });
    return { ok: false, reason: 'wrong' };
  }
  await kv.del(key);
  return { ok: true };
}
