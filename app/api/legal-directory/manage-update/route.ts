import { NextResponse } from 'next/server';
import { getClientIp, rateLimitOk } from '@/lib/contact-guards';
import {
  resolveManagementToken,
  applyListingPatch,
  saveListing,
} from '@/lib/legal-directory/storage';
import {
  sanitizeMultiline,
  sanitizeText,
  sanitizeUrl,
  validateDescription,
  containsScriptOrInjection,
} from '@/lib/legal-directory/sanitize';
import { scoreLegalDirectorySubmission } from '@/lib/legal-directory/risk';
import { notifyAdminListingChange } from '@/lib/legal-directory/email';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const raw = (await request.json()) as { token?: unknown; changes?: Record<string, unknown> };
    const token = typeof raw.token === 'string' ? raw.token : '';
    if (!token) {
      return NextResponse.json({ error: 'Invalid or expired link.' }, { status: 403 });
    }

    const ip = getClientIp(request);
    const limit = await rateLimitOk({ ip, scope: 'legal-directory-update', max: 10 });
    if (!limit.ok) {
      return NextResponse.json({ error: 'Too many requests.' }, { status: 429 });
    }

    const resolved = await resolveManagementToken(token);
    if (!resolved) {
      return NextResponse.json({ error: 'Invalid or expired management link.' }, { status: 403 });
    }

    const { listing } = resolved;
    const changes = raw.changes ?? {};
    const patch: Record<string, unknown> = {};

    if (changes.phone) patch.phone = sanitizeText(changes.phone, 40);
    if (changes.websiteUrl) patch.websiteUrl = sanitizeUrl(changes.websiteUrl);
    if (changes.description) {
      const desc = sanitizeMultiline(changes.description, 4000);
      const err = validateDescription(desc);
      if (err) return NextResponse.json({ error: err }, { status: 400 });
      if (containsScriptOrInjection(desc)) {
        return NextResponse.json({ error: 'Invalid content.' }, { status: 400 });
      }
      patch.description = desc;
    }
    if (changes.areasCovered) patch.areasCovered = sanitizeMultiline(changes.areasCovered, 1500);
    if (changes.specialisms) patch.specialisms = sanitizeMultiline(changes.specialisms, 1000);
    if (changes.county) patch.county = sanitizeText(changes.county, 100);
    if (changes.availability24Hour !== undefined) {
      patch.availability24Hour =
        changes.availability24Hour === true || changes.availability24Hour === 'on';
    }

    const risk = scoreLegalDirectorySubmission({
      businessName: listing.businessName,
      email: listing.ownerEmail,
      description: String(patch.description ?? listing.description),
      websiteUrl: String(patch.websiteUrl ?? listing.websiteUrl),
      regulatoryNumber: listing.regulatoryNumber,
      regulatoryBody: listing.regulatoryBody,
      category: listing.categorySlug,
    });

    const updated = await applyListingPatch(listing, patch);
    updated.riskScore = Math.max(updated.riskScore, risk.riskScore);
    updated.reviewFlags = [...new Set([...updated.reviewFlags, ...risk.reviewFlags, 'owner_amendment'])];
    await saveListing(updated);

    await notifyAdminListingChange(updated, 'updated');

    return NextResponse.json({
      ok: true,
      message: 'Your listing has been updated and is live on the directory.',
    });
  } catch (e) {
    console.error('[legal-directory/manage-update]', e);
    return NextResponse.json({ error: 'Server error.' }, { status: 500 });
  }
}
