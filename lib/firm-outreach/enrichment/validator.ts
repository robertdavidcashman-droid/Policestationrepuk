import dns from 'dns/promises';
import { FREE_EMAIL_DOMAINS } from '../constants';
import { normalizeEmail } from '../normalize';

const RFC5322 =
  /^[a-z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)+$/i;

const DISPOSABLE_DOMAINS = new Set([
  'mailinator.com',
  'guerrillamail.com',
  'tempmail.com',
  'yopmail.com',
]);

const JUNK_EMAIL_DOMAIN_PATTERNS = [
  /sentry-next\.wixpress\.com$/i,
  /sentry\.io$/i,
  /cloudflare\.com$/i,
  /\.(png|jpe?g|gif|webp|svg)$/i,
];

const JUNK_EMAIL_LOCAL_PATTERNS = [/\.(png|jpe?g|gif|webp|svg)$/i, /\[email/i];

/** Reject obvious crawler artefacts before MX lookup. */
export function isPlausibleOutreachEmail(email: string): boolean {
  const norm = normalizeEmail(email);
  if (!isValidEmailFormat(norm)) return false;
  const [local, domain] = norm.split('@');
  if (!local || !domain) return false;
  if (JUNK_EMAIL_LOCAL_PATTERNS.some((re) => re.test(local))) return false;
  if (JUNK_EMAIL_DOMAIN_PATTERNS.some((re) => re.test(domain))) return false;
  return true;
}

export function isValidEmailFormat(email: string): boolean {
  const norm = normalizeEmail(email);
  return norm.length <= 320 && RFC5322.test(norm);
}

export async function hasMxRecord(email: string): Promise<boolean> {
  const domain = normalizeEmail(email).split('@')[1];
  if (!domain || DISPOSABLE_DOMAINS.has(domain)) return false;
  try {
    const mx = await dns.resolveMx(domain);
    return mx.length > 0;
  } catch {
    return false;
  }
}

export async function validateEmailForSend(email: string): Promise<{
  ok: boolean;
  reason?: string;
}> {
  if (!isPlausibleOutreachEmail(email)) return { ok: false, reason: 'invalid_format' };
  const domain = normalizeEmail(email).split('@')[1];
  if (DISPOSABLE_DOMAINS.has(domain)) return { ok: false, reason: 'disposable_domain' };
  if (!(await hasMxRecord(email))) return { ok: false, reason: 'no_mx' };
  return { ok: true };
}

export function isFreeEmailDomain(email: string): boolean {
  const domain = normalizeEmail(email).split('@')[1];
  return FREE_EMAIL_DOMAINS.has(domain);
}
