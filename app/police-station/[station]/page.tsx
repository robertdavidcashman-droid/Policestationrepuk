import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { getAllCounties, getAllReps, getAllStations, getStationBySlug, getRepsByStation } from '@/lib/data';
import type { PoliceStation } from '@/lib/types';
import { buildMetadata, localBusinessSchema, breadcrumbSchema } from '@/lib/seo';
import { JsonLd } from '@/components/JsonLd';
import { StationsDataContributeCta } from '@/components/StationsDataContributeCta';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { RepCard } from '@/components/RepCard';
import { DirectoryCredentialVerificationNotice } from '@/components/DirectoryCredentialVerificationNotice';
import { FirmCoverCTA } from '@/components/FirmCoverCTA';
import { phoneToTelHref } from '@/lib/phone';
import { displayPhoneNumber, stationPhoneNumbers } from '@/lib/station-search';
import { StationLocationMap } from '@/components/StationLocationMap';
import { countRepsForStation, shouldIndexPoliceStationPage } from '@/lib/station-indexing';
import { directoryHrefForAreaName } from '@/lib/county-links';
import {
  CUSTODYNOTE_BRAND_NAME,
  CUSTODYNOTE_DISCOUNT_CODE,
  CUSTODYNOTE_MEMBER_PRICE_GBP,
  CUSTODYNOTE_PLATFORM_LINE,
  CUSTODYNOTE_PRICE_GBP,
  CUSTODYNOTE_TRIAL_HREF,
} from '@/lib/custodynote-promo';

export const dynamic = 'force-static';
/** ISR: refresh station pages periodically so rep counts and index flags stay fresh. */
export const revalidate = 86_400;

interface PageProps {
  params: Promise<{ station: string }>;
}

export async function generateStaticParams() {
  const { getAllStations } = await import('@/lib/data');
  const stations = await getAllStations();
  return stations.map((s) => ({ station: s.slug }));
}

export async function generateMetadata({ params }: PageProps) {
  const { station } = await params;
  const stationData = await getStationBySlug(station);
  if (!stationData) return {};
  const [allReps, allStations] = await Promise.all([getAllReps(), getAllStations()]);
  const repCount = countRepsForStation(stationData, allReps, allStations);
  const indexable = shouldIndexPoliceStationPage(stationData, repCount);
  const area = stationData.forceName || stationData.county || 'England & Wales';
  const listedPhone = displayPhoneNumber(stationData);
  const phoneSnippet = listedPhone ? ` Phone: ${listedPhone}.` : '';
  return buildMetadata({
    title: `${stationData.name} Police Station — Phone, Address & Reps`,
    description: `${stationData.name} (${area}) — police station telephone numbers, address, and accredited representatives.${phoneSnippet} Report updated numbers if ours are wrong.`,
    path: `/police-station/${stationData.slug}`,
    noIndex: !indexable,
  });
}

export default async function PoliceStationPage({ params }: PageProps) {
  const { station: stationSlug } = await params;
  const station = await getStationBySlug(stationSlug);
  if (!station) notFound();

  if (station.slug !== stationSlug) {
    redirect(`/police-station/${station.slug}`);
  }

  const [reps, counties, allReps, allStations] = await Promise.all([
    getRepsByStation(station.name),
    getAllCounties(),
    getAllReps(),
    getAllStations(),
  ]);
  const countyDirHref =
    directoryHrefForAreaName(station.county, counties) ??
    directoryHrefForAreaName(station.forceName, counties);
  const repCount = countRepsForStation(station, allReps, allStations);
  const indexable = shouldIndexPoliceStationPage(station, repCount);
  const listedPhone = displayPhoneNumber(station);
  const schema = localBusinessSchema({
    name: station.name,
    slug: station.slug,
    address: station.address,
    county: station.forceName || station.county || '',
    ...(listedPhone ? { telephone: listedPhone } : {}),
  });
  const bc = breadcrumbSchema([{ name: 'Home', url: '/' }, { name: 'Station Directory', url: '/StationsDirectory' }, { name: `${station.name} Police Station`, url: `/police-station/${station.slug}` }]);
  const areaLabel = station.county || station.forceName || '';

  return (
    <>
      {indexable && <JsonLd data={schema} />}
      <JsonLd data={bc} />

      {/* Navy header */}
      <section className="bg-[var(--navy)] py-10 sm:py-12">
        <div className="page-container !py-0">
          <Breadcrumbs
            light
            items={[
              { label: 'Home', href: '/' },
              { label: 'Station Directory', href: '/StationsDirectory' },
              { label: `${station.name}` },
            ]}
          />
          <div className="mt-2 flex items-center gap-3">
            <h1 className="text-h1 text-white">{station.name} Police Station</h1>
            {(station.isCustodyStation || station.custodySuite) && (
              <span className="rounded-full bg-emerald-600 px-3 py-1 text-xs font-bold text-white">
                Custody Suite
              </span>
            )}
          </div>
          <p className="mt-2 text-lg text-[var(--gold)]">{station.forceName || station.county}</p>
        </div>
      </section>

      <div className="page-container">
        <div className="mx-auto max-w-6xl">
          <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
            {/* Main content */}
            <div className="order-2 space-y-6 lg:order-1">
              <section className="rounded-[var(--radius-lg)] border border-[var(--card-border)] bg-white p-6 shadow-[var(--card-shadow)] sm:p-8">
                <h2 className="text-lg font-bold text-[var(--navy)] sm:text-xl">
                  Police station representation at {station.name}
                </h2>
                <div className="mt-4 space-y-4 text-sm leading-relaxed text-[var(--muted)] sm:text-base">
                  <p>
                    {station.name} sits within {areaLabel ? `the ${areaLabel} policing area` : 'its local force area'}.
                    Defence solicitors and duty firms often need an accredited{' '}
                    <Link href="/WhatDoesRepDo" className="font-medium text-[var(--gold-link)] hover:underline">
                      police station representative
                    </Link>{' '}
                    to attend quickly when a client is booked into custody — especially for evenings, weekends, or
                    multi-site firms covering several custody suites.
                  </p>
                  <p>
                    This page lists representatives who have told us they cover {station.name} (or matching custody
                    routes). Availability is between you and the representative; PoliceStationRepUK is a{' '}
                    <Link href="/About" className="font-medium text-[var(--gold-link)] hover:underline">
                      directory
                    </Link>
                    , not a law firm. For wider cover in the same region, use{' '}
                    {countyDirHref ? (
                      <Link href={countyDirHref} className="font-medium text-[var(--gold-link)] hover:underline">
                        the {areaLabel || 'county'} directory hub
                      </Link>
                    ) : (
                      <Link href="/directory/counties" className="font-medium text-[var(--gold-link)] hover:underline">
                        county hubs
                      </Link>
                    )}{' '}
                    or the main{' '}
                    <Link href="/directory" className="font-medium text-[var(--gold-link)] hover:underline">
                      search directory
                    </Link>
                    .
                  </p>
                </div>
              </section>

              <section>
                <h2 className="text-h2 text-[var(--navy)]">Representatives covering {station.name}</h2>
                {reps.length > 0 && <DirectoryCredentialVerificationNotice className="mt-4" />}
                {reps.length === 0 ? (
                  <div className="mt-4 space-y-6">
                    <div className="rounded-[var(--radius-lg)] border border-[var(--card-border)] bg-white p-8 text-center shadow-[var(--card-shadow)]">
                      <p className="text-[var(--muted)]">
                        No representatives listed for this station yet.{' '}
                        <Link href="/register" className="text-[var(--gold-link)] hover:underline">
                          Register free
                        </Link>{' '}
                        to be listed.
                      </p>
                    </div>
                    <FirmCoverCTA countyName={areaLabel || undefined} />
                  </div>
                ) : (
                  <div className="mt-5 grid gap-5 sm:grid-cols-2">
                    {reps.map((rep) => (
                      <RepCard key={rep.id} rep={rep} />
                    ))}
                  </div>
                )}
              </section>

              <section className="rounded-[var(--radius-lg)] border border-[var(--card-border)] bg-white p-6 shadow-[var(--card-shadow)]">
                <h2 className="text-lg font-bold text-[var(--navy)]">Legal representation at this station</h2>
                <p className="mt-3 leading-relaxed text-[var(--muted)]">
                  When someone is detained at {station.name} Police Station, they are entitled to free legal advice under PACE Code C. A police station representative or solicitor can attend the custody suite to advise the detainee, review disclosure, sit in on police interviews, and make representations about bail.
                </p>
                {station.forceName && (
                  <p className="mt-3 leading-relaxed text-[var(--muted)]">
                    {station.name} is part of the {station.forceName} force area{station.county && station.county !== station.forceName ? ` in ${station.county}` : ''}. Representatives listed below have indicated they cover this station or surrounding custody suites.
                  </p>
                )}
              </section>

              <section className="rounded-[var(--radius-lg)] border border-[var(--card-border)] bg-white p-6 shadow-[var(--card-shadow)]">
                <h2 className="text-lg font-bold text-[var(--navy)]">What happens at a police station?</h2>
                <ul className="mt-3 space-y-2 text-sm leading-relaxed text-[var(--muted)]">
                  <li className="flex gap-2"><span className="mt-0.5 shrink-0 text-[var(--gold)]">1.</span>The custody officer books the detainee in and explains their rights, including the right to free legal advice.</li>
                  <li className="flex gap-2"><span className="mt-0.5 shrink-0 text-[var(--gold)]">2.</span>The DSCC is contacted to allocate a duty solicitor or the detainee&apos;s own solicitor is called.</li>
                  <li className="flex gap-2"><span className="mt-0.5 shrink-0 text-[var(--gold)]">3.</span>The representative reviews disclosure, consults with the client, and advises on interview strategy.</li>
                  <li className="flex gap-2"><span className="mt-0.5 shrink-0 text-[var(--gold)]">4.</span>After the interview the representative makes representations on charge, bail, or further investigation.</li>
                </ul>
                <p className="mt-3 text-sm text-[var(--muted)]">
                  <Link href="/PACE" className="font-medium text-[var(--gold-link)] no-underline hover:underline">
                    Read more about PACE rights and custody procedures →
                  </Link>
                </p>
              </section>
            </div>

            {/* Sidebar */}
            <div className="order-1 space-y-6 lg:order-2">
              <section className="rounded-[var(--radius-lg)] border border-[var(--card-border)] bg-white p-6 shadow-[var(--card-shadow)]">
                <h2 className="text-lg font-bold text-[var(--navy)]">Station details</h2>
                <dl className="mt-3 space-y-3 text-sm">
                  <div>
                    <dt className="text-xs font-bold uppercase tracking-wider text-[var(--muted)]">Address</dt>
                    <dd className="mt-0.5 text-[var(--navy)]">{station.address}</dd>
                  </div>
                  {station.forceName && (
                    <div>
                      <dt className="text-xs font-bold uppercase tracking-wider text-[var(--muted)]">Force</dt>
                      <dd className="mt-0.5 text-[var(--navy)]">{station.forceName}</dd>
                    </div>
                  )}
                  {station.postcode && (
                    <div>
                      <dt className="text-xs font-bold uppercase tracking-wider text-[var(--muted)]">Postcode</dt>
                      <dd className="mt-0.5 text-[var(--navy)]">{station.postcode}</dd>
                    </div>
                  )}
                  <StationPhoneDetail station={station} />
                  <div>
                    <dt className="text-xs font-bold uppercase tracking-wider text-[var(--muted)]">Custody suite</dt>
                    <dd className="mt-0.5 text-[var(--navy)]">{(station.isCustodyStation || station.custodySuite) ? 'Yes' : 'No'}</dd>
                  </div>
                </dl>
                {typeof station.latitude === 'number' && typeof station.longitude === 'number' && (
                  <div className="mt-4">
                    <StationLocationMap
                      lat={station.latitude}
                      lng={station.longitude}
                      name={station.name}
                    />
                  </div>
                )}
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(station.address)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-outline mt-4 w-full !text-sm"
                >
                  Get Directions
                </a>
                <Link
                  href={`/UpdateStation?station=${encodeURIComponent(station.id)}`}
                  className="btn-gold mt-2 w-full !text-sm no-underline text-center"
                >
                  Help us to help you — report number
                </Link>
                <p className="mt-2 text-center text-xs text-[var(--muted)]">
                  Know a newer custody desk or main line?{' '}
                  <Link href="/HelpUsStationNumbers" className="font-semibold text-[var(--gold-link)] underline">
                    Learn how it works
                  </Link>
                  .
                </p>
              </section>

              <StationsDataContributeCta variant="slim" />

              <section className="rounded-[var(--radius-lg)] bg-[var(--navy)] p-6 text-center">
                <h3 className="font-bold text-white">Cover this station?</h3>
                <p className="mt-2 text-sm text-white">
                  Register free and be listed for {station.name}.
                </p>
                <Link href="/register" className="btn-gold mt-3 w-full !text-sm">
                  Register Free
                </Link>
              </section>

              <section className="rounded-[var(--radius-lg)] border-2 border-[var(--gold)]/40 bg-[var(--gold-pale)] p-6">
                <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--gold-link)]">
                  Featured product
                </p>
                <h3 className="mt-1 font-bold text-[var(--navy)]">{CUSTODYNOTE_BRAND_NAME}</h3>
                <p className="mt-2 text-sm leading-relaxed text-[var(--navy)]/85">
                  PACE-aligned attendance note software for accredited reps and defence solicitors —
                  structured custody, voluntary and telephone forms, offline-first, instant PDF, and
                  LAA billing in one desktop app ({CUSTODYNOTE_PLATFORM_LINE.toLowerCase()}).
                </p>
                <p className="mt-2 text-xs font-semibold text-[var(--navy)]">
                  £{CUSTODYNOTE_PRICE_GBP}/mo · PSR UK readers £{CUSTODYNOTE_MEMBER_PRICE_GBP}/mo with code{' '}
                  <span className="rounded bg-white px-1.5 py-0.5 font-mono text-[var(--navy)]">
                    {CUSTODYNOTE_DISCOUNT_CODE}
                  </span>
                </p>
                <a
                  href={CUSTODYNOTE_TRIAL_HREF}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-gold mt-3 block w-full !text-sm no-underline text-center"
                >
                  Start free trial →
                </a>
              </section>
            </div>
          </div>

          <nav className="mt-10 flex flex-wrap gap-4" aria-label="Related directory links">
            {countyDirHref ? (
              <Link
                href={countyDirHref}
                className="font-medium text-[var(--gold-link)] no-underline hover:text-[var(--gold)]"
              >
                View all reps in {station.county || station.forceName || 'this area'} →
              </Link>
            ) : (
              <Link
                href="/directory/counties"
                className="font-medium text-[var(--gold-link)] no-underline hover:text-[var(--gold)]"
              >
                Browse county hubs →
              </Link>
            )}
            <Link href="/search" className="font-medium text-[var(--muted)] no-underline hover:text-[var(--gold-hover)]">
              Search directory
            </Link>
            <Link href="/StationsDirectory" className="font-medium text-[var(--muted)] no-underline hover:text-[var(--gold-hover)]">
              Station A–Z
            </Link>
            <Link href="/directory" className="font-medium text-[var(--muted)] no-underline hover:text-[var(--gold-hover)]">
              ← Full directory
            </Link>
          </nav>
        </div>
      </div>
    </>
  );
}

function StationPhoneDetail({ station }: { station: PoliceStation }) {
  const entries = stationPhoneNumbers(station);

  if (entries.length === 0) {
    return (
      <div>
        <dt className="text-xs font-bold uppercase tracking-wider text-[var(--muted)]">Phone</dt>
        <dd className="mt-0.5 text-[var(--muted)]">
          No direct number — call 101 for non-emergency enquiries
        </dd>
      </div>
    );
  }

  return (
    <div>
      <dt className="text-xs font-bold uppercase tracking-wider text-[var(--muted)]">Phone</dt>
      <dd className="mt-1 space-y-1.5">
        {entries.map((entry) => (
          <div key={entry.number}>
            <a
              href={phoneToTelHref(entry.number)}
              className="font-semibold text-[var(--gold-link)] no-underline hover:text-[var(--gold)]"
            >
              {entry.number}
            </a>
            <span className="ml-2 text-[10px] text-[var(--muted)]">
              {entry.className === 'switchboard'
                ? `${entry.label} · force switchboard`
                : entry.className === 'generic'
                  ? `${entry.label} · non-emergency`
                  : entry.label}
            </span>
          </div>
        ))}
      </dd>
    </div>
  );
}
