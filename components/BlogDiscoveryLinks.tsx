import Link from 'next/link';
import type { BlogCategoryId } from '@/lib/blog/types';

const CATEGORY_DIRECTORY_HINT: Partial<Record<BlogCategoryId, { href: string; label: string }>> = {
  'law-firms': { href: '/PoliceStationCover', label: 'Police station cover for firms' },
  'freelance-reps': { href: '/register', label: 'Join the rep directory' },
  attendance: { href: '/StationsDirectory', label: 'Station phone numbers' },
  'best-practice': { href: '/Wiki', label: 'Rep Wiki & guides' },
};

type BlogDiscoveryLinksProps = {
  categories: BlogCategoryId[];
};

export function BlogDiscoveryLinks({ categories }: BlogDiscoveryLinksProps) {
  const hints = categories
    .map((id) => CATEGORY_DIRECTORY_HINT[id])
    .filter(Boolean) as { href: string; label: string }[];

  return (
    <section
      className="mt-12 rounded-[var(--radius-lg)] border border-[var(--card-border)] bg-[var(--card-bg)] p-6 shadow-[var(--card-shadow)] sm:p-8"
      aria-labelledby="blog-discovery-heading"
    >
      <h2 id="blog-discovery-heading" className="text-lg font-bold text-[var(--navy)]">
        Find cover &amp; resources
      </h2>
      <p className="mt-2 text-sm leading-relaxed text-[var(--muted)]">
        PoliceStationRepUK is a free directory of accredited police station representatives across England
        &amp; Wales.
      </p>
      <ul className="mt-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
        <li>
          <Link
            href="/directory"
            className="inline-flex font-semibold text-[var(--gold-link)] no-underline hover:text-[var(--gold)] hover:underline"
          >
            Search the rep directory →
          </Link>
        </li>
        <li>
          <Link
            href="/Blog"
            className="inline-flex font-semibold text-[var(--gold-link)] no-underline hover:text-[var(--gold)] hover:underline"
          >
            More blog articles →
          </Link>
        </li>
        {hints.map((h) => (
          <li key={h.href}>
            <Link
              href={h.href}
              className="inline-flex font-semibold text-[var(--gold-link)] no-underline hover:text-[var(--gold)] hover:underline"
            >
              {h.label} →
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
