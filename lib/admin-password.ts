import crypto from 'crypto';

/**
 * Admin sign-in password. The ADMIN_PASSWORD env var takes precedence when set
 * (so it can be rotated without a deploy); otherwise this in-code default is
 * used so admin login always works in production.
 */
const DEFAULT_ADMIN_PASSWORD = 'Bristol120566!';

function expectedPassword(): string {
  return process.env.ADMIN_PASSWORD?.trim() || DEFAULT_ADMIN_PASSWORD;
}

/** Timing-safe password check for admin sign-in. */
export function verifyAdminPassword(password: string): boolean {
  const expected = expectedPassword();
  if (!expected || !password) return false;
  const a = Buffer.from(password, 'utf8');
  const b = Buffer.from(expected, 'utf8');
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

export function isAdminPasswordConfigured(): boolean {
  return Boolean(expectedPassword());
}
