import { notFound } from 'next/navigation';
import Link from 'next/link';
import {
  getCountyBySlug,
  getRepsByCounty,
  getStationsByCounty,
} from '@/lib/data';
import { getCountyContent } from '@/lib/counties-content';
import { buildMetadata, legalServiceSchema, breadcrumbSchema, placeSchema } from '@/lib/seo';
import { JsonLd } from '@/components/JsonLd';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { RepCard } from '@/components/RepCard';
import { StationCard } from '@/components/StationCard';
import { CustodyNotePagePromo } from '@/components/CustodyNotePagePromo';

export const dynamic = 'force-static';
export const revalidate = false;

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
  const path = `/directory/${countySlug}`;
  return buildMetadata({
    title: content.metaTitle,
    description: content.metaDescription,
    path,
  });
}

export default async function CountyPage({ params }: PageProps) {
  const { county: countySlug } = await params;
  const county = await getCountyBySlug(countySlug);
  if (!county) notFound();

  const [reps, stations] = await Promise.all([
    getRepsByCounty(county.name),
    getStationsByCounty(county.name),
  ]);
  const content = getCountyContent(countySlug, county.name);

  const canonicalPath = `/directory/${countySlug}`;
  const breadcrumbItems = [
    { label: 'Home', href: '/' },
    { label: 'Directory', href: '/directory' },
    { label: `Representatives in ${county.name}` },
  ];
  const breadcrumbSchemaData = breadcrumbSchema([
    { name: 'Home', url: '/' },
    { name: 'Directory', url: '/directory' },
    { name: `Representatives in ${county.name}`, url: canonicalPath },
  ]);
  const placeSchemaData = placeSchema(county.name, canonicalPath);

  return (
    <>
      <JsonLd data={placeSchemaData} />
      <JsonLd data={breadcrumbSchemaData} />
      {reps.length > 0 && <JsonLd data={legalServiceSchema({ name: reps[0].name, slug: reps[0].slug, counties: [reps[0].county].filter(Boolean), accreditation: reps[0].accreditation, phone: reps[0].phone })} />}
      <div className="page-container">
        <div className="w-full min-w-0">
          <Breadcrumbs items={breadcrumbItems} />
          <h1 className="text-h1 text-[var(--foreground)]">{content.h1}</h1>
          <p className="mt-4 max-w-3xl text-base leading-relaxed text-[var(--muted)]">
            {content.intro}
          </p>

          <CustodyNotePagePromo variant="compact" className="mt-8" />

          {content.sections.map((section, i) => (
            <section key={i} className="mt-8 rounded-[var(--radius-lg)] border border-[var(--card-border)] bg-[var(--card-bg)] p-[var(--card-padding)] shadow-[var(--card-shadow)]">
              <h2 className="text-h2 text-[var(--foreground)]">{section.heading}</h2>
              <p className="mt-2 max-w-3xl leading-relaxed text-[var(--foreground)]">{section.body}</p>
            </section>
          ))}

          <section className="mt-12">
            <h2 className="text-h2 text-[var(--foreground)]">Representatives in {county.name}</h2>
            {reps.length === 0 ? (
              <p className="mt-3 text-[var(--muted)]">No representatives listed for this county yet.</p>
            ) : (
              <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {reps.map((rep) => (
                  <RepCard key={rep.id} rep={rep} />
                ))}
              </div>
            )}
          </section>

          <section className="mt-12">
            <h2 className="text-h2 text-[var(--foreground)]">Police stations in {county.name}</h2>
            {stations.length === 0 ? (
              <p className="mt-3 text-[var(--muted)]">No police stations listed for this county yet.</p>
            ) : (
              <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {stations.map((station) => (
                  <StationCard key={station.id} station={station} />
                ))}
              </div>
            )}
          </section>

          <p className="mt-10">
            <Link href="/directory" className="font-medium text-[var(--accent)] no-underline hover:underline">
              ← Back to full directory
            </Link>
          </p>
        </div>
      </div>
    </>
  );
}
