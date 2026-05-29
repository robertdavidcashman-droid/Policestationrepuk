import Link from 'next/link';
import { buildMetadata, faqPageSchema } from '@/lib/seo';
import { JsonLd } from '@/components/JsonLd';
import { LegalDirectoryHero } from '@/components/legal-directory/LegalDirectoryHero';
import { CategoryCard } from '@/components/legal-directory/CategoryCard';
import { FeaturedListings } from '@/components/legal-directory/FeaturedListings';
import { LegalDirectoryDisclaimer } from '@/components/legal-directory/LegalDirectoryDisclaimer';
import { LEGAL_DIRECTORY_CATEGORIES } from '@/lib/legal-directory/categories';
import { LEGAL_DIRECTORY_BASE } from '@/lib/legal-directory/constants';
import { listApprovedListings } from '@/lib/legal-directory/storage';
import { ENGLISH_COUNTIES } from '@/lib/english-counties';
import { slugifyLegalDirectory } from '@/lib/legal-directory/slug';

export const metadata = buildMetadata({
  title: 'Criminal Law Legal Services Directory',
  description:
    'Free directory for criminal law and criminal justice-related service providers in England and Wales. Solicitors, barristers, police station reps, expert witnesses, interpreters, and more.',
  path: LEGAL_DIRECTORY_BASE,
});

/** ISR: refresh category counts / featured block hourly without per-request rendering. */
export const revalidate = 3600;

const FAQ = [
  {
    q: 'Who can list in this directory?',
    a: 'Criminal defence solicitors, barristers, police station representatives, expert witnesses, interpreters, and other criminal justice-related service providers may submit a free listing. Listings go live immediately after submission.',
  },
  {
    q: 'Are listings endorsed by Police Station Rep UK?',
    a: 'No. The directory is for information only. Users must make their own enquiries and check regulatory status before instructing any provider.',
  },
  {
    q: 'How quickly is my listing published?',
    a: 'New listings and owner amendments go live immediately. The site administrator receives an email copy with links to amend or delete if needed.',
  },
  {
    q: 'Can I amend or delete my listing?',
    a: 'Yes. Use Manage Your Listing with the email address on your listing to receive a secure link. Changes and deletions take effect straight away.',
  },
];

export default async function LegalServicesDirectoryPage() {
  const approved = await listApprovedListings();
  const counts = new Map<string, number>();
  for (const l of approved) {
    counts.set(l.categorySlug, (counts.get(l.categorySlug) ?? 0) + 1);
  }

  const faqSchema = faqPageSchema(FAQ);

  return (
    <>
      <JsonLd data={faqSchema} />
      <LegalDirectoryHero
        title="Criminal Law Legal Services Directory"
        description="A free, searchable directory for criminal law and criminal justice-related service providers across England and Wales. List your firm or practice, or find solicitors, barristers, representatives, and specialist support services."
        breadcrumbs={[
          { label: 'Home', href: '/' },
          { label: 'Legal Services Directory' },
        ]}
      >
        <Link href={`${LEGAL_DIRECTORY_BASE}/search`} className="btn-gold no-underline">
          Search the Directory
        </Link>
        <Link href={`${LEGAL_DIRECTORY_BASE}/add-listing`} className="btn-outline !border-white/40 !text-white hover:!bg-white/10 no-underline">
          Add a Free Listing
        </Link>
        <Link href={`${LEGAL_DIRECTORY_BASE}/manage-listing`} className="btn-outline !border-white/40 !text-white hover:!bg-white/10 no-underline">
          Manage Your Listing
        </Link>
      </LegalDirectoryHero>

      <div className="page-container section-pad space-y-14">
        <section>
          <h2 className="text-h2 text-[var(--navy)]">Why list your practice?</h2>
          <p className="mt-3 max-w-3xl leading-relaxed text-[var(--muted)]">
            Police Station Rep UK connects criminal defence professionals. This directory extends that
            network to solicitors, chambers, accredited representatives, expert witnesses, interpreters,
            and related providers. A free listing can improve visibility in search engines and help
            firms and clients find specialist cover. All submissions are moderated; misleading or unsafe
            content is not published automatically.
          </p>
        </section>

        <FeaturedListings />

        <section>
          <h2 className="text-h2 mb-6 text-[var(--navy)]">Browse by category</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {LEGAL_DIRECTORY_CATEGORIES.slice(0, 12).map((c) => (
              <CategoryCard key={c.slug} category={c} count={counts.get(c.slug) ?? 0} />
            ))}
          </div>
          <Link href={`${LEGAL_DIRECTORY_BASE}/categories`} className="btn-outline mt-6 inline-block no-underline">
            View all categories
          </Link>
        </section>

        <section>
          <h2 className="text-h2 mb-4 text-[var(--navy)]">Search by location</h2>
          <p className="mb-4 text-sm text-[var(--muted)]">
            Find providers by county, town, or region.
          </p>
          <div className="flex flex-wrap gap-2">
            {ENGLISH_COUNTIES.slice(0, 16).map((name) => (
              <Link
                key={name}
                href={`${LEGAL_DIRECTORY_BASE}/location/${slugifyLegalDirectory(name)}`}
                className="rounded-full border border-[var(--card-border)] bg-white px-3 py-1 text-sm font-medium text-[var(--navy)] no-underline hover:border-[var(--gold)]"
              >
                {name}
              </Link>
            ))}
          </div>
          <Link href={`${LEGAL_DIRECTORY_BASE}/locations`} className="btn-outline mt-4 inline-block no-underline">
            All locations
          </Link>
        </section>

        <section>
          <h2 className="text-h2 mb-4 text-[var(--navy)]">Frequently asked questions</h2>
          <dl className="space-y-4">
            {FAQ.map((item) => (
              <div key={item.q} className="card-surface p-5">
                <dt className="font-semibold text-[var(--navy)]">{item.q}</dt>
                <dd className="mt-2 text-sm leading-relaxed text-[var(--muted)]">{item.a}</dd>
              </div>
            ))}
          </dl>
        </section>

        <LegalDirectoryDisclaimer />
      </div>
    </>
  );
}
