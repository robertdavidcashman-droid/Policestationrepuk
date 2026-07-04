import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getCountyBySlug, getRepsByCounty, getStationsByCounty } from '@/lib/data';
import { getCountyContent } from '@/lib/counties-content';
import { buildMetadata, breadcrumbSchema, placeSchema, directoryItemListSchema } from '@/lib/seo';
import { JsonLd } from '@/components/JsonLd';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { DirectoryCard } from '@/components/DirectoryCard';
import { StationCard } from '@/components/StationCard';
import { DirectoryComplianceNotice } from '@/components/DirectoryComplianceNotice';
import { DirectoryCredentialVerificationNotice } from '@/components/DirectoryCredentialVerificationNotice';
import { CustodyNotePagePromo } from '@/components/CustodyNotePagePromo';
import { StationNumbersPromo } from '@/components/StationNumbersPromo';
import { AdvertisementLabel } from '@/components/AdvertisementLabel';
import { POLICESTATIONAGENT_KENT_RESOURCES_HREF } from '@/lib/policestationagent-promo';

export const dynamic = 'force-static';
/** ISR so rep/station counts refresh without a full redeploy. */
export const revalidate = 86_400;

interface PageProps {
  params: Promise<{ county: string }>;
}

export async function generateStaticParams() {
  const { getAllCounties } = await import('@/lib/data');
  const counties = await getAllCounties();
  return counties.map((c) => ({ county: c.slug }));
}

export async function generateMetadata({ params }: PageProps) {
  const { county: countySlug } = await params;
  const county = await getCountyBySlug(countySlug);
  if (!county) return {};
  const content = getCountyContent(countySlug, county.name);
  return buildMetadata({
    title: content.metaTitle,
    description: content.metaDescription,
    path: `/directory/${countySlug}`,
  });
}

export default async function DirectoryCountyPage({ params }: PageProps) {
  const { county: countySlug } = await params;
  const county = await getCountyBySlug(countySlug);
  if (!county) notFound();

  const [reps, stations] = await Promise.all([
    getRepsByCounty(county.name),
    getStationsByCounty(county.name),
  ]);
  const content = getCountyContent(countySlug, county.name);

  const canonicalPath = `/directory/${countySlug}`;
  const breadcrumbSchemaData = breadcrumbSchema([
    { name: 'Home', url: '/' },
    { name: 'Directory', url: '/directory' },
    { name: 'Counties', url: '/directory/counties' },
    { name: county.name, url: canonicalPath },
  ]);
  const placeSchemaData = placeSchema(county.name, canonicalPath);

  return (
    <>
      <JsonLd data={placeSchemaData} />
      <JsonLd data={breadcrumbSchemaData} />
      {reps.length > 0 && (
        <JsonLd
          data={directoryItemListSchema(
            reps.map((r) => ({ name: r.name, slug: r.slug })),
            county.name
          )}
        />
      )}

      {/* Hero */}
      <section className="relative overflow-hidden bg-[var(--navy)]">
        <div className="absolute inset-0 bg-gradient-to-br from-[var(--navy)] via-[#0f1d45] to-[#0a1633]" />
        <div className="relative mx-auto max-w-7xl px-4 pb-10 pt-8 sm:px-6 sm:pb-14 sm:pt-10 lg:px-8">
          <Breadcrumbs
            light
            items={[
              { label: 'Home', href: '/' },
              { label: 'Directory', href: '/directory' },
              { label: 'Counties', href: '/directory/counties' },
              { label: county.name },
            ]}
          />
          <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
            {content.h1}
          </h1>
          <p className="mt-3 max-w-2xl text-base leading-relaxed text-slate-300 sm:text-lg">
            {content.intro}
          </p>
          <div className="mt-5 flex flex-wrap gap-4 text-sm">
            <span className="flex items-center gap-2 rounded-full bg-white/10 px-4 py-1.5 font-semibold text-white">
              <span className="text-xl font-extrabold text-[var(--gold)]">{reps.length}</span>
              Representative{reps.length !== 1 ? 's' : ''}
            </span>
            <span className="flex items-center gap-2 rounded-full bg-white/10 px-4 py-1.5 font-semibold text-white">
              <span className="text-xl font-extrabold text-[var(--gold)]">{stations.length}</span>
              Station{stations.length !== 1 ? 's' : ''}
            </span>
          </div>
        </div>
      </section>

      {/* Main content */}
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <DirectoryComplianceNotice className="mb-8" />

        {countySlug === "kent" && (
          <div className="mb-8 rounded-2xl border border-[var(--navy)]/15 bg-[var(--navy)]/[0.03] p-6">
            <p className="text-sm font-bold uppercase tracking-wider text-[var(--navy)]">
              Need urgent cover in Kent?
            </p>
            <p className="mt-2 text-sm text-slate-700">
              Post your request in the community WhatsApp group — any available Kent
              representative can pick it up. This is open to all accredited reps
              listed here; no rep is given priority.
            </p>
            <div className="mt-3 flex flex-wrap gap-3">
              <Link href="/WhatsApp" className="btn-gold !text-sm no-underline">
                Post in the WhatsApp group
              </Link>
              <a href="#reps" className="btn-outline !text-sm no-underline">
                Browse Kent reps
              </a>
            </div>
          </div>
        )}

        {countySlug === "kent" && (
          <div className="mb-8 rounded-2xl border-2 border-[var(--gold)]/40 bg-[var(--gold-pale)]/30 p-6">
            <AdvertisementLabel variant="gold" label="Advertisement" />
            <p className="mt-2 text-xs font-bold uppercase tracking-wider text-[var(--navy)]">
              Kent duty solicitor resource
            </p>
            <p className="mt-2 text-sm text-slate-700">
              Free, sourced guide to police station rights in Kent — separate from this directory.
            </p>
            <a
              href={POLICESTATIONAGENT_KENT_RESOURCES_HREF}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 inline-block text-sm font-bold text-[var(--navy)] underline"
            >
              Kent police custody resources →
            </a>
          </div>
        )}

        <CustodyNotePagePromo variant="compact" className="mb-8" />

        {/* Reps grid */}
        <section id="reps" className="scroll-mt-24">
          <h2 className="text-xl font-bold text-[var(--navy)] sm:text-2xl">
            Representatives in {county.name}
          </h2>
          {reps.length > 0 && <DirectoryCredentialVerificationNotice className="mt-4" />}
          {reps.length === 0 ? (
            <div className="mt-4 rounded-2xl border border-dashed border-slate-200 bg-white px-6 py-14 text-center shadow-sm">
              <p className="text-lg font-bold text-[var(--navy)]">No reps listed yet</p>
              <p className="mx-auto mt-2 max-w-md text-sm text-slate-600">
                Are you an accredited police station representative covering {county.name}?
              </p>
              <Link href="/register" className="btn-gold mt-4 inline-block !text-sm no-underline">
                Register free
              </Link>
            </div>
          ) : (
            <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {reps.map((rep) => (
                <DirectoryCard key={rep.id} rep={rep} />
              ))}
            </div>
          )}
        </section>

        {/* Stations grid */}
        <section className="mt-12">
          <h2 className="text-xl font-bold text-[var(--navy)] sm:text-2xl">
            Police stations in {county.name}
          </h2>
          {stations.length === 0 ? (
            <p className="mt-3 text-[var(--muted)]">No police stations listed for this county yet.</p>
          ) : (
            <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {stations.map((station) => (
                <StationCard key={station.id} station={station} />
              ))}
            </div>
          )}
        </section>

        <div className="mt-12">
          <StationNumbersPromo variant="section" countyFilter={county.name} />
        </div>

        <section className="mt-10 rounded-2xl border border-slate-200 bg-slate-50/90 p-6 sm:p-8">
          <h2 className="text-lg font-bold text-[var(--navy)]">More ways to search {county.name}</h2>
          <p className="mt-2 text-sm leading-relaxed text-[var(--muted)]">
            Station pages link back to this county hub; use search or the station index when you need a different force
            or custody suite name.
          </p>
          <ul className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-sm font-semibold">
            <li>
              <Link href="/search" className="text-[var(--gold-link)] no-underline hover:underline">
                Directory keyword search
              </Link>
            </li>
            <li>
              <Link href="/directory/counties" className="text-[var(--gold-link)] no-underline hover:underline">
                All counties
              </Link>
            </li>
            <li>
              <Link href="/StationsDirectory" className="text-[var(--gold-link)] no-underline hover:underline">
                All stations (A–Z)
              </Link>
            </li>
            <li>
              <Link href="/Map" className="text-[var(--gold-link)] no-underline hover:underline">
                Map view
              </Link>
            </li>
            <li>
              <Link href="/directory" className="text-[var(--gold-link)] no-underline hover:underline">
                National directory
              </Link>
            </li>
          </ul>
        </section>

        <p className="mt-10 max-w-3xl text-xs leading-relaxed text-[var(--muted)]">
          Listings are for professional reference. Police station representatives are accredited to attend under
          solicitor instruction where required — they are not a substitute for instructing a solicitor firm when that
          is necessary. Availability and coverage change; contact representatives directly to confirm.
        </p>

        <div className="mt-8 flex flex-wrap gap-4">
          <Link href="/directory" className="font-medium text-[var(--gold-link)] no-underline hover:text-[var(--gold)]">
            &larr; Back to full directory
          </Link>
          <Link href="/directory/counties" className="font-medium text-[var(--muted)] no-underline hover:text-[var(--gold-hover)]">
            Browse all counties
          </Link>
        </div>
      </div>
    </>
  );
}
