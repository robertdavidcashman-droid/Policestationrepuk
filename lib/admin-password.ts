import crypto from 'crypto';

/** Admin sign-in password — must be set via ADMIN_PASSWORD in production. */
function expectedPassword(): string {
  return process.env.ADMIN_PASSWORD?.trim() || '';
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
  if (expectedPassword()) return true;
  if (process.env.NODE_ENV === 'production') {
    console.error('[admin-password] ADMIN_PASSWORD must be set in production');
  }
  return false;
}
