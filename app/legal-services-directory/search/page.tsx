import { Suspense } from 'react';
import { buildMetadata } from '@/lib/seo';
import { LegalDirectoryHero } from '@/components/legal-directory/LegalDirectoryHero';
import { DirectorySearchFilters } from '@/components/legal-directory/DirectorySearchFilters';
import { LegalDirectoryCard } from '@/components/legal-directory/LegalDirectoryCard';
import { LegalDirectoryDisclaimer } from '@/components/legal-directory/LegalDirectoryDisclaimer';
import { UnclaimedListingsBanner } from '@/components/legal-directory/UnclaimedListingsBanner';
import { LEGAL_DIRECTORY_BASE } from '@/lib/legal-directory/constants';
import {
  filterListings,
  listApprovedListings,
  toPublicListing,
} from '@/lib/legal-directory/storage';
import type { LegalAidStatus } from '@/lib/legal-directory/types';

export const metadata = buildMetadata({
  title: 'Search Legal Services Directory',
  description: 'Search criminal law and criminal justice service providers by category, location, Legal Aid, and specialism.',
  path: `${LEGAL_DIRECTORY_BASE}/search`,
});

export const dynamic = 'force-dynamic';

type SearchParams = Promise<{
  q?: string;
  category?: string;
  county?: string;
  town?: string;
  region?: string;
  legalAid?: string;
  availability24Hour?: string;
  claimed?: string;
  verifiedOnly?: string;
}>;

export default async function SearchPage({ searchParams }: { searchParams: SearchParams }) {
  const sp = await searchParams;
  const all = await listApprovedListings();
  const claimedFilter =
    sp.claimed === 'yes' || sp.claimed === 'no' ? (sp.claimed as 'yes' | 'no') : undefined;
  const results = filterListings(all, {
    q: sp.q,
    categorySlug: sp.category,
    county: sp.county,
    town: sp.town,
    region: sp.region,
    legalAid: sp.legalAid as LegalAidStatus | undefined,
    availability24Hour: sp.availability24Hour === '1',
    claimed: claimedFilter,
    verifiedOnly: sp.verifiedOnly === '1',
    featuredFirst: true,
  }).map(toPublicListing);
  const unclaimedCount = results.filter((l) => l.unclaimedSeeded).length;

  return (
    <>
      <LegalDirectoryHero
        title="Search the Directory"
        description="Only approved listings appear in search results."
        breadcrumbs={[
          { label: 'Home', href: '/' },
          { label: 'Legal Services Directory', href: LEGAL_DIRECTORY_BASE },
          { label: 'Search' },
        ]}
      />
      <div className="page-container section-pad space-y-8">
        <Suspense fallback={<p className="text-sm text-[var(--muted)]">Loading filters…</p>}>
          <DirectorySearchFilters />
        </Suspense>

        <UnclaimedListingsBanner unclaimedCount={unclaimedCount} compact />

        <p className="text-sm font-semibold text-[var(--navy)]">
          {results.length} result{results.length === 1 ? '' : 's'}
        </p>

        {results.length === 0 ? (
          <div className="card-surface p-8 text-center">
            <p className="text-[var(--muted)]">No approved listings match your filters yet.</p>
            <a href={`${LEGAL_DIRECTORY_BASE}/add-listing`} className="btn-gold mt-4 inline-block no-underline">
              Add a free listing
            </a>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {results.map((l) => (
              <LegalDirectoryCard key={l.id} listing={l} />
            ))}
          </div>
        )}

        <LegalDirectoryDisclaimer />
      </div>
    </>
  );
}
