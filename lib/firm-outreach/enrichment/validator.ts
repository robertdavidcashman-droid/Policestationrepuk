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
  if (!isValidEmailFormat(email)) return { ok: false, reason: 'invalid_format' };
  const domain = normalizeEmail(email).split('@')[1];
  if (DISPOSABLE_DOMAINS.has(domain)) return { ok: false, reason: 'disposable_domain' };
  if (!(await hasMxRecord(email))) return { ok: false, reason: 'no_mx' };
  return { ok: true };
}

export function isFreeEmailDomain(email: string): boolean {
  const domain = normalizeEmail(email).split('@')[1];
  return FREE_EMAIL_DOMAINS.has(domain);
}
