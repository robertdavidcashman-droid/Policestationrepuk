import { NextResponse } from 'next/server';
import { getClientIp, rateLimitOk } from '@/lib/contact-guards';
import {
  consumeVerificationToken,
  getEnquiryByEmail,
  saveVerification,
  updateEnquiryStatus,
} from '@/lib/rep-verification';
import { setReview, getReview } from '@/lib/admin-review';
import { sendContactNotification } from '@/lib/email';
import { runNewRepRegulatoryVerification } from '@/lib/regulatory-auto-pass';
import {
  APPLICANT_CATEGORY_VALUES,
  type ApplicantCategory,
  looksIneligible,
} from '@/lib/rep-status';
import { verifyTurnstile } from '@/lib/turnstile';
import type { RepVerificationRecord } from '@/lib/types';

export const dynamic = 'force-dynamic';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function s(v: unknown, max = 1000): string {
  if (typeof v !== 'string') return '';
  return v.trim().slice(0, max);
}

function arr(v: unknown, max = 200): string[] {
  if (!Array.isArray(v)) return [];
  return v
    .filter((x): x is string => typeof x === 'string')
    .map((x) => x.trim())
    .filter(Boolean)
    .slice(0, max);
}

function bool(v: unknown): boolean {
  return v === true;
}

function isApplicantCategory(v: unknown): v is ApplicantCategory {
  return typeof v === 'string' && (APPLICANT_CATEGORY_VALUES as string[]).includes(v);
}

interface SubmissionBody {
  token?: unknown;
  record?: unknown;
  turnstileToken?: unknown;
}

export async function POST(request: Request) {
  let body: SubmissionBody;
  try {
    body = (await request.json()) as SubmissionBody;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const token = s(body.token, 200);
  const ip = getClientIp(request);
  const rl = await rateLimitOk({ ip, scope: 'secure-verification', max: 5, windowMs: 15 * 60 * 1000 });
  if (!rl.ok) {
    return NextResponse.json(
      { error: 'Too many requests. Please wait a few minutes and try again.' },
      { status: 429 },
    );
  }
  const ts = await verifyTurnstile(
    typeof body.turnstileToken === 'string' ? body.turnstileToken : null,
    ip,
  );
  if (!ts.ok) {
    return NextResponse.json(
      { error: ts.message, code: ts.code },
      { status: ts.code === 'TURNSTILE_NETWORK_ERROR' ? 503 : 400 },
    );
  }
  if (!token || token.length < 16) {
    return NextResponse.json({ error: 'Invalid or missing token.' }, { status: 400 });
  }

  const tokenRecord = await consumeVerificationToken(token);
  if (!tokenRecord) {
    return NextResponse.json(
      { error: 'This verification link is invalid, expired or already used.' },
      { status: 403 },
    );
  }

  const inputRaw = (body.record ?? {}) as Record<string, unknown>;
  const category = inputRaw.category;
  if (!isApplicantCategory(category)) {
    return NextResponse.json(
      { error: 'PoliceStationRepUK does not accept this category.' },
      { status: 400 },
    );
  }

  const fullLegalName = s(inputRaw.fullLegalName, 200);
  const publicDisplayName = s(inputRaw.publicDisplayName, 200) || fullLegalName;
  const mobile = s(inputRaw.mobile, 40);
  const fullPostalAddress = s(inputRaw.fullPostalAddress, 1000);
  const firmName = s(inputRaw.firmName, 200);
  const firmAddress = s(inputRaw.firmAddress, 500);
  const firmEmail = s(inputRaw.firmEmail, 320).toLowerCase();
  const sraNumber = s(inputRaw.sraNumber, 40);
  const pinNumber = s(inputRaw.pinNumber, 40);
  const accreditationProofFile = s(inputRaw.accreditationProofFile, 500);
  const professionalProfileUrl = s(inputRaw.professionalProfileUrl, 500);
  const countiesCovered = arr(inputRaw.countiesCovered, 60);
  const townsCovered = s(inputRaw.townsCovered, 2000);
  const stationsCovered = arr(inputRaw.stationsCovered, 200);
  const availability = s(inputRaw.availability, 400);
  const travelRadius = s(inputRaw.travelRadius, 200);
  const languages = s(inputRaw.languages, 200);
  const publicProfileNotes = s(inputRaw.publicProfileNotes, 4000);
  const publicPhone = s(inputRaw.publicPhone, 40);
  const publicEmail = s(inputRaw.publicEmail, 320).toLowerCase();
  const consentsRaw = (inputRaw.consents ?? {}) as Record<string, unknown>;

  if (firmEmail && !EMAIL_RE.test(firmEmail)) {
    return NextResponse.json({ error: 'Invalid firm email.' }, { status: 400 });
  }
  if (publicEmail && !EMAIL_RE.test(publicEmail)) {
    return NextResponse.json({ error: 'Invalid public email.' }, { status: 400 });
  }

  if (!fullLegalName || !mobile || !fullPostalAddress) {
    return NextResponse.json(
      { error: 'Full legal name, mobile and full postal address are required.' },
      { status: 400 },
    );
  }

  // Strict eligibility checks
  if (looksIneligible(publicProfileNotes, fullLegalName)) {
    return NextResponse.json(
      {
        error:
          'PoliceStationRepUK does not list probationary representatives, trainees or unaccredited applicants.',
      },
      { status: 400 },
    );
  }

  if (category === 'psras-accredited') {
    if (!pinNumber) {
      return NextResponse.json(
        { error: 'PSRAS accreditation requires a PIN / LAA police station representative number.' },
        { status: 400 },
      );
    }
    if (!accreditationProofFile) {
      return NextResponse.json(
        { error: 'PSRAS accreditation requires proof of accreditation.' },
        { status: 400 },
      );
    }
  }
  if (category === 'duty-solicitor' || category === 'solicitor') {
    if (!sraNumber) {
      return NextResponse.json(
        { error: 'Solicitor and duty solicitor verification requires an SRA number.' },
        { status: 400 },
      );
    }
  }

  // All consents must be true
  const consents = {
    confirmsAccurate: bool(consentsRaw.confirmsAccurate),
    confirmsEligible: bool(consentsRaw.confirmsEligible),
    understandsIneligibility: bool(consentsRaw.understandsIneligibility),
    consentsToVerificationChecks: bool(consentsRaw.consentsToVerificationChecks),
    understandsPrivacy: bool(consentsRaw.understandsPrivacy),
    willKeepDetailsCurrent: bool(consentsRaw.willKeepDetailsCurrent),
    understandsConsequencesOfFalseInfo: bool(consentsRaw.understandsConsequencesOfFalseInfo),
  };
  if (Object.values(consents).some((v) => !v)) {
    return NextResponse.json(
      { error: 'All declarations must be ticked.' },
      { status: 400 },
    );
  }

  const record: RepVerificationRecord = {
    email: tokenRecord.email,
    fullLegalName,
    publicDisplayName,
    mobile,
    fullPostalAddress,
    firmName,
    firmAddress,
    firmEmail,
    sraNumber,
    pinNumber,
    accreditationProofFile,
    professionalProfileUrl,
    category,
    countiesCovered,
    townsCovered,
    stationsCovered,
    availability,
    travelRadius,
    overnightAvailability: bool(inputRaw.overnightAvailability),
    weekendAvailability: bool(inputRaw.weekendAvailability),
    languages,
    publicProfileNotes,
    acceptsDirectFirmInstructions: bool(inputRaw.acceptsDirectFirmInstructions),
    publicPhoneConsent: bool(inputRaw.publicPhoneConsent),
    publicEmailConsent: bool(inputRaw.publicEmailConsent),
    publicPhone: bool(inputRaw.publicPhoneConsent) ? publicPhone : '',
    publicEmail: bool(inputRaw.publicEmailConsent) ? publicEmail : '',
    consents,
    ipAddress: ip,
    userAgent: (request.headers.get('user-agent') || '').slice(0, 500),
    submittedAt: new Date().toISOString(),
  };

  try {
    await saveVerification(record);
  } catch (err) {
    console.error('[secure-rep-verification] save failed:', err);
    return NextResponse.json({ error: 'Could not save submission. Please try again.' }, { status: 502 });
  }

  // Move the enquiry status forward.
  try {
    const enquiry = await getEnquiryByEmail(tokenRecord.email);
    if (enquiry) {
      await updateEnquiryStatus(enquiry.id, {
        status: 'verification-submitted',
        verificationSubmittedAt: record.submittedAt,
      });
    }
  } catch (err) {
    console.warn('[secure-rep-verification] enquiry status update failed:', err);
  }

  // Regulatory directory check (SRA + Law Society + DSCC). On match, auto-approve;
  // otherwise email robertdavidcashman@gmail.com and hold for manual review.
  try {
    const existingReview = await getReview(tokenRecord.email);
    const autoPass = await runNewRepRegulatoryVerification({
      email: tokenRecord.email,
      name: fullLegalName,
      sraNumber,
      pinNumber,
      category,
      firmName,
      existingReview,
      reviewer: 'system:secure-verification',
      source: 'secure-verification',
    });
    if (autoPass.applied) {
      sendContactNotification({
        name: `Auto-verified: ${fullLegalName}`,
        email: tokenRecord.email,
        subject: 'PoliceStationRepUK — directory verification passed',
        message: [
          `Email: ${tokenRecord.email}`,
          `Register match: ${autoPass.check.passSource}`,
          autoPass.check.note,
          '',
          'Profile is now public pending any admin override.',
        ].join('\n'),
      }).catch((err) => console.warn('[secure-rep-verification] notify failed:', err));
      return NextResponse.json({ ok: true, autoVerified: true });
    }
  } catch (err) {
    console.warn('[secure-rep-verification] regulatory auto-pass failed:', err);
  }

  // No register match — hold for manual admin review (no-match email already sent).
  try {
    await setReview(
      tokenRecord.email,
      {
        status: 'pending',
        verificationStatus: 'verification-submitted',
        adminApproved: false,
        isPublic: false,
        adminNotes: `[auto] Verification submitted ${record.submittedAt} from ip=${ip}. Awaiting admin approval (no SRA/DSCC register match).`,
      },
      'system@policestationrepuk',
    );
  } catch (err) {
    console.warn('[secure-rep-verification] review update failed:', err);
  }

  // Best-effort admin notification.
  sendContactNotification({
    name: `Verification submitted: ${fullLegalName}`,
    email: tokenRecord.email,
    subject: 'New secure verification submission',
    message: [
      `Email: ${tokenRecord.email}`,
      `Category: ${category}`,
      `PIN: ${pinNumber || '—'}`,
      `SRA: ${sraNumber || '—'}`,
      `Firm: ${firmName || '—'}`,
      `Counties: ${countiesCovered.join(', ') || '—'}`,
      `Stations: ${stationsCovered.length}`,
      `IP: ${ip}`,
      '',
      'Review at /admin (Rep Verification Audit). Profile is NOT public until admin approves.',
    ].join('\n'),
  }).catch((err) => console.warn('[secure-rep-verification] notify failed:', err));

  return NextResponse.json({ ok: true, autoVerified: false });
}
