import { listApprovedListings } from '@/lib/legal-directory/storage';
import { toPublicListing } from '@/lib/legal-directory/storage';
import { LegalDirectoryCard } from './LegalDirectoryCard';
import Link from 'next/link';

/**
 * Featured providers block — monetisation: replace with paid featured API later.
 */
export async function FeaturedListings() {
  const all = await listApprovedListings();
  const featured = all.filter((l) => l.featured || l.promoted).slice(0, 6);

  if (featured.length === 0) {
    return (
      <section className="rounded-[var(--radius)] border border-dashed border-[var(--card-border)] bg-slate-50 p-8 text-center">
        <h2 className="text-h3 text-[var(--navy)]">Featured providers</h2>
        <p className="mt-2 text-sm text-[var(--muted)]">
          Featured and promoted placements appear here.{' '}
          <Link href="/Contact" className="font-semibold text-[var(--navy)] no-underline hover:text-[var(--gold-link)]">
            Contact us
          </Link>{' '}
          to enquire about featured placement.
        </p>
      </section>
    );
  }

  return (
    <section>
      <h2 className="text-h2 mb-4 text-[var(--navy)]">Featured providers</h2>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {featured.map((l) => (
          <LegalDirectoryCard key={l.id} listing={toPublicListing(l)} />
        ))}
      </div>
    </section>
  );
}
