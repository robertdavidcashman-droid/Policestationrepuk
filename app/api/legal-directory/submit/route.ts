import { NextResponse } from 'next/server';
import { getClientIp, rateLimitOk, validateContactTiming } from '@/lib/contact-guards';
import { getCategoryBySlug } from '@/lib/legal-directory/categories';
import {
  createListing,
  parseBooleanField,
  parseLegalAidStatus,
  sanitizeMultiline,
  sanitizeText,
} from '@/lib/legal-directory/storage';
import {
  containsScriptOrInjection,
  isValidEmail,
  normalizeEmail,
  validateDescription,
} from '@/lib/legal-directory/sanitize';
import {
  notifyAdminFlagged,
  notifyAdminNewListing,
  sendLegalDirectoryListingReceived,
} from '@/lib/legal-directory/email';
import { getListingById } from '@/lib/legal-directory/storage';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const raw = (await request.json()) as Record<string, unknown>;

    if (raw._hp) {
      return NextResponse.json({ ok: true, message: 'Received.' });
    }

    const timing = validateContactTiming(raw._startedAt);
    if (!timing.ok) {
      return NextResponse.json({ error: timing.error }, { status: timing.status });
    }

    const ip = getClientIp(request);
    const limit = await rateLimitOk({ ip, scope: 'legal-directory-submit', max: 5 });
    if (!limit.ok) {
      return NextResponse.json({ error: 'Too many submissions. Please try again later.' }, { status: 429 });
    }

    // Detect injection attempts on the RAW input before HTML is stripped, so we
    // can flag for admin review rather than silently neutralising and publishing.
    const rawTextBlob = [raw.businessName, raw.description, raw.websiteUrl, raw.specialisms]
      .map((v) => (typeof v === 'string' ? v : ''))
      .join(' ');
    const scriptAttempt = containsScriptOrInjection(rawTextBlob);

    const businessName = sanitizeText(raw.businessName, 200);
    const email = normalizeEmail(sanitizeText(raw.email, 320));
    const phone = sanitizeText(raw.phone, 40);
    const town = sanitizeText(raw.town, 100);
    const county = sanitizeText(raw.county, 100);
    const categorySlug = sanitizeText(raw.categorySlug, 80);
    const description = sanitizeMultiline(raw.description, 4000);
    const areasCovered = sanitizeMultiline(raw.areasCovered, 1500);

    if (!businessName || !email || !phone || !town || !county || !categorySlug) {
      return NextResponse.json({ error: 'Please complete all required fields.' }, { status: 400 });
    }
    if (!isValidEmail(email)) {
      return NextResponse.json({ error: 'Invalid email address.' }, { status: 400 });
    }
    if (!getCategoryBySlug(categorySlug)) {
      return NextResponse.json({ error: 'Please select a valid category.' }, { status: 400 });
    }
    const descErr = validateDescription(description);
    if (descErr) {
      return NextResponse.json({ error: descErr }, { status: 400 });
    }
    if (raw.consentAuthority !== true && raw.consentAuthority !== 'on') {
      return NextResponse.json({ error: 'Authority consent is required.' }, { status: 400 });
    }
    if (raw.consentGdpr !== true && raw.consentGdpr !== 'on') {
      return NextResponse.json({ error: 'Privacy consent is required.' }, { status: 400 });
    }

    const cat = getCategoryBySlug(categorySlug)!;
    const result = await createListing({
      businessName,
      providerType: cat.providerType,
      categorySlug,
      contactPerson: sanitizeText(raw.contactPerson, 120),
      email,
      phone,
      emergencyPhone: sanitizeText(raw.emergencyPhone, 40),
      websiteUrl: sanitizeText(raw.websiteUrl, 500),
      addressLine1: sanitizeText(raw.addressLine1, 200),
      addressLine2: sanitizeText(raw.addressLine2, 200),
      town,
      county,
      postcode: sanitizeText(raw.postcode, 20),
      region: sanitizeText(raw.region, 80),
      areasCovered,
      policeStationsCovered: sanitizeMultiline(raw.policeStationsCovered, 1500),
      courtsCovered: sanitizeMultiline(raw.courtsCovered, 1500),
      description,
      specialisms: sanitizeMultiline(raw.specialisms, 1000),
      legalAidStatus: parseLegalAidStatus(raw.legalAidStatus),
      availability24Hour: parseBooleanField(raw.availability24Hour),
      regulatoryBody: sanitizeText(raw.regulatoryBody, 120),
      regulatoryNumber: sanitizeText(raw.regulatoryNumber, 80),
      accreditationDetails: sanitizeMultiline(raw.accreditationDetails, 1000),
      consentAuthority: true,
      consentGdpr: true,
      honeypotFilled: false,
      scriptAttempt,
      submitterIp: ip,
    });

    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    const listing = await getListingById(result.id);
    if (listing) {
      await Promise.all([
        sendLegalDirectoryListingReceived({
          to: email,
          businessName,
          status: result.status,
        }),
        notifyAdminNewListing(listing),
        listing.riskScore >= 51 || listing.status === 'flagged_for_review'
          ? notifyAdminFlagged({
              title: listing.businessName,
              detail: 'High-risk legal directory submission',
              riskScore: listing.riskScore,
              flags: listing.reviewFlags,
            })
          : Promise.resolve(),
      ]);
    }

    return NextResponse.json({
      ok: true,
      message:
        'Thank you. Your listing has been received and will be reviewed before publication. Suspicious or incomplete submissions are never published automatically.',
    });
  } catch (e) {
    console.error('[legal-directory/submit]', e);
    return NextResponse.json({ error: 'Server error.' }, { status: 500 });
  }
}
