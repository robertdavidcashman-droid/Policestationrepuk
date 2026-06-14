import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-auth';
import {
  isValidVerificationStatus,
  setReview,
} from '@/lib/admin-review';
import {
  PUBLIC_VERIFIED_STATUSES,
  type RepVerificationStatus,
} from '@/lib/rep-status';
import { sendContactNotification } from '@/lib/email';
import {
  invalidateProfileCache,
  invalidateRegisteredRepsCache,
} from '@/lib/data';
import { invalidateRepAuditCache } from '@/lib/admin/rep-audit-cache';
import { buildRepAuditRowForEmail } from '@/lib/admin/rep-audit-loader';

export const dynamic = 'force-dynamic';

const RE_VERIFICATION_TEMPLATE = `We are tightening verification across PoliceStationRepUK to protect firms, clients and genuine representatives.

Your profile has been marked for re-verification. To remain listed, please complete the secure verification form and provide your current PIN number, SRA number, accreditation evidence or other suitable professional verification.

PoliceStationRepUK no longer lists probationary representatives, trainees or unaccredited applicants.

Your address, PIN number, uploaded documents and verification material will not be displayed publicly.

Profiles not re-verified may be removed from the public directory.`;

type Action =
  | 'approve-psras'
  | 'approve-duty-solicitor'
  | 'approve-solicitor'
  | 'request-evidence'
  | 'mark-suspected-fake'
  | 'mark-ineligible'
  | 'suspend'
  | 'remove'
  | 'mark-needs-reverification'
  | 'send-reverification-message'
  | 'set-status';

const ACTION_TO_STATUS: Partial<Record<Action, RepVerificationStatus>> = {
  'approve-psras': 'verified-psras',
  'approve-duty-solicitor': 'verified-duty-solicitor',
  'approve-solicitor': 'verified-solicitor',
  'request-evidence': 'awaiting-evidence',
  'mark-suspected-fake': 'duplicate-or-fake',
  'mark-ineligible': 'ineligible-probationary-or-trainee',
  'suspend': 'suspended',
  'remove': 'removed',
  'mark-needs-reverification': 'expired-needs-reverification',
};

interface Body {
  email?: unknown;
  action?: unknown;
  adminNotes?: unknown;
  /** Used by `set-status` only. */
  status?: unknown;
  /** Optional explicit overrides — admin can untick these as part of a status change. */
  adminApproved?: unknown;
  isPublic?: unknown;
  /** Optional admin message that should be emailed to the applicant. */
  messageToApplicant?: unknown;
}

export async function POST(request: Request) {
  const auth = await requireAdmin();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  let body: Body;
  try {
    body = (await request.json()) as Body;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
  if (!email) return NextResponse.json({ error: 'Missing email' }, { status: 400 });

  const action = body.action as Action | undefined;
  if (!action) return NextResponse.json({ error: 'Missing action' }, { status: 400 });

  const adminNotes =
    typeof body.adminNotes === 'string' ? body.adminNotes.slice(0, 10_000) : undefined;

  let targetStatus: RepVerificationStatus | null = null;
  if (action === 'set-status') {
    if (!isValidVerificationStatus(body.status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }
    targetStatus = body.status;
  } else if (action === 'send-reverification-message') {
    targetStatus = 'expired-needs-reverification';
  } else {
    targetStatus = ACTION_TO_STATUS[action] ?? null;
    if (!targetStatus) {
      return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 });
    }
  }

  const isApproval =
    targetStatus !== null &&
    (PUBLIC_VERIFIED_STATUSES as ReadonlySet<RepVerificationStatus>).has(targetStatus);

  // Determine adminApproved / isPublic from the action, allowing explicit overrides.
  let adminApproved: boolean | null = null;
  let isPublic: boolean | null = null;
  if (isApproval) {
    adminApproved = true;
    isPublic = true;
  } else if (
    targetStatus === 'rejected' ||
    targetStatus === 'duplicate-or-fake' ||
    targetStatus === 'ineligible-probationary-or-trainee' ||
    targetStatus === 'suspended' ||
    targetStatus === 'removed' ||
    targetStatus === 'expired-needs-reverification'
  ) {
    adminApproved = false;
    isPublic = false;
  }
  if (typeof body.adminApproved === 'boolean') adminApproved = body.adminApproved;
  if (typeof body.isPublic === 'boolean') isPublic = body.isPublic;

  const lastVerifiedDate = isApproval ? new Date().toISOString() : undefined;

  try {
    await setReview(
      email,
      {
        verificationStatus: targetStatus,
        adminApproved,
        isPublic,
        ...(lastVerifiedDate ? { lastVerifiedDate } : {}),
        adminNotes:
          (adminNotes !== undefined ? adminNotes : '') +
          (adminNotes ? '\n\n' : '') +
          `[auto] ${action} by ${auth.email} at ${new Date().toISOString()}`,
      },
      auth.email,
    );
  } catch (err) {
    console.error('[verify-action] setReview failed:', err);
    return NextResponse.json({ error: 'Could not save review.' }, { status: 502 });
  }

  invalidateProfileCache();
  invalidateRegisteredRepsCache();
  invalidateRepAuditCache();

  const auditRow = await buildRepAuditRowForEmail(email);

  // Best-effort applicant communication for the actions that warrant it.
  if (action === 'send-reverification-message' || action === 'request-evidence') {
    const message =
      typeof body.messageToApplicant === 'string' && body.messageToApplicant.trim()
        ? body.messageToApplicant.trim()
        : RE_VERIFICATION_TEMPLATE;
    sendContactNotification({
      name: 'PoliceStationRepUK admin',
      email,
      subject:
        action === 'request-evidence'
          ? 'PoliceStationRepUK — further evidence required'
          : 'PoliceStationRepUK — re-verification required',
      message,
    }).catch((err) => console.warn('[verify-action] notify failed:', err));
  }

  return NextResponse.json({
    ok: true,
    action,
    verificationStatus: targetStatus,
    adminApproved,
    isPublic,
    lastVerifiedDate: lastVerifiedDate ?? null,
    auditRow,
  });
}
