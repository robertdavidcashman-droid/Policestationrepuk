import { NextResponse } from 'next/server';
import { getClientIp, rateLimitOk } from '@/lib/contact-guards';
import { resolveManagementToken, saveListing } from '@/lib/legal-directory/storage';
import { sendLegalDirectoryAdminAlert } from '@/lib/legal-directory/email';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const raw = (await request.json()) as { token?: unknown };
    const token = typeof raw.token === 'string' ? raw.token : '';
    if (!token) {
      return NextResponse.json({ error: 'Invalid link.' }, { status: 403 });
    }

    const ip = getClientIp(request);
    const limit = await rateLimitOk({ ip, scope: 'legal-directory-delete', max: 5 });
    if (!limit.ok) {
      return NextResponse.json({ error: 'Too many requests.' }, { status: 429 });
    }

    const resolved = await resolveManagementToken(token);
    if (!resolved) {
      return NextResponse.json({ error: 'Invalid or expired management link.' }, { status: 403 });
    }

    const { listing } = resolved;
    listing.status = 'deletion_requested';
    listing.deletionRequestedAt = new Date().toISOString();
    listing.reviewFlags = [...new Set([...listing.reviewFlags, 'deletion_requested'])];
    await saveListing(listing);

    await sendLegalDirectoryAdminAlert({
      subject: `[Legal Directory] Deletion request — ${listing.businessName}`,
      bodyHtml: `<p>Deletion requested for <strong>${listing.businessName}</strong> (${listing.ownerEmail}).</p>`,
    });

    return NextResponse.json({
      ok: true,
      message:
        'Your deletion request has been submitted. An administrator will review it. Your listing remains visible until deletion is approved.',
    });
  } catch (e) {
    console.error('[legal-directory/manage-delete]', e);
    return NextResponse.json({ error: 'Server error.' }, { status: 500 });
  }
}
