import Link from 'next/link';
import { notFound } from 'next/navigation';
import { buildMetadata } from '@/lib/seo';
import { LegalDirectoryHero } from '@/components/legal-directory/LegalDirectoryHero';
import { LegalDirectoryCard } from '@/components/legal-directory/LegalDirectoryCard';
import { LegalDirectoryDisclaimer } from '@/components/legal-directory/LegalDirectoryDisclaimer';
import { getLocationBySlug, LEGAL_DIRECTORY_LOCATIONS, matchListingToLocation } from '@/lib/legal-directory/locations';
import { LEGAL_DIRECTORY_BASE } from '@/lib/legal-directory/constants';
import { listApprovedListings, toPublicListing } from '@/lib/legal-directory/storage';
import { LEGAL_DIRECTORY_CATEGORIES } from '@/lib/legal-directory/categories';

export const dynamic = 'force-dynamic';

type Props = { params: Promise<{ locationSlug: string }> };

export async function generateStaticParams() {
  return LEGAL_DIRECTORY_LOCATIONS.map((l) => ({ locationSlug: l.slug }));
}

export async function generateMetadata({ params }: Props) {
  const { locationSlug } = await params;
  const loc = getLocationBySlug(locationSlug);
  if (!loc) {
    return buildMetadata({
      title: 'Location not found',
      description: 'Location not found.',
      path: `${LEGAL_DIRECTORY_BASE}/location/${locationSlug}`,
      noIndex: true,
    });
  }
  return buildMetadata({
    title: `Criminal Legal Services in ${loc.label}`,
    description: `Find criminal law and criminal justice service providers in ${loc.label}. Free directory listings on Police Station Rep UK.`,
    path: `${LEGAL_DIRECTORY_BASE}/location/${loc.slug}`,
  });
}

export default async function LocationPage({ params }: Props) {
  const { locationSlug } = await params;
  const loc = getLocationBySlug(locationSlug);
  if (!loc) notFound();

  const approved = await listApprovedListings();
  const results = approved
    .filter((l) => matchListingToLocation(l, locationSlug))
    .map(toPublicListing);

  return (
    <>
      <LegalDirectoryHero
        title={`Criminal legal services in ${loc.label}`}
        description={`Solicitors, barristers, police station representatives, and specialist providers serving ${loc.label} and surrounding areas.`}
        breadcrumbs={[
          { label: 'Home', href: '/' },
          { label: 'Legal Services Directory', href: LEGAL_DIRECTORY_BASE },
          { label: 'Locations', href: `${LEGAL_DIRECTORY_BASE}/locations` },
          { label: loc.label },
        ]}
      />
      <div className="page-container section-pad space-y-8">
        {results.length === 0 ? (
          <div className="card-surface p-8">
            <p className="leading-relaxed text-[var(--muted)]">
              No approved listings in {loc.label} yet. This page provides useful context for
              anyone searching for criminal legal services in the area. Providers can add a free
              listing subject to moderation.
            </p>
            <Link href={`${LEGAL_DIRECTORY_BASE}/add-listing`} className="btn-gold mt-4 inline-block no-underline">
              Add a free listing
            </Link>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {results.map((l) => (
              <LegalDirectoryCard key={l.id} listing={l} />
            ))}
          </div>
        )}

        <section>
          <h2 className="text-h3 text-[var(--navy)]">Categories in this area</h2>
          <ul className="mt-3 flex flex-wrap gap-2">
            {LEGAL_DIRECTORY_CATEGORIES.slice(0, 8).map((c) => (
              <li key={c.slug}>
                <Link
                  href={`${LEGAL_DIRECTORY_BASE}/category/${c.slug}`}
                  className="rounded-full border px-3 py-1 text-sm no-underline text-[var(--navy)]"
                >
                  {c.label}
                </Link>
              </li>
            ))}
          </ul>
        </section>

        <LegalDirectoryDisclaimer />
      </div>
    </>
  );
}
