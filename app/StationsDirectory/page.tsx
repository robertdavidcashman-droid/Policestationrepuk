import Link from 'next/link';
import { getAllReps, getAllStations } from '@/lib/data';
import { countRepsForStation } from '@/lib/station-indexing';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { JsonLd } from '@/components/JsonLd';
import { StationsDataContributeCta } from '@/components/StationsDataContributeCta';
import { StationsDirectoryExplorer } from '@/components/StationsDirectoryExplorer';
import {
  buildMetadata,
  breadcrumbSchema,
  faqPageSchema,
  stationDirectoryItemListSchema,
} from '@/lib/seo';
import { STATIONS_DIRECTORY_FAQS } from '@/lib/stations-seo';
import { buildStationPhonePublicStats } from '@/lib/station-phone-stats-server';
import { StationContactDisclaimer } from '@/components/StationPhone';
import { GuideFaqs } from '@/components/StructuredGuideLayout';

export const metadata = buildMetadata({
  title: 'UK Police Station Phone Numbers & Addresses Directory',
  description:
    'Search UK police station telephone numbers, custody suite lines, addresses and forces. Report up-to-date phone numbers so the directory stays accurate for reps and firms.',
  path: '/StationsDirectory',
  keywords: [
    'police station phone numbers UK',
    'custody suite telephone number',
    'police station address directory',
    'police force station contacts',
  ],
});

export const dynamic = 'force-static';

interface PageProps {
  searchParams?: Promise<{ [key: string]: string | undefined }>;
}

export default async function StationsDirectoryPage({ searchParams }: PageProps) {
  const params = (await searchParams) ?? {};
  const [stations, reps] = await Promise.all([getAllStations(), getAllReps()]);
  const repCountBySlug = Object.fromEntries(
    stations.map((s) => [s.slug, countRepsForStation(s, reps, stations)]),
  );
  const stationListSample = stations.map((s) => ({ name: s.name, slug: s.slug }));
  const stats = buildStationPhonePublicStats(stations);

  return (
    <>
      <JsonLd data={breadcrumbSchema([
        { name: 'Home', url: '/' },
        { name: 'Police Station Directory', url: '/StationsDirectory' },
      ])} />
      <JsonLd data={faqPageSchema([...STATIONS_DIRECTORY_FAQS])} />
      <JsonLd data={stationDirectoryItemListSchema(stationListSample, stations.length)} />

      <section className="bg-[var(--navy)] py-10 sm:py-14">
        <div className="page-container !py-0">
          <Breadcrumbs
            light
            items={[
              { label: 'Home', href: '/' },
              { label: 'Station Directory', href: '/StationsDirectory' },
            ]}
          />
          <div className="mb-3 mt-3 inline-flex items-center gap-2 rounded-full border border-white bg-[var(--navy-light)] px-3 py-1 text-xs font-medium text-white">
            <span>✓</span> Help us to help you — community-maintained contacts
          </div>
          <h1 className="text-h1 text-white">UK Police Station Phone Numbers &amp; Addresses</h1>
          <p className="mt-3 max-w-2xl text-lg leading-relaxed text-white">
            Telephone numbers, custody suite lines, and addresses for police stations across England
            &amp; Wales. {stations.length > 0 ? `${stations.length} stations listed.` : ''}
          </p>
          <p className="mt-3 max-w-2xl text-sm text-slate-300">
            Numbers change — if you have a verified up-to-date telephone number, please{' '}
            <Link
              href="/UpdateStation"
              className="font-semibold text-[var(--gold)] no-underline hover:underline"
            >
              report it here
            </Link>{' '}
            or use &ldquo;Correct phone, address…&rdquo; on any station card below.
          </p>

          {stats.total > 0 && (
            <dl className="mt-6 grid max-w-2xl grid-cols-2 gap-3 sm:grid-cols-4">
              {[
                { label: 'Stations listed', value: stats.total },
                { label: 'Direct line shown', value: stats.directLine },
                { label: 'Switchboard / 101', value: stats.switchboard + stats.generic },
                { label: 'No number held', value: stats.none },
              ].map((item) => (
                <div
                  key={item.label}
                  className="rounded-lg border border-white/20 bg-[var(--navy-light)] px-3 py-2.5 text-center"
                >
                  <dt className="text-xs font-medium text-slate-300">{item.label}</dt>
                  <dd className="mt-0.5 text-2xl font-extrabold text-white">{item.value}</dd>
                </div>
              ))}
            </dl>
          )}
          {stats.needsHelp > 0 && (
            <p className="mt-3 max-w-2xl text-sm text-slate-300">
              <strong className="text-white">{stats.needsHelp}</strong> listings could use a verified
              direct custody or main line number.{' '}
              <Link
                href="/HelpUsStationNumbers"
                className="font-semibold text-[var(--gold)] no-underline hover:underline"
              >
                Help us to help you
              </Link>
              .
            </p>
          )}
        </div>
      </section>

      <div className="page-container">
        <StationsDataContributeCta variant="slim" className="mb-6" />
        <StationsDirectoryExplorer
          stations={stations}
          repCountBySlug={repCountBySlug}
          initialQuery={params.q ?? ''}
          initialForce={params.force ?? ''}
          initialCounty={params.county ?? ''}
        />

        <StationsDataContributeCta variant="prominent" className="mt-10" />

        <div className="mt-10 rounded-xl border border-slate-200 bg-slate-50 p-6">
          <h2 className="text-lg font-bold text-[var(--navy)]">Help us keep telephone numbers accurate</h2>
          <p className="mt-1.5 text-sm text-[var(--muted)]">
            Reps and firms rely on correct custody desk and main line numbers for out-of-hours cover.
            Submit the number you use today — we review every correction before it goes live.
          </p>
          <Link
            href="/UpdateStation"
            className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--gold-link)] no-underline hover:text-[var(--gold)] hover:underline"
          >
            Report an updated phone number or address &rarr;
          </Link>
        </div>

        <div className="mt-10 rounded-xl border border-slate-200 bg-slate-50 p-5">
          <StationContactDisclaimer />
        </div>

        <div className="mt-14 border-t border-[var(--border)] pt-10">
          <h2 className="text-h2 text-[var(--navy)]">Frequently asked questions</h2>
          <GuideFaqs
            faqs={STATIONS_DIRECTORY_FAQS.map((f) => ({ q: f.q, a: f.a }))}
          />
        </div>

        <div className="mt-14 border-t border-[var(--border)] pt-10">
          <h2 className="text-h2 text-[var(--navy)]">Find a Representative</h2>
          <p className="mt-2 text-[var(--muted)]">
            Search our directory of accredited police station representatives covering these stations.
          </p>
          <div className="mt-4 flex gap-3">
            <Link href="/directory" className="btn-gold">
              Search Directory
            </Link>
            <Link href="/directory/counties" className="btn-outline">
              Browse by County
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
