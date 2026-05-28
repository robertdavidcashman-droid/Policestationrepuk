import Link from 'next/link';
import { buildMetadata } from '@/lib/seo';
import { LegalDirectoryHero } from '@/components/legal-directory/LegalDirectoryHero';
import { CategoryCard } from '@/components/legal-directory/CategoryCard';
import { LegalDirectoryDisclaimer } from '@/components/legal-directory/LegalDirectoryDisclaimer';
import { LEGAL_DIRECTORY_CATEGORIES } from '@/lib/legal-directory/categories';
import { LEGAL_DIRECTORY_BASE } from '@/lib/legal-directory/constants';
import { listApprovedListings } from '@/lib/legal-directory/storage';

export const metadata = buildMetadata({
  title: 'Legal Services Directory Categories',
  description: 'Browse criminal law directory categories: solicitors, barristers, police station reps, expert witnesses, and more.',
  path: `${LEGAL_DIRECTORY_BASE}/categories`,
});

/** ISR: refresh per-category listing counts hourly. */
export const revalidate = 3600;

export default async function CategoriesIndexPage() {
  const approved = await listApprovedListings();
  const counts = new Map<string, number>();
  for (const l of approved) {
    counts.set(l.categorySlug, (counts.get(l.categorySlug) ?? 0) + 1);
  }

  return (
    <>
      <LegalDirectoryHero
        title="Directory categories"
        description="Browse providers by type of criminal law or criminal justice service."
        breadcrumbs={[
          { label: 'Home', href: '/' },
          { label: 'Legal Services Directory', href: LEGAL_DIRECTORY_BASE },
          { label: 'Categories' },
        ]}
      />
      <div className="page-container section-pad space-y-8">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {LEGAL_DIRECTORY_CATEGORIES.map((c) => (
            <CategoryCard key={c.slug} category={c} count={counts.get(c.slug) ?? 0} />
          ))}
        </div>
        <Link href={`${LEGAL_DIRECTORY_BASE}/add-listing`} className="btn-gold inline-block no-underline">
          Add a free listing
        </Link>
        <LegalDirectoryDisclaimer />
      </div>
    </>
  );
}
