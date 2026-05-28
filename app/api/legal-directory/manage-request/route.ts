import { NextResponse } from 'next/server';
import { getClientIp, rateLimitOk } from '@/lib/contact-guards';
import {
  getListingByOwnerEmail,
  issueManagementTokenForListing,
} from '@/lib/legal-directory/storage';
import { isValidEmail, normalizeEmail, sanitizeText } from '@/lib/legal-directory/sanitize';
import { sendLegalDirectoryManagementLink } from '@/lib/legal-directory/email';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const raw = (await request.json()) as Record<string, unknown>;
    if (raw._hp) {
      return NextResponse.json({ ok: true, message: 'If a listing exists, a link has been sent.' });
    }

    const ip = getClientIp(request);
    const limit = await rateLimitOk({ ip, scope: 'legal-directory-manage', max: 5 });
    if (!limit.ok) {
      return NextResponse.json({ error: 'Too many requests.' }, { status: 429 });
    }

    const email = normalizeEmail(sanitizeText(raw.email, 320));
    if (!email || !isValidEmail(email)) {
      return NextResponse.json({ error: 'Valid email required.' }, { status: 400 });
    }

    const listing = await getListingByOwnerEmail(email);
    const genericMessage =
      'If a listing exists for this email address, we have sent a secure management link. Check your inbox and spam folder.';

    // Do not reveal whether a listing exists for this email (privacy / enumeration).
    if (!listing || listing.status === 'deleted') {
      return NextResponse.json({ ok: true, message: genericMessage });
    }

    const token = await issueManagementTokenForListing(listing);
    if (token) {
      await sendLegalDirectoryManagementLink({ to: email, token });
    }

    return NextResponse.json({ ok: true, message: genericMessage });
  } catch (e) {
    console.error('[legal-directory/manage-request]', e);
    return NextResponse.json({ error: 'Server error.' }, { status: 500 });
  }
}
