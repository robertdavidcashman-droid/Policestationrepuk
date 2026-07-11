/**
 * KV-backed storage for the new private verification pipeline.
 *
 * Three independent namespaces are used:
 *   - `enquiry:{id}`         — public enquiry form submissions
 *   - `enquiry-by-email:{e}` — pointer index from email to latest enquiry id
 *   - `verification:{email}` — private secure-verification submissions
 *   - `verification-token:{token}` — single-use admin-issued token, points to email
 *   - `profile-report:{id}`  — public "report this profile" submissions
 *
 * NONE of these are ever consulted by /directory or /rep/[slug]. Public
 * visibility is driven only by `repreview:{email}` (admin-controlled status
 * + adminApproved + isPublic + lastVerifiedDate). See lib/data.ts.
 */

import { getKV, skipKVInPrerender } from '@/lib/kv';
import { claimKey } from '@/lib/kv-atomic';
import type {
  RepEnquiryRecord,
  RepVerificationRecord,
} from '@/lib/types';

const ENQUIRY_PREFIX = 'enquiry:';
const ENQUIRY_BY_EMAIL = 'enquiry-by-email:';
const VERIFICATION_PREFIX = 'verification:';
const TOKEN_PREFIX = 'verification-token:';
const REPORT_PREFIX = 'profile-report:';
const REGISTER_GATE_PREFIX = 'register-gate-token:';

const TOKEN_TTL_SECONDS = 60 * 60 * 24 * 30; // 30 days
const REGISTER_GATE_TTL_SECONDS = 30 * 60; // 30 minutes

function newId(): string {
  // ULID-ish: timestamp + crypto random for sort-by-time admin views
  const ts = Date.now().toString(36);
  const rnd =
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID().replace(/-/g, '')
      : Math.random().toString(36).slice(2);
  return `${ts}-${rnd.slice(0, 12)}`;
}

export function generateVerificationToken(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID().replace(/-/g, '') + Math.random().toString(36).slice(2, 8);
  }
  return Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2);
}

/* ---------------- Enquiries ---------------- */

export async function saveEnquiry(record: RepEnquiryRecord): Promise<string> {
  const kv = getKV();
  if (!kv) {
    // Local-dev fallback: just log; keep the form responsive.
    console.warn('[rep-verification] KV not configured — enquiry not persisted:', {
      id: record.id,
      email: record.email,
    });
    return record.id;
  }
  const id = record.id || newId();
  const toStore: RepEnquiryRecord = { ...record, id };
  await kv.set(`${ENQUIRY_PREFIX}${id}`, toStore);
  await kv.set(`${ENQUIRY_BY_EMAIL}${record.email.toLowerCase()}`, id);
  return id;
}

export async function getEnquiry(id: string): Promise<RepEnquiryRecord | null> {
  const kv = getKV();
  if (!kv) return null;
  return (await kv.get<RepEnquiryRecord>(`${ENQUIRY_PREFIX}${id}`)) ?? null;
}

export async function getEnquiryByEmail(email: string): Promise<RepEnquiryRecord | null> {
  const kv = getKV();
  if (!kv) return null;
  const id = await kv.get<string>(`${ENQUIRY_BY_EMAIL}${email.toLowerCase()}`);
  if (!id) return null;
  return getEnquiry(id);
}

export async function listAllEnquiries(): Promise<RepEnquiryRecord[]> {
  if (skipKVInPrerender()) return [];
  const kv = getKV();
  if (!kv) return [];
  try {
    const keys = await kv.keys(`${ENQUIRY_PREFIX}*`);
    if (keys.length === 0) return [];
    const pipeline = kv.pipeline();
    for (const k of keys) pipeline.get(k);
    const rows = await pipeline.exec<(RepEnquiryRecord | null)[]>();
    return rows
      .filter((r): r is RepEnquiryRecord => Boolean(r && r.email))
      .sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
  } catch (err) {
    console.error('[rep-verification] listAllEnquiries failed:', err);
    return [];
  }
}

export async function updateEnquiryStatus(
  id: string,
  patch: Partial<
    Pick<
      RepEnquiryRecord,
      'status' | 'verificationLinkSentAt' | 'verificationSubmittedAt'
    >
  >,
): Promise<RepEnquiryRecord | null> {
  const kv = getKV();
  if (!kv) return null;
  const existing = await getEnquiry(id);
  if (!existing) return null;
  const merged: RepEnquiryRecord = { ...existing, ...patch };
  await kv.set(`${ENQUIRY_PREFIX}${id}`, merged);
  await kv.set(`${ENQUIRY_BY_EMAIL}${merged.email.toLowerCase()}`, merged.id);
  return merged;
}

export function newEnquiryId(): string {
  return newId();
}

/* ---------------- Verification tokens ---------------- */

export interface VerificationTokenRecord {
  token: string;
  email: string;
  issuedAt: string;
  issuedBy: string;
  expiresAt: string;
  enquiryId?: string;
  usedAt?: string | null;
}

export async function createVerificationToken(input: {
  email: string;
  issuedBy: string;
  enquiryId?: string;
  ttlSeconds?: number;
}): Promise<VerificationTokenRecord> {
  const kv = getKV();
  if (!kv) throw new Error('KV not configured — cannot mint verification token');
  const token = generateVerificationToken();
  const now = Date.now();
  const ttl = input.ttlSeconds ?? TOKEN_TTL_SECONDS;
  const record: VerificationTokenRecord = {
    token,
    email: input.email.toLowerCase(),
    issuedAt: new Date(now).toISOString(),
    issuedBy: input.issuedBy.toLowerCase(),
    expiresAt: new Date(now + ttl * 1000).toISOString(),
    enquiryId: input.enquiryId,
    usedAt: null,
  };
  await kv.set(`${TOKEN_PREFIX}${token}`, record, { ex: ttl });
  return record;
}

export async function consumeVerificationToken(
  token: string,
): Promise<VerificationTokenRecord | null> {
  const kv = getKV();
  if (!kv) return null;
  const rec = await kv.get<VerificationTokenRecord>(`${TOKEN_PREFIX}${token}`);
  if (!rec) return null;
  if (rec.usedAt) return null;
  const used: VerificationTokenRecord = {
    ...rec,
    usedAt: new Date().toISOString(),
  };
  await kv.set(`${TOKEN_PREFIX}${token}`, used, { ex: 60 * 60 * 24 }); // keep short audit trail
  return rec;
}

export async function previewVerificationToken(
  token: string,
): Promise<VerificationTokenRecord | null> {
  const kv = getKV();
  if (!kv) return null;
  return (await kv.get<VerificationTokenRecord>(`${TOKEN_PREFIX}${token}`)) ?? null;
}

/* ---------------- Registration gate tokens ---------------- */
/**
 * One-shot, short-lived (30-minute) tokens that prove a registration applicant
 * has cleared the public-side eligibility gate (PIN/SRA supplied, low risk
 * category, email-verified, Turnstile passed). The full /register form is only
 * rendered client-side after the server issues one of these, and POST
 * /api/register refuses to persist anything unless the body carries a still-
 * unconsumed token bound to the same email.
 *
 * Without this gate the full form HTML never appears in a public response and
 * the /api/register endpoint cannot be driven directly by a scraper or curl.
 */

import type { ApplicantCategory } from '@/lib/rep-status';

export interface RegisterGateTokenRecord {
  token: string;
  email: string;
  category: ApplicantCategory;
  pinNumber?: string;
  sraNumber?: string;
  proofUrl?: string;
  riskCategory: string;
  issuedAt: string;
  expiresAt: string;
  usedAt?: string | null;
  ipAddress?: string;
}

export interface CreateRegisterGateTokenInput {
  email: string;
  category: ApplicantCategory;
  pinNumber?: string;
  sraNumber?: string;
  proofUrl?: string;
  riskCategory: string;
  ipAddress?: string;
}

export async function createRegisterGateToken(
  input: CreateRegisterGateTokenInput,
): Promise<RegisterGateTokenRecord | null> {
  const kv = getKV();
  if (!kv) return null;
  const token = generateVerificationToken();
  const now = Date.now();
  const record: RegisterGateTokenRecord = {
    token,
    email: input.email.toLowerCase(),
    category: input.category,
    pinNumber: input.pinNumber || undefined,
    sraNumber: input.sraNumber || undefined,
    proofUrl: input.proofUrl || undefined,
    riskCategory: input.riskCategory,
    issuedAt: new Date(now).toISOString(),
    expiresAt: new Date(now + REGISTER_GATE_TTL_SECONDS * 1000).toISOString(),
    usedAt: null,
    ipAddress: input.ipAddress,
  };
  await kv.set(`${REGISTER_GATE_PREFIX}${token}`, record, {
    ex: REGISTER_GATE_TTL_SECONDS,
  });
  return record;
}

export async function consumeRegisterGateToken(
  token: string,
): Promise<RegisterGateTokenRecord | null> {
  const kv = getKV();
  if (!kv) return null;
  const claim = await claimKey(`${REGISTER_GATE_PREFIX}claim:${token}`, 300);
  if (!claim) return null;
  const key = `${REGISTER_GATE_PREFIX}${token}`;
  const rec = await kv.get<RegisterGateTokenRecord>(key);
  if (!rec) return null;
  if (rec.usedAt) return null;
  if (Date.parse(rec.expiresAt) < Date.now()) {
    await kv.del(key);
    return null;
  }
  const used: RegisterGateTokenRecord = {
    ...rec,
    usedAt: new Date().toISOString(),
  };
  // Keep a short audit trail for ~24h so duplicates can be diagnosed.
  await kv.set(key, used, { ex: 60 * 60 * 24 });
  return rec;
}

/* ---------------- Secure verification record ---------------- */

export async function saveVerification(
  record: RepVerificationRecord,
): Promise<void> {
  const kv = getKV();
  if (!kv) throw new Error('KV not configured — verification cannot be saved');
  await kv.set(`${VERIFICATION_PREFIX}${record.email.toLowerCase()}`, record);
}

export async function getVerification(
  email: string,
): Promise<RepVerificationRecord | null> {
  const kv = getKV();
  if (!kv) return null;
  return (
    (await kv.get<RepVerificationRecord>(
      `${VERIFICATION_PREFIX}${email.toLowerCase()}`,
    )) ?? null
  );
}

export async function listAllVerifications(): Promise<RepVerificationRecord[]> {
  if (skipKVInPrerender()) return [];
  const kv = getKV();
  if (!kv) return [];
  try {
    const keys = await kv.keys(`${VERIFICATION_PREFIX}*`);
    if (keys.length === 0) return [];
    const pipeline = kv.pipeline();
    for (const k of keys) pipeline.get(k);
    const rows = await pipeline.exec<(RepVerificationRecord | null)[]>();
    return rows.filter((r): r is RepVerificationRecord => Boolean(r && r.email));
  } catch (err) {
    console.error('[rep-verification] listAllVerifications failed:', err);
    return [];
  }
}

/* ---------------- Public "report this profile" ---------------- */

export interface ProfileReportRecord {
  id: string;
  targetEmail: string;
  targetSlug: string;
  reporterName: string;
  reporterEmail: string;
  reason: string;
  details: string;
  ipAddress: string;
  userAgent: string;
  createdAt: string;
  status: 'new' | 'reviewing' | 'closed';
}

export async function saveProfileReport(
  record: Omit<ProfileReportRecord, 'id'>,
): Promise<string> {
  const id = newId();
  const kv = getKV();
  if (!kv) {
    console.warn('[rep-verification] KV not configured — profile report not persisted', record);
    return id;
  }
  const full: ProfileReportRecord = { ...record, id };
  await kv.set(`${REPORT_PREFIX}${id}`, full);
  return id;
}

export async function listAllProfileReports(): Promise<ProfileReportRecord[]> {
  if (skipKVInPrerender()) return [];
  const kv = getKV();
  if (!kv) return [];
  try {
    const keys = await kv.keys(`${REPORT_PREFIX}*`);
    if (keys.length === 0) return [];
    const pipeline = kv.pipeline();
    for (const k of keys) pipeline.get(k);
    const rows = await pipeline.exec<(ProfileReportRecord | null)[]>();
    return rows
      .filter((r): r is ProfileReportRecord => Boolean(r && r.id))
      .sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
  } catch (err) {
    console.error('[rep-verification] listAllProfileReports failed:', err);
    return [];
  }
}
