import Link from 'next/link';
import { buildMetadata } from '@/lib/seo';
import { LegalDirectoryHero } from '@/components/legal-directory/LegalDirectoryHero';
import { LocationCard } from '@/components/legal-directory/LocationCard';
import { LegalDirectoryDisclaimer } from '@/components/legal-directory/LegalDirectoryDisclaimer';
import { LEGAL_DIRECTORY_LOCATIONS } from '@/lib/legal-directory/locations';
import { LEGAL_DIRECTORY_BASE } from '@/lib/legal-directory/constants';
import { listApprovedListings } from '@/lib/legal-directory/storage';
import { matchListingToLocation } from '@/lib/legal-directory/locations';

export const metadata = buildMetadata({
  title: 'Legal Services by Location',
  description: 'Find criminal law and criminal justice service providers by county and region in England and Wales.',
  path: `${LEGAL_DIRECTORY_BASE}/locations`,
});

export const dynamic = 'force-dynamic';

export default async function LocationsIndexPage() {
  const approved = await listApprovedListings();
  const counties = LEGAL_DIRECTORY_LOCATIONS.filter((l) => l.type === 'county');
  const regions = LEGAL_DIRECTORY_LOCATIONS.filter((l) => l.type === 'region');

  function countFor(slug: string) {
    return approved.filter((l) => matchListingToLocation(l, slug)).length;
  }

  return (
    <>
      <LegalDirectoryHero
        title="Locations"
        description="Criminal legal services by county and region across England and Wales."
        breadcrumbs={[
          { label: 'Home', href: '/' },
          { label: 'Legal Services Directory', href: LEGAL_DIRECTORY_BASE },
          { label: 'Locations' },
        ]}
      />
      <div className="page-container section-pad space-y-10">
        <section>
          <h2 className="text-h2 mb-4 text-[var(--navy)]">Counties</h2>
          <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {counties.map((loc) => (
              <LocationCard key={loc.slug} location={loc} count={countFor(loc.slug)} />
            ))}
          </div>
        </section>
        <section>
          <h2 className="text-h2 mb-4 text-[var(--navy)]">Regions</h2>
          <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
            {regions.map((loc) => (
              <LocationCard key={loc.slug} location={loc} count={countFor(loc.slug)} />
            ))}
          </div>
        </section>
        <Link href={`${LEGAL_DIRECTORY_BASE}/add-listing`} className="btn-gold inline-block no-underline">
          Add a free listing
        </Link>
        <LegalDirectoryDisclaimer />
      </div>
    </>
  );
}
