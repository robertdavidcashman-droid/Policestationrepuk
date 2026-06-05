import Link from 'next/link';
import { LEGAL_DIRECTORY_BASE } from '@/lib/legal-directory/constants';

const RESOURCES_HREF = `${LEGAL_DIRECTORY_BASE}/resources`;
const SEARCH_HREF = `${LEGAL_DIRECTORY_BASE}/search`;

type Variant = 'card' | 'sidebar' | 'compact';

/** Cross-link from rep wiki / guides to the curated official resources directory. */
export function OfficialResourcesCrossLink({ variant = 'card' }: { variant?: Variant }) {
  if (variant === 'compact') {
    return (
      <p className="text-sm leading-relaxed text-[var(--muted)]">
        Need an official regulator or gov.uk link (CPS, SRA, LAA, etc.)? See our{' '}
        <Link href={RESOURCES_HREF} className="font-semibold text-[var(--gold-link)] hover:underline">
          Official Legal Resources
        </Link>{' '}
        in the Legal Services Directory — or{' '}
        <Link href={SEARCH_HREF} className="font-semibold text-[var(--gold-link)] hover:underline">
          search for a provider
        </Link>
        .
      </p>
    );
  }

  if (variant === 'sidebar') {
    return (
      <div className="rounded-[var(--radius-lg)] border border-[var(--card-border)] bg-[var(--gold-pale)]/40 p-5 shadow-[var(--card-shadow)]">
        <h2 className="text-sm font-bold uppercase tracking-wider text-[var(--muted)]">
          Directories
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-[var(--muted)]">
          Official regulator and gov.uk links (CPS, SRA, LAA, courts) live in our curated resources
          hub — separate from claimable firm listings.
        </p>
        <div className="mt-3 flex flex-col gap-2">
          <Link
            href={RESOURCES_HREF}
            className="text-sm font-semibold text-[var(--gold-link)] no-underline hover:underline"
          >
            Official Legal Resources →
          </Link>
          <Link
            href={SEARCH_HREF}
            className="text-sm font-semibold text-[var(--navy)] no-underline hover:text-[var(--gold-link)]"
          >
            Search providers →
          </Link>
          <Link
            href="/StationsDirectory"
            className="text-sm font-semibold text-[var(--navy)] no-underline hover:text-[var(--gold-link)]"
          >
            Police station numbers →
          </Link>
        </div>
      </div>
    );
  }

  return (
    <Link
      href={RESOURCES_HREF}
      className="block rounded-[var(--radius)] border border-[var(--card-border)] bg-[var(--card-bg)] p-4 no-underline shadow-[var(--card-shadow)] transition-all hover:border-[var(--gold)]/40 hover:shadow-[var(--card-shadow-hover)]"
    >
      <p className="font-medium text-[var(--navy)]">Official Legal Resources</p>
      <p className="mt-1 text-sm text-[var(--muted)]">
        Curated CPS, SRA, LAA, courts &amp; regulator links — in the Legal Services Directory
      </p>
    </Link>
  );
}

/** Reciprocal links from the legal resources hub back to rep training content. */
export function RepGuidesCrossLink() {
  return (
    <section className="card-surface p-6">
      <h2 className="text-h3 text-[var(--navy)]">Rep training &amp; guides</h2>
      <p className="mt-2 text-sm leading-relaxed text-[var(--muted)]">
        These official links complement our free rep knowledge base — practical articles on PACE,
        interviews, legal aid, and station work.
      </p>
      <ul className="mt-4 flex flex-wrap gap-3 text-sm font-semibold">
        <li>
          <Link href="/Wiki" className="text-[var(--gold-link)] no-underline hover:underline">
            Rep Knowledge Base
          </Link>
        </li>
        <li>
          <Link href="/Resources" className="text-[var(--gold-link)] no-underline hover:underline">
            Knowledge Centre
          </Link>
        </li>
        <li>
          <Link href="/BeginnersGuide" className="text-[var(--gold-link)] no-underline hover:underline">
            Beginner&apos;s Guide
          </Link>
        </li>
        <li>
          <Link href="/PACE" className="text-[var(--gold-link)] no-underline hover:underline">
            PACE Codes
          </Link>
        </li>
      </ul>
    </section>
  );
}
