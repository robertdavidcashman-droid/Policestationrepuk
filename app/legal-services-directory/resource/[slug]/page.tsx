import { notFound } from 'next/navigation';
import Link from 'next/link';
import { buildMetadata, breadcrumbSchema } from '@/lib/seo';
import { JsonLd } from '@/components/JsonLd';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { LegalDirectoryDisclaimer } from '@/components/legal-directory/LegalDirectoryDisclaimer';
import { LEGAL_DIRECTORY_BASE } from '@/lib/legal-directory/constants';
import {
  getAllLegalResources,
  getLegalResourceBySlug,
} from '@/lib/legal-directory/resources';
import { SITE_URL } from '@/lib/seo-layer/config';

type Props = { params: Promise<{ slug: string }> };

const RESOURCES_BASE = `${LEGAL_DIRECTORY_BASE}/resources`;

export function generateStaticParams() {
  return getAllLegalResources().map((r) => ({ slug: r.slug }));
}

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const resource = getLegalResourceBySlug(slug);
  if (!resource) {
    return buildMetadata({
      title: 'Resource not found',
      description: 'This resource is not available in the directory.',
      path: `${LEGAL_DIRECTORY_BASE}/resource/${slug}`,
      noIndex: true,
    });
  }
  return buildMetadata({
    title: `${resource.name} — Official Resource`,
    description: resource.shortDescription,
    path: `${LEGAL_DIRECTORY_BASE}/resource/${resource.slug}`,
  });
}

export default async function LegalResourcePage({ params }: Props) {
  const { slug } = await params;
  const resource = getLegalResourceBySlug(slug);
  if (!resource) notFound();

  const breadcrumbs = breadcrumbSchema([
    { name: 'Home', url: SITE_URL },
    { name: 'Legal Services Directory', url: `${SITE_URL}${LEGAL_DIRECTORY_BASE}` },
    { name: 'Official Resources', url: `${SITE_URL}${RESOURCES_BASE}` },
    { name: resource.name, url: `${SITE_URL}${LEGAL_DIRECTORY_BASE}/resource/${resource.slug}` },
  ]);

  return (
    <>
      <JsonLd data={breadcrumbs} />
      <section className="bg-[var(--navy)] py-10">
        <div className="page-container !py-0">
          <Breadcrumbs
            light
            items={[
              { label: 'Home', href: '/' },
              { label: 'Legal Services Directory', href: LEGAL_DIRECTORY_BASE },
              { label: 'Official Resources', href: RESOURCES_BASE },
              { label: resource.name },
            ]}
          />
          <h1 className="mt-3 text-h1 text-white">{resource.name}</h1>
          <p className="mt-2 text-slate-300">{resource.group} · {resource.region}</p>
          <div className="mt-4 flex flex-wrap gap-2">
            <span className="rounded-full bg-emerald-500/20 px-3 py-1 text-xs font-bold text-emerald-200">
              Official resource
            </span>
            <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-slate-200">
              Link checked {resource.dateChecked}
            </span>
          </div>
        </div>
      </section>

      <div className="page-container section-pad">
        <div className="grid gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            <section className="card-surface p-6">
              <h2 className="text-h3 text-[var(--navy)]">About this resource</h2>
              <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-[var(--muted)]">
                {resource.description}
              </p>
            </section>

            <section className="card-surface p-6">
              <h2 className="text-h3 text-[var(--navy)]">Is this an endorsement?</h2>
              <p className="mt-3 text-sm leading-relaxed text-[var(--muted)]">
                No. This is an editorial link to an official, independent organisation, provided as a
                signpost for convenience. {resource.name} is not affiliated with Police Station Rep UK,
                and inclusion here is not a recommendation or legal advice. Always confirm details on
                the organisation&rsquo;s own website.
              </p>
            </section>
          </div>

          <aside className="space-y-4">
            <div className="card-surface p-6">
              <h2 className="text-h4 text-[var(--navy)]">Visit the official site</h2>
              <p className="mt-2 text-sm text-[var(--muted)]">{resource.shortDescription}</p>
              <a
                href={resource.url}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-gold mt-4 block break-words text-center no-underline"
              >
                Go to {resource.name}
              </a>
              <p className="mt-3 break-all text-xs text-[var(--muted)]">{resource.url}</p>
              <p className="mt-3 text-xs text-[var(--muted)]">
                Link last confirmed working on {resource.dateChecked}.
              </p>
            </div>

            <Link
              href={RESOURCES_BASE}
              className="block text-sm font-semibold text-[var(--gold-link)] no-underline hover:underline"
            >
              ← All official resources
            </Link>
          </aside>
        </div>

        <div className="mt-10">
          <LegalDirectoryDisclaimer />
        </div>
      </div>
    </>
  );
}
