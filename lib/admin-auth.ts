import { getSession } from '@/lib/auth';

const DEFAULT_ADMIN_EMAIL = 'robertdavidcashman@gmail.com';

const ADMIN_EMAILS = new Set(
  [
    DEFAULT_ADMIN_EMAIL,
    ...(process.env.ADMIN_EMAILS || process.env.OWNER_EMAIL || '')
      .split(/[,;]+/)
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean),
  ],
);

export type AdminCheckResult =
  | { ok: true; email: string }
  | { ok: false; status: 401 | 403; error: string };

/** Email-gated admin check: requires a signed-in `rep_session` whose email is in ADMIN_EMAILS. */
export async function requireAdmin(): Promise<AdminCheckResult> {
  const email = await getSession();
  if (!email) return { ok: false, status: 401, error: 'Not authenticated' };
  if (ADMIN_EMAILS.size === 0) {
    return { ok: false, status: 403, error: 'Admin access not configured' };
  }
  if (!ADMIN_EMAILS.has(email.toLowerCase())) {
    return { ok: false, status: 403, error: 'Not authorised' };
  }
  return { ok: true, email };
}

export function isAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  if (ADMIN_EMAILS.size === 0) return false;
  return ADMIN_EMAILS.has(email.toLowerCase());
}

export function adminEmailListSize(): number {
  return ADMIN_EMAILS.size;
}
