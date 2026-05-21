/**
 * Public-side eligibility gate for /register.
 *
 * The full registration form is no longer rendered until the server mints a
 * one-shot gate token. This endpoint accepts the minimal eligibility payload
 * (email + category + PIN/SRA/proof + Turnstile + email-code) and:
 *
 *   - rejects obviously ineligible / high-risk / incomplete submissions
 *     outright (and pings the admin so they can manually invite the rep);
 *   - mints a short-lived single-use token tied to the email when the
 *     applicant passes all checks. The client then unlocks the full form and
 *     submits to /api/register with that token in the body.
 *
 * Without this token POST /api/register refuses to persist anything, so the
 * full registration form is never reachable by scraping or direct curl.
 */

import { NextResponse } from 'next/server';
import { getClientIp, rateLimitOk } from '@/lib/contact-guards';
import {
  consumeEnquiryEmailCode,
  enquiryEmailVerificationEnabled,
} from '@/lib/enquiry-email-verify';
import { verifyTurnstile } from '@/lib/turnstile';
import { scoreRepRisk } from '@/lib/rep-risk';
import { createRegisterGateToken } from '@/lib/rep-verification';
import { sendRepHeldForReviewAlert } from '@/lib/email';
import {
  APPLICANT_CATEGORY_LABELS,
  APPLICANT_CATEGORY_VALUES,
  type ApplicantCategory,
  looksIneligible,
} from '@/lib/rep-status';

export const dynamic = 'force-dynamic';

interface GateBody {
  email?: unknown;
  category?: unknown;
  pinNumber?: unknown;
  sraNumber?: unknown;
  proofUrl?: unknown;
  emailCode?: unknown;
  turnstileToken?: unknown;
  _hp?: unknown;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const URL_RE = /^https?:\/\/[^\s]+\.[^\s]+$/i;

function s(v: unknown, max: number): string {
  if (typeof v !== 'string') return '';
  return v.trim().slice(0, max);
}

function isApplicantCategory(v: unknown): v is ApplicantCategory {
  return typeof v === 'string' && (APPLICANT_CATEGORY_VALUES as string[]).includes(v);
}

export async function POST(request: Request) {
  let raw: GateBody;
  try {
    raw = (await request.json()) as GateBody;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  // Honeypot — bots get a permissive-looking 200 but no token.
  if (raw._hp) {
    return NextResponse.json(
      { ok: false, reason: 'blocked', message: 'Request blocked.' },
      { status: 400 },
    );
  }

  const email = s(raw.email, 320).toLowerCase();
  const pinNumber = s(raw.pinNumber, 80);
  const sraNumber = s(raw.sraNumber, 80);
  const proofUrl = s(raw.proofUrl, 500);

  if (!email || !EMAIL_RE.test(email)) {
    return NextResponse.json(
      { ok: false, reason: 'invalid-email', message: 'Please enter a valid email address.' },
      { status: 400 },
    );
  }
  if (!isApplicantCategory(raw.category)) {
    return NextResponse.json(
      {
        ok: false,
        reason: 'not-eligible',
        message:
          'Please select your professional status. We do not list probationary representatives, trainees or unaccredited applicants.',
      },
      { status: 400 },
    );
  }
  const category: ApplicantCategory = raw.category;

  if (proofUrl && !URL_RE.test(proofUrl)) {
    return NextResponse.json(
      {
        ok: false,
        reason: 'invalid-proof-url',
        message: 'Proof-of-accreditation URL must be a full https:// link.',
      },
      { status: 400 },
    );
  }

  // Strict evidence rules — same as the legacy /api/register handler.
  if (category === 'psras-accredited' && !pinNumber && !proofUrl) {
    return NextResponse.json(
      {
        ok: false,
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
        reason: 'rate-limited',
        message: 'Too many requests. Please wait a few minutes and try again.',
      },
      { status: 429 },
    );
  }

  const ts = await verifyTurnstile(
    typeof raw.turnstileToken === 'string' ? raw.turnstileToken : null,
    ip,
  );
  if (!ts.ok && ts.reason !== 'disabled') {
    return NextResponse.json(
      {
        ok: false,
        reason: 'bot-check-failed',
        message: 'Bot-protection check failed. Please refresh and try again.',
      },
      { status: 400 },
    );
  }

  if (enquiryEmailVerificationEnabled()) {
    const code = typeof raw.emailCode === 'string' ? raw.emailCode.trim() : '';
    if (!code) {
      return NextResponse.json(
        {
          ok: false,
          reason: 'email-code-required',
          requiresEmailCode: true,
          message:
            'Please verify your email address. Request a code first, then submit it with this form.',
        },
        { status: 400 },
      );
    }
    const verdict = await consumeEnquiryEmailCode(email, code);
    if (!verdict.ok) {
      const msg =
        verdict.reason === 'expired'
          ? 'Your verification code has expired. Please request a new one.'
          : verdict.reason === 'too-many-attempts'
            ? 'Too many incorrect attempts. Please request a new verification code.'
            : verdict.reason === 'missing'
              ? 'No verification code on file for this email. Please request one first.'
              : verdict.reason === 'disabled-no-kv'
                ? 'Email verification is temporarily unavailable. Please try again shortly.'
                : 'Verification code did not match. Please check the code and try again.';
      return NextResponse.json(
        { ok: false, reason: 'email-code-invalid', requiresEmailCode: true, message: msg },
        { status: 400 },
      );
    }
  }

  /* ----- Eligibility / risk scoring on the partial profile ----- */

  const accreditationText = APPLICANT_CATEGORY_LABELS[category];
  const issuedAt = new Date().toISOString();

  if (looksIneligible(accreditationText)) {
    // Defence in depth — category labels themselves should never trip this, but
    // keeping the check guards against future additions to the labels map.
    return rejectWithAdminAlert({
      reason: 'not-eligible',
      message:
        'We do not list probationary representatives, trainees or unaccredited applicants.',
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

  // Drop the risk flags that we cannot evaluate before the full form is
  // submitted — they would otherwise force every applicant to "medium"/"high"
  // even when the eligibility evidence is perfectly fine.
  const SOFT_FLAGS = new Set([
    'No phone number',
    'Only first name supplied',
    'Lists counties but no specific police stations',
  ]);
  const decisiveFlags = assessment.highRiskFlags.filter((f) => !SOFT_FLAGS.has(f));
  const passes = decisiveFlags.length === 0;

  if (!passes) {
    return rejectWithAdminAlert({
      reason: 'high-risk',
      message:
        'We could not auto-verify your details. Our admin team has been notified and will contact you shortly to complete the listing manually.',
      email,
      category,
      pinNumber,
      sraNumber,
      proofUrl,
      issuedAt,
      ipAddress: ip,
      userAgent: request.headers.get('user-agent') || '',
      riskCategory: assessment.category,
      riskReasons: decisiveFlags.length ? decisiveFlags : assessment.reasons,
    });
  }

  /* ----- Mint single-use token ----- */

  const tokenRecord = await createRegisterGateToken({
    email,
    category,
    pinNumber,
    sraNumber,
    proofUrl,
    riskCategory: assessment.category,
    ipAddress: ip,
  });

  if (!tokenRecord) {
    return NextResponse.json(
      {
        ok: false,
        reason: 'temporary-unavailable',
        message:
          'Registration is temporarily unavailable. Please try again in a few minutes or email us.',
      },
      { status: 503 },
    );
  }

  return NextResponse.json({
    ok: true,
    gateToken: tokenRecord.token,
    expiresAt: tokenRecord.expiresAt,
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
      reason: args.reason,
      message: args.message,
    },
    { status: 200 },
  );
}
