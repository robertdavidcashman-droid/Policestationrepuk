import Link from 'next/link';
import { LEGAL_DIRECTORY_BASE } from '@/lib/legal-directory/constants';

/**
 * Cross-promotion for the Legal Services Directory, reused across the homepage,
 * /directory and /Firms. Two variants:
 *   - 'banner' : slim inline strip for use inside existing page content
 *   - 'section': full-width navy section for the homepage
 */
export function LegalDirectoryPromo({
  variant = 'banner',
  className = '',
}: {
  variant?: 'banner' | 'section';
  className?: string;
}) {
  if (variant === 'section') {
    return (
      <section className={`bg-[var(--navy)] py-12 sm:py-16 ${className}`} aria-label="Legal Services Directory">
        <div className="mx-auto max-w-5xl px-4 text-center sm:px-6 lg:px-8">
          <p className="text-[11px] font-bold uppercase tracking-widest text-[var(--gold)]">New</p>
          <h2 className="mt-2 text-2xl font-extrabold tracking-tight text-white sm:text-3xl">
            ⚖️ Criminal Law Legal Services Directory
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-base leading-relaxed text-slate-300">
            More than police station reps. Find — or list — criminal defence solicitors, barristers&apos;
            chambers, expert witnesses, interpreters, process servers, and other criminal justice
            providers across England &amp; Wales. Free listings, live immediately after submission.
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <Link href={LEGAL_DIRECTORY_BASE} className="btn-gold no-underline">
              Browse the directory
            </Link>
            <Link
              href={`${LEGAL_DIRECTORY_BASE}/add-listing`}
              className="inline-flex items-center rounded-lg border border-white/25 bg-white/10 px-5 py-2.5 text-sm font-semibold text-white no-underline transition-colors hover:bg-white/20"
            >
              Add a free listing
            </Link>
          </div>
        </div>
      </section>
    );
  }

  return (
    <aside
      className={`flex flex-col items-stretch gap-3 rounded-xl border border-[var(--gold)]/25 bg-gradient-to-r from-[var(--navy)] to-[#152e6e] px-5 py-3 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:gap-4 ${className}`}
    >
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <span className="hidden text-2xl sm:inline" aria-hidden>
          ⚖️
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold text-white">
            Looking for solicitors, barristers or experts?
          </p>
          <p className="mt-0.5 text-xs text-white/70">
            Browse the new Legal Services Directory — criminal defence solicitors, chambers, expert
            witnesses, interpreters and more across England &amp; Wales.
          </p>
        </div>
      </div>
      <Link
        href={LEGAL_DIRECTORY_BASE}
        className="btn-gold shrink-0 self-start !px-4 !py-2 !text-xs no-underline sm:self-auto"
      >
        Open directory
      </Link>
    </aside>
  );
}
