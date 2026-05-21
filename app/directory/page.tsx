import Link from 'next/link';
import type { Metadata } from 'next';
import { Suspense } from 'react';
import { getAllReps, getAllCounties, getAllStations, stripPrivateFieldsAll } from '@/lib/data';
import { DirectorySearch } from '@/components/DirectorySearch';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { DirectoryComplianceNotice } from '@/components/DirectoryComplianceNotice';
import { AdvertisementLabel } from '@/components/AdvertisementLabel';
import { PsrTrainPromo } from '@/components/PsrTrainPromo';
import { SITE_NAME, SITE_URL, socialPreviewImageUrl } from '@/lib/seo-layer/config';
import { JsonLd } from '@/components/JsonLd';
import { breadcrumbSchema, directoryItemListSchema } from '@/lib/seo';
import { ResultsGridSkeleton } from '@/components/directory/ResultsGrid';
import { JoinCTA } from '@/components/directory/JoinCTA';
import { FeaturedListingAdvert } from '@/components/FeaturedListingAdvert';
import { FeaturedListingFaq } from '@/components/FeaturedListingFaq';

const directoryTitle = 'Police Station Rep Directory — County & Station';
const directoryDescription =
  'Accredited police station reps across England and Wales. Search by county, force, station, postcode, and availability. Free for firms and reps.';

export const metadata: Metadata = {
  title: directoryTitle,
  description: directoryDescription,
  alternates: { canonical: `${SITE_URL}/directory` },
  openGraph: {
    title: directoryTitle,
    description: directoryDescription,
    url: `${SITE_URL}/directory`,
    type: 'website',
    siteName: SITE_NAME,
    locale: 'en_GB',
    images: [
      {
        url: socialPreviewImageUrl(),
        width: 1200,
        height: 630,
        alt: 'Search the UK police station representative directory',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: directoryTitle,
    description: directoryDescription,
    images: [socialPreviewImageUrl()],
  },
};

export const dynamic = 'force-dynamic';

export default async function DirectoryPage() {
  const [repsRaw, counties, stations] = await Promise.all([
    getAllReps(),
    getAllCounties(),
    getAllStations(),
  ]);

  // Defence-in-depth: scrub PIN, postcode and verification metadata before
  // anything is rendered or serialised into the page.
  const reps = stripPrivateFieldsAll(repsRaw);

  const bc = breadcrumbSchema([
    { name: 'Home', url: '/' },
    { name: 'Directory', url: '/directory' },
  ]);
  const itemList = directoryItemListSchema(reps.map((r) => ({ name: r.name, slug: r.slug })));

  return (
    <>
      <JsonLd data={bc} />
      <JsonLd data={itemList} />

      {/* Hero */}
      <section className="relative overflow-hidden bg-[var(--navy)]">
        <div className="absolute inset-0 bg-gradient-to-br from-[var(--navy)] via-[#0f1d45] to-[#0a1633]" />
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.4) 1px, transparent 1px)', backgroundSize: '24px 24px' }} />
        <div className="relative mx-auto max-w-7xl px-4 pb-10 pt-8 sm:px-6 sm:pb-14 sm:pt-10 lg:px-8">
          <Breadcrumbs
            light
            className="!mb-0"
            items={[{ label: 'Home', href: '/' }, { label: 'Police Station Rep Directory' }]}
          />
          <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-white sm:text-4xl lg:text-5xl">
            Find a Police Station Rep
          </h1>
          <p className="mt-3 max-w-2xl text-base leading-relaxed text-slate-300 sm:text-lg">
            Free directory of accredited police station representatives across England &amp; Wales.
            Search by name, county, force, station, or postcode.
          </p>
          <div className="mt-5 flex flex-wrap gap-3 text-sm">
            <span className="flex items-center gap-2 rounded-full bg-white/10 px-4 py-1.5 font-semibold text-white">
              <span className="text-lg font-extrabold text-[var(--gold)]">{reps.length}</span>
              Representatives
            </span>
            <span className="flex items-center gap-2 rounded-full bg-white/10 px-4 py-1.5 font-semibold text-white">
              <span className="text-lg font-extrabold text-[var(--gold)]">{counties.length}</span>
              Counties
            </span>
            <span className="flex items-center gap-2 rounded-full bg-white/10 px-4 py-1.5 font-semibold text-white">
              <span className="text-lg font-extrabold text-[var(--gold)]">{stations.length}</span>
              Stations
            </span>
          </div>
          <div className="mt-6">
            <JoinCTA variant="hero" />
          </div>
          <div className="mt-4 flex flex-wrap gap-2.5">
            <Link
              href="/Map"
              className="inline-flex items-center gap-1.5 rounded-lg border border-white/20 bg-white/10 px-4 py-2 text-sm font-semibold text-white no-underline backdrop-blur-sm transition-colors hover:bg-white/20"
            >
              Map View
            </Link>
            <Link
              href="/Forces"
              className="inline-flex items-center gap-1.5 rounded-lg border border-white/20 bg-white/10 px-4 py-2 text-sm font-semibold text-white no-underline backdrop-blur-sm transition-colors hover:bg-white/20"
            >
              Browse by Force
            </Link>
            <Link
              href="/StationsDirectory"
              className="inline-flex items-center gap-1.5 rounded-lg border border-white/20 bg-white/10 px-4 py-2 text-sm font-semibold text-white no-underline backdrop-blur-sm transition-colors hover:bg-white/20"
            >
              Stations Directory
            </Link>
          </div>
          <p className="mt-3 max-w-2xl text-xs text-slate-400">
            Wrong details for a custody site?{' '}
            <Link
              href="/UpdateStation"
              className="font-semibold text-[var(--gold)] no-underline hover:underline"
            >
              Correct a station phone number or address
            </Link>
            {' '}
            (via{' '}
            <Link href="/StationsDirectory" className="font-semibold text-white/90 no-underline hover:underline">
              Stations Directory
            </Link>
            ).
          </p>
        </div>
      </section>

      {/* Accreditation notice */}
      <section className="border-b border-yellow-200 bg-yellow-50 py-3">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex gap-3">
            <span className="text-xl leading-none text-yellow-600" aria-hidden>
              &#9888;&#65039;
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-xs leading-relaxed text-yellow-700">
                <strong className="font-bold text-yellow-800">Verified directory.</strong>{' '}
                Only fully accredited PSRAS police station representatives, duty solicitors and
                solicitors are listed. Every profile is manually approved by an admin before
                publication. Probationary representatives, trainees and unaccredited applicants
                are <strong>not</strong> eligible.{' '}
                <Link
                  href="/AccreditedRepresentativeGuide"
                  className="font-semibold text-yellow-800 no-underline hover:text-yellow-600"
                >
                  Accreditation requirements &rarr;
                </Link>
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Main content */}
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <DirectoryComplianceNotice className="mb-6" />

        <FeaturedListingAdvert className="mb-4" />
        <FeaturedListingFaq className="mb-6" />

        {/* Custody Note — promoted product */}
        <aside className="mb-6 flex flex-col items-stretch gap-3 rounded-xl border border-[var(--gold)]/25 bg-gradient-to-r from-[var(--navy)] to-[#152e6e] px-5 py-3 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:gap-4">
          <div className="flex min-w-0 flex-1 items-center gap-3">
            <AdvertisementLabel variant="dark" label="Featured product" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-bold text-white">
                CustodyNote — PACE-aligned police station attendance notes
              </p>
              <p className="mt-0.5 text-xs text-white/70">
                30-day free trial &middot; &pound;15.99/mo &middot; PSR UK readers &pound;11.99/mo with code{' '}
                <span className="font-mono font-semibold text-[var(--gold)]">A2MJY2NQ</span>
              </p>
            </div>
          </div>
          <Link
            href="https://custodynote.com"
            target="_blank"
            rel="noopener noreferrer"
            className="btn-gold shrink-0 self-start !px-4 !py-2 !text-xs no-underline sm:self-auto"
          >
            Try Free
          </Link>
        </aside>

        <PsrTrainPromo variant="slim" campaign="directory" className="mb-6" />

        <Suspense fallback={<ResultsGridSkeleton />}>
          <DirectorySearch
            reps={reps}
            counties={counties}
            stations={stations}
          />
        </Suspense>

        <p className="mt-8 text-xs text-[var(--muted)]">
          Listings are based on information provided at registration. Availability and station
          coverage may change. PoliceStationRepUK does not verify every credential; firms must satisfy
          their own compliance checks before instructing. If you spot an inaccuracy, please report it
          and we will review it promptly.
        </p>
      </div>
    </>
  );
}
