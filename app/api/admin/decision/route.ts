import { NextResponse } from 'next/server';
import { consumeDecisionToken } from '@/lib/admin-decision-token';
import {
  setReview,
  getReview,
  type RepReview,
} from '@/lib/admin-review';
import { getKV } from '@/lib/kv';
import { invalidateProfileCache, invalidateRegisteredRepsCache } from '@/lib/data';
import { invalidateFeaturedCache } from '@/lib/featured';
import { sendApplicantRegistrationDeclined } from '@/lib/email';
import {
  type ApplicantCategory,
  type PublicVerifiedStatus,
} from '@/lib/rep-status';
import { getClientIp } from '@/lib/contact-guards';

/**
 * POST /api/admin/decision — handler for the one-click Approve / Decline
 * buttons in the held-for-review email.
 *
 * Hard rules:
 *   - POST only. Email-client GET prefetchers cannot trigger the action.
 *   - Token is consumed atomically (delete-on-success), so a forwarded link
 *     cannot replay and a double-click cannot double-action.
 *   - Token is bound to BOTH the email AND the action, so tampering to switch
 *     rep or flip approve↔decline breaks the signature.
 *   - Audit row is written to `admin-decision-audit:{jti}` for 365 days.
 */

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const AUDIT_TTL_SECONDS = 365 * 24 * 60 * 60;

function categoryToVerifiedStatus(category: ApplicantCategory): PublicVerifiedStatus {
  switch (category) {
    case 'psras-accredited':
      return 'verified-psras';
    case 'duty-solicitor':
      return 'verified-duty-solicitor';
    case 'solicitor':
      return 'verified-solicitor';
  }
}

function appendAdminNote(existing: string | undefined, note: string): string {
  const trimmed = (existing ?? '').trim();
  return trimmed ? `${trimmed}\n${note}` : note;
}

async function readToken(request: Request): Promise<string | null> {
  const ct = request.headers.get('content-type') ?? '';
  if (ct.includes('application/json')) {
    try {
      const body = (await request.json()) as { token?: unknown };
      return typeof body.token === 'string' ? body.token : null;
    } catch {
      return null;
    }
  }
  // Default: form POST from the interstitial page.
  try {
    const form = await request.formData();
    const t = form.get('token');
    return typeof t === 'string' && t.length > 0 ? t : null;
  } catch {
    return null;
  }
}

function redirectToResult(
  request: Request,
  outcome: 'approved' | 'declined' | 'error',
  detail?: string,
): NextResponse {
  const url = new URL('/admin/decision/result', request.url);
  url.searchParams.set('ok', outcome);
  if (detail) url.searchParams.set('detail', detail);
  return NextResponse.redirect(url, { status: 303 });
}

export async function POST(request: Request) {
  const token = await readToken(request);
  if (!token) {
    return redirectToResult(request, 'error', 'missing-token');
  }

  const result = await consumeDecisionToken(token);
  if (!result.ok) {
    const detail =
      result.status === 410
        ? 'expired-or-already-used'
        : result.status === 401
          ? 'invalid-token'
          : 'token-storage-unavailable';
    return redirectToResult(request, 'error', detail);
  }
  const { payload } = result;

  const ip = getClientIp(request);
  const userAgent = request.headers.get('user-agent') ?? '';
  const decidedAt = new Date().toISOString();

  let review: RepReview;
  try {
    if (payload.action === 'approve') {
      const verifiedStatus = categoryToVerifiedStatus(payload.category);
      const existing = await getReview(payload.email);
      review = await setReview(
        payload.email,
        {
          status: 'approved',
          verificationStatus: verifiedStatus,
          adminApproved: true,
          isPublic: true,
          lastVerifiedDate: decidedAt,
          adminNotes: appendAdminNote(
            existing?.adminNotes,
            `Approved via email button on ${decidedAt}.`,
          ),
        },
        `email-button:${payload.email}`,
      );
    } else {
      const existing = await getReview(payload.email);
      review = await setReview(
        payload.email,
        {
          status: 'rejected',
          verificationStatus: 'rejected',
          adminApproved: false,
          isPublic: false,
          adminNotes: appendAdminNote(
            existing?.adminNotes,
            `Declined via email button on ${decidedAt}.`,
          ),
        },
        `email-button:${payload.email}`,
      );
    }
  } catch (err) {
    console.error('[admin/decision] setReview failed:', err);
    return redirectToResult(request, 'error', 'review-write-failed');
  }

  invalidateProfileCache();
  invalidateRegisteredRepsCache();
  invalidateFeaturedCache();

  const kv = getKV();
  if (kv) {
    try {
      await kv.set(
        `admin-decision-audit:${payload.jti}`,
        {
          email: payload.email,
          action: payload.action,
          category: payload.category,
          decidedAt,
          ip,
          userAgent,
          resultingStatus: review.verificationStatus,
        },
        { ex: AUDIT_TTL_SECONDS },
      );
    } catch (err) {
      console.warn('[admin/decision] audit write failed:', err);
    }
  }

  if (payload.action === 'decline') {
    let applicantName = payload.email;
    try {
      const newrep = await kv?.get<{ name?: string }>(`newrep:${payload.email}`);
      if (newrep?.name) applicantName = newrep.name;
    } catch {
      // best-effort; the decline email still ships
    }
    sendApplicantRegistrationDeclined({
      toEmail: payload.email,
      name: applicantName,
    }).catch((err) =>
      console.warn('[admin/decision] applicant decline email failed:', err),
    );
  }

  return redirectToResult(
    request,
    payload.action === 'approve' ? 'approved' : 'declined',
    payload.email,
  );
}

// Explicitly reject GET / HEAD / OPTIONS so a prefetched URL (or someone
// poking around in a browser) does NOT action the decision. This is what
// makes the whole feature email-prefetch safe.
export function GET() {
  return NextResponse.json(
    { error: 'Method not allowed — confirm the decision via the linked page.' },
    { status: 405, headers: { Allow: 'POST' } },
  );
}
