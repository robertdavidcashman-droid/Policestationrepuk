/**
 * Public-side eligibility gate for /register.
 *
 * The full registration form is no longer rendered until the server mints a
 * one-shot gate token. This endpoint accepts the minimal eligibility payload
 * (email + category + PIN/SRA/proof + optional email-code) and:
 *
 *   - rejects obviously ineligible / spam / honeypot / malformed submissions
 *     outright (HTTP 400) with a precise error code so the client UI can show
 *     a useful message and the next action;
 *   - mints a short-lived single-use token bound to the email when the
 *     applicant passes the basic eligibility checks. Borderline applicants
 *     (e.g. solicitor with an SRA number but no automatic proof) still get a
 *     token but the resulting `repreview:{email}` row is marked
 *     `pending-manual-review`, so the listing is HELD for admin review rather
 *     than auto-published.
 *
 * Without this token POST /api/register refuses to persist anything, so the
 * full registration form is never reachable by scraping or direct curl.
 *
 * Bot mitigation here relies on:
 *   - the silent honeypot (`_hp`) field that bots reliably fill in;
 *   - per-IP rate limits (6 / 15 minutes / scope=register-gate);
 *   - mandatory PIN / SRA / proof-URL evidence;
 *   - server-side risk scoring on the partial payload.
 *
 * The Cloudflare Turnstile gate that used to live here was removed because it
 * blocked legitimate accredited reps whose browsers / extensions silently
 * dropped the widget script and produced the long-running "I entered the
 * email code but the form never opened" bug.
 *
 * Stable error codes (returned as `body.code`):
 *   INVALID_JSON
 *   HONEYPOT_TRIGGERED
 *   INVALID_EMAIL
 *   INVALID_CATEGORY
 *   INVALID_PROOF_URL
 *   MISSING_EVIDENCE        — neither PIN/SRA nor proof URL supplied
 *   RATE_LIMITED
 *   EMAIL_CODE_REQUIRED / EMAIL_CODE_INVALID / EMAIL_CODE_EXPIRED /
 *     EMAIL_CODE_TOO_MANY_ATTEMPTS / EMAIL_CODE_DISABLED
 *   INELIGIBLE_CATEGORY     — applicant flagged as probationary/trainee/etc.
 *   GATE_STORE_UNAVAILABLE  — could not mint the gate token (KV down)
 *   GATE_OK                 — happy path
 */

import { NextResponse } from 'next/server';
import { getClientIp, rateLimitOk } from '@/lib/contact-guards';
import {
  consumeEnquiryEmailCode,
  enquiryEmailVerificationEnabled,
} from '@/lib/enquiry-email-verify';
import { scoreRepRisk } from '@/lib/rep-risk';
import { createRegisterGateToken } from '@/lib/rep-verification';
import { sendRepHeldForReviewAlert } from '@/lib/email';
import {
  APPLICANT_CATEGORY_LABELS,
  APPLICANT_CATEGORY_VALUES,
  type ApplicantCategory,
  looksIneligible,
} from '@/lib/rep-status';
import {
  INVALID_PROOF_URL_MESSAGE,
  resolveRegistrationProofUrl,
} from '@/lib/normalize-url';

export const dynamic = 'force-dynamic';

interface GateBody {
  email?: unknown;
  category?: unknown;
  pinNumber?: unknown;
  sraNumber?: unknown;
  proofUrl?: unknown;
  emailCode?: unknown;
  _hp?: unknown;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function s(v: unknown, max: number): string {
  if (typeof v !== 'string') return '';
  return v.trim().slice(0, max);
}

function isApplicantCategory(v: unknown): v is ApplicantCategory {
  return typeof v === 'string' && (APPLICANT_CATEGORY_VALUES as string[]).includes(v);
}

function safeLog(event: string, payload: Record<string, unknown> = {}): void {
  const safe = { event, ...payload };
  // Never log full tokens / codes / secrets — strip anything that looks like one.
  delete (safe as { emailCode?: unknown }).emailCode;
  console.info('[register-gate]', JSON.stringify(safe));
}

export async function POST(request: Request) {
  let raw: GateBody;
  try {
    raw = (await request.json()) as GateBody;
  } catch {
    return NextResponse.json(
      {
        ok: false,
        code: 'INVALID_JSON',
        reason: 'invalid-json',
        message: 'The eligibility form sent invalid data. Please refresh the page and try again.',
      },
      { status: 400 },
    );
  }

  // Honeypot — bots get a permissive-looking 200 but no token.
  if (raw._hp) {
    safeLog('honeypot_triggered');
    return NextResponse.json(
      {
        ok: false,
        code: 'HONEYPOT_TRIGGERED',
        reason: 'blocked',
        message: 'Request blocked.',
      },
      { status: 400 },
    );
  }

  const email = s(raw.email, 320).toLowerCase();
  const pinNumber = s(raw.pinNumber, 80);
  const sraNumber = s(raw.sraNumber, 80);
  const rawProofUrl = s(raw.proofUrl, 500);
  const { proofUrl, invalidProofUrl } = resolveRegistrationProofUrl({
    rawProof: rawProofUrl,
    pinNumber,
    sraNumber,
  });

  if (invalidProofUrl) {
    return NextResponse.json(
      {
        ok: false,
        code: 'INVALID_PROOF_URL',
        reason: 'invalid-proof-url',
        message: INVALID_PROOF_URL_MESSAGE,
      },
      { status: 400 },
    );
  }
  if (!email || !EMAIL_RE.test(email)) {
    return NextResponse.json(
      {
        ok: false,
        code: 'INVALID_EMAIL',
        reason: 'invalid-email',
        message: 'Please enter a valid email address.',
      },
      { status: 400 },
    );
  }
  if (!isApplicantCategory(raw.category)) {
    return NextResponse.json(
      {
        ok: false,
        code: 'INVALID_CATEGORY',
        reason: 'not-eligible',
        message:
          'Please select your professional status. We do not list probationary representatives, trainees or unaccredited applicants.',
      },
      { status: 400 },
    );
  }
  const category: ApplicantCategory = raw.category;

  // Strict evidence rules — same as the legacy /api/register handler.
  if (category === 'psras-accredited' && !pinNumber && !proofUrl) {
    return NextResponse.json(
      {
        ok: false,
        code: 'MISSING_EVIDENCE',
        reason: 'missing-evidence',
        message:
          'PSRAS-accredited representatives must supply either their DSCC / PIN number or a URL to proof of accreditation before continuing.',
      },
      { status: 400 },
    );
  }
  if (category !== 'psras-accredited' && !sraNumber && !proofUrl) {
    return NextResponse.json(
      {
        ok: false,
        code: 'MISSING_EVIDENCE',
        reason: 'missing-evidence',
        message:
          (category === 'duty-solicitor' ? 'Duty solicitors' : 'Solicitors') +
          ' must supply either their SRA number or a URL to proof of registration before continuing.',
      },
      { status: 400 },
    );
  }

  /* ----- Spam / abuse guards ----- */

  const ip = getClientIp(request);
  const rl = await rateLimitOk({
    ip,
    scope: 'register-gate',
    max: 6,
    windowMs: 15 * 60 * 1000,
  });
  if (!rl.ok) {
    return NextResponse.json(
      {
        ok: false,
        code: 'RATE_LIMITED',
        reason: 'rate-limited',
        message: 'Too many requests. Please wait a few minutes and try again.',
      },
      { status: 429 },
    );
  }

  if (enquiryEmailVerificationEnabled()) {
    const code = typeof raw.emailCode === 'string' ? raw.emailCode.trim() : '';
    if (!code) {
      return NextResponse.json(
        {
          ok: false,
          code: 'EMAIL_CODE_REQUIRED',
          reason: 'email-code-required',
          requiresEmailCode: true,
          message:
            'Please verify your email address. Tap "Send verification code" first, then enter the 6-digit code we email you.',
        },
        { status: 400 },
      );
    }
    const verdict = await consumeEnquiryEmailCode(email, code);
    if (!verdict.ok) {
      safeLog('email_code_failed', { reason: verdict.reason });
      const codeMap: Record<typeof verdict.reason, { code: string; status: number; msg: string }> = {
        expired: {
          code: 'EMAIL_CODE_EXPIRED',
          status: 400,
          msg: 'Your verification code has expired. Please request a new one and try again.',
        },
        'too-many-attempts': {
          code: 'EMAIL_CODE_TOO_MANY_ATTEMPTS',
          status: 429,
          msg: 'Too many incorrect attempts. Please request a brand-new verification code.',
        },
        missing: {
          code: 'EMAIL_CODE_REQUIRED',
          status: 400,
          msg: 'No verification code on file for this email. Please request one first.',
        },
        'disabled-no-kv': {
          code: 'EMAIL_CODE_DISABLED',
          status: 503,
          msg: 'Email verification is temporarily unavailable. Please try again shortly.',
        },
        wrong: {
          code: 'EMAIL_CODE_INVALID',
          status: 400,
          msg: 'That verification code is incorrect. Please check your inbox and try again.',
        },
      };
      const mapped = codeMap[verdict.reason];
      return NextResponse.json(
        {
          ok: false,
          code: mapped.code,
          reason: 'email-code-invalid',
          requiresEmailCode: true,
          message: mapped.msg,
        },
        { status: mapped.status },
      );
    }
    safeLog('email_code_verified', { email });
  }

  /* ----- Eligibility / risk scoring on the partial profile ----- */

  const accreditationText = APPLICANT_CATEGORY_LABELS[category];
  const issuedAt = new Date().toISOString();

  if (looksIneligible(accreditationText)) {
    return rejectWithAdminAlert({
      reason: 'not-eligible',
      code: 'INELIGIBLE_CATEGORY',
      message:
        'PoliceStationRepUK does not list probationary representatives, trainees or unaccredited applicants. If this is wrong, please contact the directory team.',
      email,
      category,
      pinNumber,
      sraNumber,
      proofUrl,
      issuedAt,
      ipAddress: ip,
      userAgent: request.headers.get('user-agent') || '',
      riskCategory: 'ineligible',
      riskReasons: ['Accreditation text looks ineligible'],
    });
  }

  const assessment = scoreRepRisk({
    email,
    phone: '',
    name: '',
    accreditation: accreditationText,
    pinNumber,
    sraNumber,
    accreditationProofFile: proofUrl,
    counties: [],
    stations: [],
    notes: '',
    publicProfileNotes: '',
    registeredAt: issuedAt,
    lastVerifiedDate: issuedAt,
    ipAddress: ip,
  });

  // The full form has not yet been submitted, so a lot of the risk flags are
  // expected to be present at the gate stage. Drop the ones that can only be
  // known after the applicant fills in Step 2 — they would otherwise trigger
  // a needless manual-review fallback for every genuine applicant.
  const SOFT_FLAGS = new Set([
    'No phone number',
    'Only first name supplied',
    'Lists counties but no specific police stations',
    // "Recently created (<48h) with incomplete accreditation evidence" — fires
    // for every brand-new registration; not useful at the gate stage.
    'Recently created (<48h) with incomplete accreditation evidence',
  ]);
  const decisiveFlags = assessment.highRiskFlags.filter((f) => !SOFT_FLAGS.has(f));

  // Decision tree:
  //   - decisiveFlags empty                  -> mint a "clean" gate token
  //   - decisiveFlags only contain "no PIN
  //     and no proof"-style evidence flags    -> already rejected above by
  //                                            MISSING_EVIDENCE; nothing to do
  //   - decisiveFlags contain anything else  -> still mint a token, but
  //                                            mark `riskCategory='medium'`
  //                                            so the full form persists as
  //                                            `pending-manual-review`.
  //
  // The KEY behaviour change vs. the previous version: we never hard-reject
  // a genuine solicitor / PSRAS rep at the gate just because automatic
  // verification is unavailable. Step 2 always unlocks; whether the listing
  // auto-publishes or sits in the admin queue is decided later by
  // /api/register based on the same risk score on the full payload.

  // A PIN (for PSRAS) or an SRA number (for solicitors / duty solicitors) is
  // the strong identifier we can run automatic checks against. When only a
  // proof URL is supplied we cannot auto-verify, so the listing should be
  // marked `pending-manual-review` even if no decisive high-risk flag fired.
  const lacksStrongIdentifier =
    (category === 'psras-accredited' && !pinNumber) ||
    ((category === 'solicitor' || category === 'duty-solicitor') && !sraNumber);

  const riskCategory: 'low' | 'medium' =
    decisiveFlags.length === 0 && !lacksStrongIdentifier ? 'low' : 'medium';
  if (riskCategory === 'medium') {
    safeLog('gate_pending_manual_review', {
      email,
      category,
      lacksStrongIdentifier,
      flags: decisiveFlags,
    });
  }

  /* ----- Mint single-use token ----- */

  const tokenRecord = await createRegisterGateToken({
    email,
    category,
    pinNumber,
    sraNumber,
    proofUrl,
    riskCategory,
    ipAddress: ip,
  });

  if (!tokenRecord) {
    safeLog('gate_store_unavailable', { email });
    return NextResponse.json(
      {
        ok: false,
        code: 'GATE_STORE_UNAVAILABLE',
        reason: 'temporary-unavailable',
        message:
          'Registration storage is temporarily unavailable. Please try again in a few minutes or email us.',
      },
      { status: 503 },
    );
  }

  safeLog('gate_passed', {
    email,
    category,
    riskCategory,
    tokenIssued: true,
  });

  return NextResponse.json({
    ok: true,
    code: 'GATE_OK',
    gateToken: tokenRecord.token,
    expiresAt: tokenRecord.expiresAt,
    riskCategory,
    pendingManualReview: riskCategory === 'medium',
    gateData: {
      email,
      category,
      pinNumber,
      sraNumber,
      proofUrl,
    },
  });
}

function rejectWithAdminAlert(args: {
  reason: 'not-eligible' | 'high-risk';
  code: string;
  message: string;
  email: string;
  category: ApplicantCategory;
  pinNumber: string;
  sraNumber: string;
  proofUrl: string;
  issuedAt: string;
  ipAddress: string;
  userAgent: string;
  riskCategory: string;
  riskReasons: string[];
}): NextResponse {
  sendRepHeldForReviewAlert({
    name: '(gate stage — name not yet collected)',
    email: args.email,
    phone: '',
    category: APPLICANT_CATEGORY_LABELS[args.category],
    accreditation: APPLICANT_CATEGORY_LABELS[args.category],
    pinNumber: args.pinNumber,
    sraNumber: args.sraNumber,
    proofUrl: args.proofUrl,
    ipAddress: args.ipAddress,
    userAgent: args.userAgent,
    riskCategory: args.riskCategory,
    riskReasons: args.riskReasons,
    registeredAt: args.issuedAt,
  }).catch((err) => console.warn('[register-gate] admin alert failed:', err));

  return NextResponse.json(
    {
      ok: false,
      code: args.code,
      reason: args.reason,
      message: args.message,
    },
    { status: 200 },
  );
}
