/**
 * Self-serve representative registration.
 *
 * Behaviour (per directive 2026-05-21):
 *   1. Applicant first clears a public eligibility gate at /api/register/gate
 *      (Turnstile + email-code + risk scoring on email + category + PIN/SRA).
 *      On success the gate mints a one-shot `register-gate-token:{token}` KV
 *      record bound to the applicant's email and returns it to the client.
 *   2. This endpoint accepts the full profile, requires that gate token in the
 *      body, and refuses to persist anything unless the token is valid,
 *      unused, unexpired and bound to the same email.
 *   3. We still re-validate hard eligibility (PSRAS / duty solicitor /
 *      solicitor, no probationary/trainee/unaccredited) and require at least
 *      one of: DSCC PIN, SRA number, proof-of-accreditation URL — never trust
 *      that the gate stage was honest.
 *   4. We run automatic risk scoring (lib/rep-risk.ts) on the full profile.
 *   5. If risk = `low` AND there is no missing-evidence flag, we auto-
 *      publish: write the `newrep:{email}` row + `repreview:{email}` record
 *      with verified status + admin-approved + isPublic + a fresh
 *      lastVerifiedDate. An FYI email goes to the admin.
 *   6. Otherwise we save the same row but with `awaiting-evidence` status and
 *      adminApproved=false. The profile is NOT visible publicly and a
 *      "held for review" email is sent to the admin so they can decide.
 *
 * The full registration form HTML never renders for unauthenticated visitors
 * (see app/register/RegisterForm.tsx) and direct POSTs to this endpoint
 * without a valid gate token return 403. That makes /api/register effectively
 * non-public even though /register remains in the routing table.
 */

import { NextResponse } from 'next/server';
import { getClientIp, rateLimitOk } from '@/lib/contact-guards';
import { saveRegistration, getRawReps } from '@/lib/data';
import { setReview } from '@/lib/admin-review';
import {
  sendRepAutoPublishAdminAlert,
  sendRepHeldForReviewAlert,
  sendApplicantRegistrationOutcome,
} from '@/lib/email';
import {
  APPLICANT_CATEGORY_LABELS,
  APPLICANT_CATEGORY_VALUES,
  type ApplicantCategory,
  type PublicVerifiedStatus,
  looksIneligible,
} from '@/lib/rep-status';
import { scoreRepRisk } from '@/lib/rep-risk';
import { consumeRegisterGateToken } from '@/lib/rep-verification';
import { getKV } from '@/lib/kv';
import {
  countiesToStorageString,
  validateEnglishCountySelections,
} from '@/lib/english-counties';

export const dynamic = 'force-dynamic';

interface RegistrationBody {
  fullName?: unknown;
  email?: unknown;
  mobile?: unknown;
  category?: unknown;
  counties?: unknown;
  stations?: unknown;
  coverageAreas?: unknown;
  availability?: unknown;
  publicNotes?: unknown;
  /** DSCC / police-station PIN (PSRAS reps). */
  pinNumber?: unknown;
  /** SRA number (solicitors / duty solicitors). */
  sraNumber?: unknown;
  /** Public URL to proof of accreditation (cert, profile page, etc.). */
  proofUrl?: unknown;
  firmName?: unknown;
  firmAddress?: unknown;
  firmEmail?: unknown;
  websiteUrl?: unknown;
  whatsappLink?: unknown;
  professionalProfileUrl?: unknown;
  languages?: unknown;
  specialisms?: unknown;
  yearsExperience?: unknown;
  /** Private — never shown publicly. */
  fullPostalAddress?: unknown;
  /** Consents. */
  confirmAccredited?: unknown;
  confirmAccurate?: unknown;
  consentPublic?: unknown;
  /** Token minted by POST /api/register/gate after the public eligibility check. */
  gateToken?: unknown;
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

function categoryToAccreditation(category: ApplicantCategory): string {
  return APPLICANT_CATEGORY_LABELS[category];
}

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

function slugForRep(name: string, email: string): string {
  const baseSlug =
    name
      .toLowerCase()
      .normalize('NFKD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '') || 'rep';
  const shortId = email.replace(/[^a-z0-9]/gi, '').slice(0, 8);
  return `${baseSlug}-${shortId}`;
}

export async function POST(request: Request) {
  try {
    const raw = (await request.json()) as RegistrationBody;

    // Silent honeypot — bots get a 200 OK but nothing is stored / notified.
    if (raw._hp) {
      return NextResponse.json({ ok: true, id: 'noop', published: false });
    }

    const fullName = s(raw.fullName, 200);
    const email = s(raw.email, 320).toLowerCase();
    const mobile = s(raw.mobile, 40);
    const counties = s(raw.counties, 500);
    const stations = s(raw.stations, 1500);
    const coverageAreas = s(raw.coverageAreas, 1000);
    const availability = s(raw.availability, 500);
    const publicNotes = s(raw.publicNotes, 2000);
    const pinNumber = s(raw.pinNumber, 80);
    const sraNumber = s(raw.sraNumber, 80);
    const proofUrl = s(raw.proofUrl, 500);
    const firmName = s(raw.firmName, 200);
    const firmAddress = s(raw.firmAddress, 500);
    const firmEmail = s(raw.firmEmail, 320);
    const websiteUrl = s(raw.websiteUrl, 500);
    const whatsappLink = s(raw.whatsappLink, 500);
    const professionalProfileUrl = s(raw.professionalProfileUrl, 500);
    const languages = s(raw.languages, 300);
    const specialisms = s(raw.specialisms, 300);
    const fullPostalAddress = s(raw.fullPostalAddress, 500);
    const yearsRaw = raw.yearsExperience;
    const yearsExperience =
      typeof yearsRaw === 'number' && Number.isFinite(yearsRaw)
        ? Math.max(0, Math.min(60, Math.round(yearsRaw)))
        : typeof yearsRaw === 'string' && yearsRaw.trim() && Number.isFinite(Number(yearsRaw))
          ? Math.max(0, Math.min(60, Math.round(Number(yearsRaw))))
          : undefined;
    const confirmAccredited = raw.confirmAccredited === true;
    const confirmAccurate = raw.confirmAccurate === true;
    const consentPublic = raw.consentPublic !== false; // default-true (registering for a public listing)

    if (!fullName || !email || !mobile) {
      return NextResponse.json(
        { error: 'Full name, email and mobile number are all required.' },
        { status: 400 },
      );
    }
    if (!EMAIL_RE.test(email)) {
      return NextResponse.json({ error: 'Invalid email address.' }, { status: 400 });
    }
    if (!isApplicantCategory(raw.category)) {
      return NextResponse.json(
        {
          error:
            'Please select a valid professional status. PoliceStationRepUK does not list probationary representatives, trainees or unaccredited applicants.',
        },
        { status: 400 },
      );
    }
    const category = raw.category as ApplicantCategory;

    if (!confirmAccredited || !confirmAccurate) {
      return NextResponse.json(
        {
          error:
            'You must confirm you are fully accredited or otherwise professionally entitled to be listed, and that the details you provide are accurate.',
        },
        { status: 400 },
      );
    }

    // Reject text that smells of probationary / trainee / unaccredited.
    if (
      looksIneligible(fullName, publicNotes, coverageAreas) ||
      looksIneligible(firmName, professionalProfileUrl)
    ) {
      return NextResponse.json(
        {
          error:
            'PoliceStationRepUK does not list probationary representatives, trainees or unaccredited applicants. Please re-apply once your accreditation is complete.',
        },
        { status: 400 },
      );
    }

    // Hard rule: PSRAS reps must supply a PIN OR a proof URL.
    // Solicitors/duty solicitors must supply an SRA number.
    if (category === 'psras-accredited') {
      if (!pinNumber && !proofUrl) {
        return NextResponse.json(
          {
            error:
              'PSRAS-accredited representatives must supply either their DSCC / PIN number or a URL to proof of accreditation. Without one we cannot list your profile.',
          },
          { status: 400 },
        );
      }
    } else {
      if (!sraNumber && !proofUrl) {
        return NextResponse.json(
          {
            error:
              `${category === 'duty-solicitor' ? 'Duty solicitors' : 'Solicitors'} must supply either their SRA number or a URL to proof of registration. Without one we cannot list your profile.`,
          },
          { status: 400 },
        );
      }
    }

    if (proofUrl && !URL_RE.test(proofUrl)) {
      return NextResponse.json(
        { error: 'Proof-of-accreditation URL must be a full https:// link.' },
        { status: 400 },
      );
    }
    if (websiteUrl && !URL_RE.test(websiteUrl)) {
      return NextResponse.json(
        { error: 'Your professional website URL must be a full https:// link.' },
        { status: 400 },
      );
    }
    if (professionalProfileUrl && !URL_RE.test(professionalProfileUrl)) {
      return NextResponse.json(
        { error: 'Your professional profile URL must be a full https:// link.' },
        { status: 400 },
      );
    }
    if (firmEmail && !EMAIL_RE.test(firmEmail)) {
      return NextResponse.json(
        { error: 'Firm email address looks invalid.' },
        { status: 400 },
      );
    }

    const ip = getClientIp(request);
    const rl = await rateLimitOk({ ip, scope: 'register', max: 5, windowMs: 15 * 60 * 1000 });
    if (!rl.ok) {
      return NextResponse.json(
        { error: 'Too many requests. Please wait a few minutes and try again.' },
        { status: 429 },
      );
    }

    /* ----- Gate token (mandatory) ----- */

    const gateToken = typeof raw.gateToken === 'string' ? raw.gateToken.trim() : '';
    if (!gateToken) {
      return NextResponse.json(
        {
          error:
            'Registration must start from the public eligibility check. Please reload /register and complete it again.',
          requiresGate: true,
        },
        { status: 403 },
      );
    }

    const gateRecord = await consumeRegisterGateToken(gateToken);
    if (!gateRecord) {
      return NextResponse.json(
        {
          error:
            'Your eligibility token has expired or already been used. Please reload /register and start again.',
          requiresGate: true,
        },
        { status: 403 },
      );
    }
    if (gateRecord.email !== email) {
      return NextResponse.json(
        {
          error:
            'The email address in this form does not match the one verified during the eligibility check. Please reload /register and start again.',
          requiresGate: true,
        },
        { status: 403 },
      );
    }
    if (gateRecord.category !== category) {
      return NextResponse.json(
        {
          error:
            'The professional status in this form does not match the one verified during the eligibility check. Please reload /register and start again.',
          requiresGate: true,
        },
        { status: 403 },
      );
    }

    /* ----- County validation (English counties only) ----- */

    const countyCheck = validateEnglishCountySelections(counties);
    if (!countyCheck.ok) {
      return NextResponse.json({ error: countyCheck.error }, { status: 400 });
    }
    const canonicalCounties = countiesToStorageString(countyCheck.canonical);

    /* ----- Duplicate-rep guard (anti-impersonation) ----- */
    // The registration endpoint is public; without this check anyone could
    // re-POST with a victim's email to rewrite their public name/phone/
    // counties/stations and change their slug (breaking existing URLs/SEO).
    // Both the live KV `newrep:{email}` row and the static data/reps.json
    // seed are consulted before any persistence happens.

    const normalised = { email };
    const kv = getKV();
    if (kv) {
      try {
        const existing = await kv.get(`newrep:${normalised.email}`);
        if (existing) {
          return NextResponse.json(
            {
              error:
                'This email is already registered in our directory. Please log in via the account page to update your listing.',
            },
            { status: 409 },
          );
        }
      } catch (err) {
        console.warn('[register] KV duplicate-check failed:', err);
      }
    }
    const staticDup = getRawReps().find(
      (r) => r.email.toLowerCase() === normalised.email,
    );
    if (staticDup) {
      return NextResponse.json(
        {
          error:
            'This email is already in our directory. Please log in via the account page to update your listing.',
        },
        { status: 409 },
      );
    }

    /* ----------------- Risk scoring ----------------- */

    const countyList = canonicalCounties
      .split(/[,;\n]+/)
      .map((c) => c.trim())
      .filter(Boolean);
    const stationList = stations
      .split(/[,;\n]+/)
      .map((s2) => s2.trim())
      .filter(Boolean);

    const registeredAt = new Date().toISOString();
    const accreditationText = categoryToAccreditation(category);

    const assessment = scoreRepRisk({
      email,
      phone: mobile,
      name: fullName,
      accreditation: accreditationText,
      pinNumber,
      sraNumber,
      accreditationProofFile: proofUrl,
      fullPostalAddress,
      firmName,
      professionalProfileUrl: professionalProfileUrl || websiteUrl,
      counties: countyList,
      stations: stationList,
      notes: publicNotes,
      publicProfileNotes: publicNotes,
      registeredAt,
      lastVerifiedDate: registeredAt,
      ipAddress: ip,
    });

    // Decision: auto-publish iff category is verifiable AND risk is low AND
    // the applicant supplied at least one strong evidence signal AND the gate
    // stage did not already mark this submission as pending manual review.
    //
    // The gate route persists `riskCategory='medium'` on the gate token when
    // any decisive risk flag fired (e.g. solicitor without SRA number).
    // Even if the full payload looks clean, we honour that decision so the
    // listing always lands in the admin queue rather than auto-publishing.
    const gateMarkedPending =
      gateRecord.riskCategory && gateRecord.riskCategory !== 'low';
    const hasStrongEvidence = Boolean(
      (category === 'psras-accredited' && (pinNumber || proofUrl)) ||
        (category !== 'psras-accredited' && (sraNumber || proofUrl)),
    );
    const autoPublish =
      !gateMarkedPending &&
      hasStrongEvidence &&
      assessment.category === 'low' &&
      assessment.highRiskFlags.length === 0;

    const userAgent = (request.headers.get('user-agent') || '').slice(0, 500);
    const slug = slugForRep(fullName, email);

    /* ----------------- Persist registration ----------------- */

    await saveRegistration({
      email,
      name: fullName,
      phone: mobile,
      accreditation: accreditationText,
      counties: canonicalCounties,
      stations,
      coverage_areas: coverageAreas,
      availability,
      message: publicNotes,
      website_url: websiteUrl,
      whatsapp_link: whatsappLink,
      dscc_pin: pinNumber,
      sra_number: sraNumber,
      firm_name: firmName,
      firm_address: firmAddress,
      firm_email: firmEmail,
      proof_url: proofUrl,
      professional_profile_url: professionalProfileUrl,
      languages,
      specialisms,
      years_experience: yearsExperience,
      full_postal_address: fullPostalAddress,
      ipAddress: ip,
      userAgent,
      registeredAt,
    });

    /* ----------------- Update admin review record ----------------- */

    const verifiedStatus = categoryToVerifiedStatus(category);
    await setReview(
      email,
      autoPublish
        ? {
            status: 'approved',
            verificationStatus: verifiedStatus,
            adminApproved: true,
            isPublic: consentPublic !== false,
            lastVerifiedDate: registeredAt,
            riskCategory: assessment.category,
            riskReasons: assessment.reasons,
            adminNotes:
              `Auto-published via /register on ${registeredAt}. ` +
              `Risk: ${assessment.category}. ` +
              (assessment.lowRiskIndicators.length
                ? `Low-risk indicators: ${assessment.lowRiskIndicators.join('; ')}. `
                : ''),
          }
        : {
            status: 'pending',
            verificationStatus: 'awaiting-evidence',
            adminApproved: false,
            isPublic: false,
            lastVerifiedDate: null,
            riskCategory: assessment.category,
            riskReasons: assessment.reasons,
            adminNotes:
              `Held for review via /register on ${registeredAt}. ` +
              `Risk: ${assessment.category}. ` +
              (assessment.reasons.length
                ? `Flags: ${assessment.reasons.join('; ')}.`
                : ''),
          },
      'system:auto-register',
    ).catch((err) => {
      console.error('[register] setReview failed:', err);
    });

    /* ----------------- Fire admin + applicant emails ----------------- */

    const profileUrl = `https://policestationrepuk.org/rep/${slug}`;
    const summary = {
      name: fullName,
      email,
      phone: mobile,
      category: APPLICANT_CATEGORY_LABELS[category],
      accreditation: accreditationText,
      pinNumber,
      sraNumber,
      firmName,
      professionalProfileUrl: professionalProfileUrl || websiteUrl,
      proofUrl,
      counties,
      stations,
      availability,
      publicNotes,
      fullPostalAddress,
      ipAddress: ip,
      userAgent,
      profileUrl,
      riskCategory: assessment.category,
      riskReasons: assessment.reasons,
      registeredAt,
    } as const;

    if (autoPublish) {
      sendRepAutoPublishAdminAlert(summary).catch((err) =>
        console.warn('[register] auto-publish admin alert failed:', err),
      );
    } else {
      sendRepHeldForReviewAlert(summary).catch((err) =>
        console.warn('[register] held-for-review admin alert failed:', err),
      );
    }

    sendApplicantRegistrationOutcome({
      toEmail: email,
      name: fullName,
      published: autoPublish,
      profileUrl,
    }).catch((err) => console.warn('[register] applicant email failed:', err));

    return NextResponse.json({
      ok: true,
      published: autoPublish,
      profileUrl: autoPublish ? profileUrl : null,
      riskCategory: assessment.category,
    });
  } catch (err) {
    console.error('[register] unexpected error:', err);
    return NextResponse.json(
      { error: 'Something went wrong processing your registration. Please try again.' },
      { status: 500 },
    );
  }
}
