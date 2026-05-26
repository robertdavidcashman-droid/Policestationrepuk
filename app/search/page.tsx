import Link from 'next/link';
import type { Metadata } from 'next';
import { Suspense } from 'react';
import { getAllReps, getAllCounties, getAllStations } from '@/lib/data';
import { DirectorySearch } from '@/components/DirectorySearch';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { DirectoryComplianceNotice } from '@/components/DirectoryComplianceNotice';
import { CustodyNotePagePromo } from '@/components/CustodyNotePagePromo';
import { SITE_NAME, SITE_URL, socialPreviewImageUrl } from '@/lib/seo-layer/config';
import { ResultsGridSkeleton } from '@/components/directory/ResultsGrid';

const searchTitle = 'Search Police Station Representatives | PoliceStationRepUK';
const searchDescription =
  'Advanced search: filter the same live PoliceStationRepUK listings by county, police force, station, accreditation type, availability, postcode-aware text search, and sort order. Use this page for extra filters; use Find a Rep for the full directory hub.';

export const metadata: Metadata = {
  title: searchTitle,
  description: searchDescription,
  alternates: { canonical: `${SITE_URL}/search` },
  openGraph: {
    title: searchTitle,
    description: searchDescription,
    url: `${SITE_URL}/search`,
    type: 'website',
    siteName: SITE_NAME,
    locale: 'en_GB',
    images: [
      {
        url: socialPreviewImageUrl(),
        width: 1200,
        height: 630,
        alt: 'Advanced search for police station representatives',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: searchTitle,
    description: searchDescription,
    images: [socialPreviewImageUrl()],
  },
};

export default async function SearchPage() {
  const [reps, counties, stations] = await Promise.all([
    getAllReps(),
    getAllCounties(),
    getAllStations(),
  ]);

  return (
    <>
      <section className="relative overflow-hidden bg-[var(--navy)]">
        <div className="absolute inset-0 bg-gradient-to-br from-[var(--navy)] via-[#0f1d45] to-[#0a1633]" />
        <div className="relative mx-auto max-w-7xl px-4 pb-8 pt-6 sm:px-6 sm:pb-10 sm:pt-8 lg:px-8">
          <Breadcrumbs
            light
            className="!mb-0"
            items={[{ label: 'Home', href: '/' }, { label: 'Search directory' }]}
          />
          <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
            Search representatives
          </h1>
          <p className="mt-2 max-w-2xl text-base leading-relaxed text-slate-300">
            Filter live directory listings by county, police force, station, accreditation, availability,
            and postcode-aware search.
          </p>
          <p className="mt-3 text-sm">
            <Link href="/directory" className="font-semibold text-[var(--gold)] no-underline hover:text-white">
              Full directory hub &rarr;
            </Link>
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <DirectoryComplianceNotice className="mb-6" />
        <CustodyNotePagePromo variant="compact" className="mb-6" />
        <Suspense fallback={<ResultsGridSkeleton />}>
          <DirectorySearch
            reps={reps}
            counties={counties}
            stations={stations}
            urlBase="/search"
          />
        </Suspense>
      </div>
    </>
  );
}
