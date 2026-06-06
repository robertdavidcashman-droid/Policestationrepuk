import Link from 'next/link';
import { notFound } from 'next/navigation';
import { buildMetadata } from '@/lib/seo';
import { LegalDirectoryHero } from '@/components/legal-directory/LegalDirectoryHero';
import { LegalDirectoryCard } from '@/components/legal-directory/LegalDirectoryCard';
import { LegalDirectoryDisclaimer } from '@/components/legal-directory/LegalDirectoryDisclaimer';
import { PoliceStationRepsCategoryHub } from '@/components/legal-directory/PoliceStationRepsCategoryHub';
import { SolicitorsCategoryHub } from '@/components/legal-directory/SolicitorsCategoryHub';
import { UnclaimedListingsBanner } from '@/components/legal-directory/UnclaimedListingsBanner';
import { getCategoryBySlug, LEGAL_DIRECTORY_CATEGORIES } from '@/lib/legal-directory/categories';
import { getCategoryHubBody } from '@/lib/legal-directory/hub-copy';
import {
  LEGAL_DIRECTORY_BASE,
  PSR_LEGAL_DIRECTORY_CATEGORY_SLUG,
  SOLICITORS_LEGAL_DIRECTORY_CATEGORY_SLUG,
} from '@/lib/legal-directory/constants';
import {
  filterListings,
  listApprovedListings,
  toPublicListing,
} from '@/lib/legal-directory/storage';

export const dynamic = 'force-dynamic';

type Props = { params: Promise<{ categorySlug: string }> };

export async function generateStaticParams() {
  return LEGAL_DIRECTORY_CATEGORIES.map((c) => ({ categorySlug: c.slug }));
}

export async function generateMetadata({ params }: Props) {
  const { categorySlug } = await params;
  const cat = getCategoryBySlug(categorySlug);
  if (!cat) {
    return buildMetadata({
      title: 'Category not found',
      description: 'Category not found.',
      path: `${LEGAL_DIRECTORY_BASE}/category/${categorySlug}`,
      noIndex: true,
    });
  }
  return buildMetadata({
    title: `${cat.seoTitle} | Police Station Rep UK`,
    description: cat.seoDescription,
    path: `${LEGAL_DIRECTORY_BASE}/category/${cat.slug}`,
  });
}

export default async function CategoryPage({ params }: Props) {
  const { categorySlug } = await params;
  const cat = getCategoryBySlug(categorySlug);
  if (!cat) notFound();

  const all = await listApprovedListings();
  const results = filterListings(all, { categorySlug, featuredFirst: true }).map(toPublicListing);
  const unclaimedCount = results.filter((l) => l.unclaimedSeeded).length;
  const hubBody = getCategoryHubBody(cat);

  const related = LEGAL_DIRECTORY_CATEGORIES.filter((c) => c.slug !== cat.slug).slice(0, 4);
  const isPsrCategory = categorySlug === PSR_LEGAL_DIRECTORY_CATEGORY_SLUG;
  const isSolicitorsCategory = categorySlug === SOLICITORS_LEGAL_DIRECTORY_CATEGORY_SLUG;

  return (
    <>
      <LegalDirectoryHero
        title={cat.label}
        description={cat.intro}
        breadcrumbs={[
          { label: 'Home', href: '/' },
          { label: 'Legal Services Directory', href: LEGAL_DIRECTORY_BASE },
          { label: 'Categories', href: `${LEGAL_DIRECTORY_BASE}/categories` },
          { label: cat.label },
        ]}
      />
      <div className="page-container section-pad space-y-8">
        <section className="card-surface p-6">
          <p className="leading-relaxed text-[var(--muted)]">{hubBody}</p>
          <p className="mt-3 text-sm text-[var(--muted)]">
            <Link href={`${LEGAL_DIRECTORY_BASE}/search?category=${cat.slug}`} className="font-semibold text-[var(--gold-link)] hover:underline">
              Search all {cat.label.toLowerCase()}
            </Link>
            {' · '}
            <Link href={`${LEGAL_DIRECTORY_BASE}/resources`} className="font-semibold text-[var(--gold-link)] hover:underline">
              Official resources &amp; regulators
            </Link>
          </p>
        </section>

        <UnclaimedListingsBanner unclaimedCount={unclaimedCount} />

        {isPsrCategory && (
          <PoliceStationRepsCategoryHub listingCount={results.length} variant="full" />
        )}

        {isSolicitorsCategory && (
          <SolicitorsCategoryHub
            listingCount={results.length}
            unclaimedCount={unclaimedCount}
            variant="full"
          />
        )}

        {results.length === 0 ? (
          !isPsrCategory ? (
            <div className="card-surface p-8">
              <p className="text-[var(--muted)]">
                There are no approved listings in this category yet. Meaningful information about{' '}
                {cat.label.toLowerCase()} is shown above; check back as providers register.
              </p>
              <Link href={`${LEGAL_DIRECTORY_BASE}/add-listing`} className="btn-gold mt-4 inline-block no-underline">
                Add a free listing
              </Link>
            </div>
          ) : null
        ) : (
          <>
            <p className="text-sm font-semibold text-[var(--navy)]">{results.length} approved listing(s)</p>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {results.map((l) => (
                <LegalDirectoryCard key={l.id} listing={l} />
              ))}
            </div>
          </>
        )}

        <section>
          <h2 className="text-h3 text-[var(--navy)]">Related categories</h2>
          <ul className="mt-3 flex flex-wrap gap-2">
            {related.map((r) => (
              <li key={r.slug}>
                <Link
                  href={`${LEGAL_DIRECTORY_BASE}/category/${r.slug}`}
                  className="rounded-full border px-3 py-1 text-sm no-underline text-[var(--navy)] hover:border-[var(--gold)]"
                >
                  {r.label}
                </Link>
              </li>
            ))}
          </ul>
        </section>

        <LegalDirectoryDisclaimer />
      </div>
    </>
  );
}
