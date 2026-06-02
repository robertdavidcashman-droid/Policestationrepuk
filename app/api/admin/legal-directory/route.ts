import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-auth';
import { listAllListings, listAllRequests } from '@/lib/legal-directory/storage';
import { isUnclaimedSeededListing } from '@/lib/legal-directory/laa-seed';

export const dynamic = 'force-dynamic';

export async function GET() {
  const auth = await requireAdmin();
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const listings = await listAllListings();
  const requests = await listAllRequests();

  return NextResponse.json({
    ok: true,
    listings: listings.map((l) => ({
      id: l.id,
      businessName: l.businessName,
      slug: l.slug,
      status: l.status,
      categorySlug: l.categorySlug,
      county: l.county,
      riskScore: l.riskScore,
      reviewFlags: l.reviewFlags,
      featured: l.featured,
      promoted: l.promoted,
      verified: l.verified,
      dateSubmitted: l.dateSubmitted,
      ownerEmail: l.ownerEmail,
      hasPendingChanges: Boolean(l.pendingChanges),
      verificationStatus: l.verificationStatus,
      unclaimedSeeded: isUnclaimedSeededListing(l),
    })),
    requests,
  });
}
