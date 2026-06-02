import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-auth';
import {
  applyPendingChanges,
  getListingById,
  saveListing,
} from '@/lib/legal-directory/storage';
import { sanitizeMultiline, sanitizeText, sanitizeUrl } from '@/lib/legal-directory/sanitize';
import type { LegalDirectoryVerificationStatus } from '@/lib/legal-directory/types';
import type { LegalDirectoryListingStatus } from '@/lib/legal-directory/types';

export const dynamic = 'force-dynamic';

type RouteCtx = { params: Promise<{ id: string }> };

export async function GET(_req: Request, ctx: RouteCtx) {
  const auth = await requireAdmin();
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }
  const { id } = await ctx.params;
  const listing = await getListingById(id);
  if (!listing) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json({ ok: true, listing });
}

export async function PATCH(request: Request, ctx: RouteCtx) {
  const auth = await requireAdmin();
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { id } = await ctx.params;
  const listing = await getListingById(id);
  if (!listing) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const body = (await request.json()) as Record<string, unknown>;
  const action = typeof body.action === 'string' ? body.action : '';

  switch (action) {
    case 'approve':
      listing.status = 'approved';
      listing.dateApproved = new Date().toISOString();
      listing.pendingChanges = null;
      break;
    case 'reject':
      listing.status = 'rejected';
      break;
    case 'flag':
      listing.status = 'flagged_for_review';
      break;
    case 'suspend':
      listing.status = 'suspended';
      break;
    case 'approve_amendment': {
      const updated = await applyPendingChanges(id, auth.email);
      if (!updated) {
        return NextResponse.json({ error: 'No pending changes' }, { status: 400 });
      }
      return NextResponse.json({ ok: true, listing: updated });
    }
    case 'reject_amendment':
      listing.pendingChanges = null;
      listing.status = 'approved';
      break;
    case 'approve_deletion':
      listing.status = 'deleted';
      listing.deletionRequestedAt = new Date().toISOString();
      break;
    case 'reject_deletion':
      listing.status = 'approved';
      listing.deletionRequestedAt = null;
      break;
    case 'soft_delete':
      listing.status = 'deleted';
      break;
    case 'set_featured':
      listing.featured = body.featured === true;
      break;
    case 'set_promoted':
      listing.promoted = body.promoted === true;
      break;
    case 'set_verified':
      listing.verified = body.verified === true;
      break;
    case 'set_verification_provenance': {
      if (typeof body.sourceUrl === 'string') {
        listing.sourceUrl = sanitizeUrl(body.sourceUrl);
      }
      if (typeof body.dateVerified === 'string' && body.dateVerified.trim()) {
        listing.dateVerified = body.dateVerified.trim().slice(0, 10);
      }
      if (body.verificationStatus === 'verified' || body.verificationStatus === 'unverified') {
        listing.verificationStatus = body.verificationStatus as LegalDirectoryVerificationStatus;
      }
      if (listing.verificationStatus === 'verified' && !listing.dateVerified) {
        listing.dateVerified = new Date().toISOString().slice(0, 10);
      }
      break;
    }
    case 'set_status':
      if (typeof body.status === 'string') {
        listing.status = body.status as LegalDirectoryListingStatus;
      }
      break;
    case 'set_notes':
      listing.moderationNotes = sanitizeMultiline(body.moderationNotes, 4000);
      break;
    default:
      if (body.businessName) listing.businessName = sanitizeText(body.businessName, 200);
      if (body.description) listing.description = sanitizeMultiline(body.description, 4000);
      if (body.moderationNotes) listing.moderationNotes = sanitizeMultiline(body.moderationNotes, 4000);
  }

  await saveListing(listing);
  return NextResponse.json({ ok: true, listing });
}
