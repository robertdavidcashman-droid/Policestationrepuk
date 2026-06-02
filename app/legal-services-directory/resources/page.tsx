import Link from 'next/link';
import { buildMetadata, breadcrumbSchema } from '@/lib/seo';
import { JsonLd } from '@/components/JsonLd';
import { LegalDirectoryHero } from '@/components/legal-directory/LegalDirectoryHero';
import { LegalDirectoryDisclaimer } from '@/components/legal-directory/LegalDirectoryDisclaimer';
import { LEGAL_DIRECTORY_BASE } from '@/lib/legal-directory/constants';
import { getLegalResourcesByGroup } from '@/lib/legal-directory/resources';
import { SITE_URL } from '@/lib/seo-layer/config';

const RESOURCES_BASE = `${LEGAL_DIRECTORY_BASE}/resources`;

export const metadata = buildMetadata({
  title: 'Official Legal Resources & Links',
  description:
    'A curated list of official, authoritative legal resources for England and Wales — regulators, legal aid, courts, the CPS, complaints bodies and more. Editorial signposts, not provider listings.',
  path: RESOURCES_BASE,
});

export const revalidate = 86400;

export default function LegalResourcesPage() {
  const groups = getLegalResourcesByGroup();

  const breadcrumbs = breadcrumbSchema([
    { name: 'Home', url: SITE_URL },
    { name: 'Legal Services Directory', url: `${SITE_URL}${LEGAL_DIRECTORY_BASE}` },
    { name: 'Official Resources', url: `${SITE_URL}${RESOURCES_BASE}` },
  ]);

  return (
    <>
      <JsonLd data={breadcrumbs} />
      <LegalDirectoryHero
        title="Official Legal Resources"
        description="Authoritative, official links for criminal justice in England and Wales — regulators, legal aid, courts and prosecution, complaints bodies, and trusted guidance. These are editorial signposts, not paid listings."
        breadcrumbs={[
          { label: 'Home', href: '/' },
          { label: 'Legal Services Directory', href: LEGAL_DIRECTORY_BASE },
          { label: 'Official Resources' },
        ]}
      >
        <Link href={`${LEGAL_DIRECTORY_BASE}/search`} className="btn-gold no-underline">
          Find a provider instead
        </Link>
      </LegalDirectoryHero>

      <div className="page-container section-pad space-y-12">
        <section>
          <div className="card-surface flex items-start gap-3 border-l-4 border-emerald-500 p-5">
            <p className="text-sm leading-relaxed text-[var(--muted)]">
              <strong className="text-[var(--navy)]">What are these?</strong> The resources below are
              links to official, independent organisations (such as the CPS, the SRA, and the Law
              Society). They are provided as a public reference. They are <strong>not</strong> provider
              listings, cannot be claimed, and their inclusion is not an endorsement. Looking for a
              firm or representative instead?{' '}
              <Link href={`${LEGAL_DIRECTORY_BASE}/search`} className="font-semibold text-[var(--gold-link)] no-underline hover:underline">
                Search the provider directory
              </Link>
              .
            </p>
          </div>
        </section>

        {groups.map(({ group, items }) => (
          <section key={group}>
            <h2 className="text-h2 mb-5 text-[var(--navy)]">{group}</h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {items.map((r) => (
                <div key={r.slug} className="card-surface flex flex-col p-5">
                  <div className="mb-2 flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-bold text-emerald-700">
                      Official resource
                    </span>
                  </div>
                  <h3 className="text-h4 text-[var(--navy)]">
                    <Link
                      href={`${LEGAL_DIRECTORY_BASE}/resource/${r.slug}`}
                      className="no-underline hover:underline"
                    >
                      {r.name}
                    </Link>
                  </h3>
                  <p className="mt-2 flex-1 text-sm leading-relaxed text-[var(--muted)]">
                    {r.shortDescription}
                  </p>
                  <div className="mt-4 flex flex-wrap gap-3 text-sm font-semibold">
                    <Link
                      href={`${LEGAL_DIRECTORY_BASE}/resource/${r.slug}`}
                      className="text-[var(--gold-link)] no-underline hover:underline"
                    >
                      Details
                    </Link>
                    <a
                      href={r.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[var(--gold-link)] no-underline hover:underline"
                    >
                      Visit site ↗
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </section>
        ))}

        <LegalDirectoryDisclaimer />
      </div>
    </>
  );
}
