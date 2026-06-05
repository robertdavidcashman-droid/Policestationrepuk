import { NextResponse } from 'next/server';
import { getClientIp, rateLimitOk, validateContactTiming } from '@/lib/contact-guards';
import {
  getListingBySlug,
  claimSeededListing,
  issueManagementTokenForListing,
  sanitizeText,
} from '@/lib/legal-directory/storage';
import { isUnclaimedSeededListing } from '@/lib/legal-directory/laa-seed';
import { applyAutoVerificationToListing } from '@/lib/legal-directory/auto-verify';
import { isValidEmail, normalizeEmail } from '@/lib/legal-directory/sanitize';
import {
  notifyAdminListingChange,
  sendLegalDirectoryManagementLink,
} from '@/lib/legal-directory/email';

export const dynamic = 'force-dynamic';

const GENERIC_OK =
  'Thank you. If this listing can be claimed, we have emailed a secure link to manage it. Check your inbox and spam folder.';

export async function POST(request: Request) {
  try {
    const raw = (await request.json()) as Record<string, unknown>;
    if (raw._hp) return NextResponse.json({ ok: true, message: GENERIC_OK });

    const timing = validateContactTiming(raw._startedAt);
    if (!timing.ok) {
      return NextResponse.json({ error: timing.error }, { status: timing.status });
    }

    const ip = getClientIp(request);
    const limit = await rateLimitOk({ ip, scope: 'legal-directory-claim', max: 5 });
    if (!limit.ok) {
      return NextResponse.json({ error: 'Too many requests. Please try again later.' }, { status: 429 });
    }

    const slug = sanitizeText(raw.slug, 160);
    const email = normalizeEmail(sanitizeText(raw.email, 320));
    const contactPerson = sanitizeText(raw.contactPerson, 120);
    const phone = sanitizeText(raw.phone, 40);
    const websiteUrl = sanitizeText(raw.websiteUrl, 500);
    const regulatoryBody = sanitizeText(raw.regulatoryBody, 120);
    const regulatoryNumber = sanitizeText(raw.regulatoryNumber, 80);

    if (!slug || !email) {
      return NextResponse.json({ error: 'Listing and email are required.' }, { status: 400 });
    }
    if (!isValidEmail(email)) {
      return NextResponse.json({ error: 'Invalid email address.' }, { status: 400 });
    }
    if (raw.consentAuthority !== true && raw.consentAuthority !== 'on') {
      return NextResponse.json({ error: 'Please confirm you are authorised to claim this listing.' }, { status: 400 });
    }

    const listing = await getListingBySlug(slug);
    // Privacy: don't reveal whether a given slug is claimable.
    if (!listing || !isUnclaimedSeededListing(listing)) {
      return NextResponse.json({ ok: true, message: GENERIC_OK });
    }

    const claimed = await claimSeededListing(listing, { email, contactPerson, phone, websiteUrl });
    if (!claimed.ok) {
      return NextResponse.json({ error: claimed.error }, { status: 400 });
    }

    let toVerify = claimed.listing;
    if (regulatoryBody || regulatoryNumber) {
      toVerify = { ...toVerify, regulatoryBody, regulatoryNumber };
    }
    const verifyResult = await applyAutoVerificationToListing(toVerify).catch((err) => {
      console.warn('[legal-directory/claim] auto-verify failed:', err);
      return null;
    });
    const finalListing = verifyResult?.listing ?? claimed.listing;

    const token = await issueManagementTokenForListing(finalListing);
    if (token) {
      await sendLegalDirectoryManagementLink({ to: email, token }).catch((err) =>
        console.warn('[legal-directory/claim] management email failed:', err),
      );
    }
    await notifyAdminListingChange(finalListing, 'claimed').catch(() => undefined);

    return NextResponse.json({ ok: true, message: GENERIC_OK });
  } catch (e) {
    console.error('[legal-directory/claim]', e);
    return NextResponse.json({ error: 'Server error.' }, { status: 500 });
  }
}
