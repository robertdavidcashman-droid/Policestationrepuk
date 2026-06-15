import { getSession } from '@/lib/auth';

function parseAdminEmails(): Set<string> {
  return new Set(
    (process.env.ADMIN_EMAILS || process.env.OWNER_EMAIL || '')
      .split(/[,;]+/)
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean),
  );
}

function getAdminEmails(): Set<string> {
  const emails = parseAdminEmails();
  if (process.env.NODE_ENV === 'production' && emails.size === 0) {
    console.error('[admin-auth] ADMIN_EMAILS or OWNER_EMAIL must be set in production');
  }
  return emails;
}

export type AdminCheckResult =
  | { ok: true; email: string }
  | { ok: false; status: 401 | 403; error: string };

/** Email-gated admin check: requires a signed-in `rep_session` whose email is in ADMIN_EMAILS. */
export async function requireAdmin(): Promise<AdminCheckResult> {
  const email = await getSession();
  if (!email) return { ok: false, status: 401, error: 'Not authenticated' };
  const adminEmails = getAdminEmails();
  if (adminEmails.size === 0) {
    return { ok: false, status: 403, error: 'Admin access not configured' };
  }
  if (!adminEmails.has(email.toLowerCase())) {
    return { ok: false, status: 403, error: 'Not authorised' };
  }
  return { ok: true, email };
}

export function isAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  const adminEmails = getAdminEmails();
  if (adminEmails.size === 0) return false;
  return adminEmails.has(email.toLowerCase());
}

export function adminEmailListSize(): number {
  return getAdminEmails().size;
}
