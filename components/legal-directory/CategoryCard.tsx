import Link from 'next/link';
import type { LegalDirectoryCategory } from '@/lib/legal-directory/categories';
import { getCategoryCardCountLabel } from '@/lib/legal-directory/category-display';
import { LEGAL_DIRECTORY_BASE } from '@/lib/legal-directory/constants';

export function CategoryCard({ category, count }: { category: LegalDirectoryCategory; count?: number }) {
  return (
    <Link
      href={`${LEGAL_DIRECTORY_BASE}/category/${category.slug}`}
      className="card-surface block p-5 no-underline transition-colors hover:border-[var(--gold)]/50"
    >
      <h3 className="text-lg font-bold text-[var(--navy)]">{category.label}</h3>
      <p className="mt-2 text-sm leading-relaxed text-[var(--muted)] line-clamp-3">{category.intro}</p>
      {typeof count === 'number' && (
        <p className="mt-3 text-xs font-semibold text-[var(--gold-link)]">
          {getCategoryCardCountLabel(category.slug, count)}
        </p>
      )}
    </Link>
  );
}
