import Link from 'next/link';
import { FirmCoverCTA } from '@/components/FirmCoverCTA';

type Variant = 'inline' | 'sidebar' | 'hero' | 'empty-state';

interface JoinCTAProps {
  variant?: Variant;
  totalReps?: number;
  countyName?: string;
}

export function JoinCTA({ variant = 'inline', totalReps, countyName }: JoinCTAProps) {
  if (variant === 'hero') {
    return (
      <div className="flex flex-wrap items-center gap-3">
        <Link
          href="/register"
          className="inline-flex items-center gap-2 rounded-lg bg-[var(--gold)] px-5 py-2.5 text-sm font-bold text-[var(--ink)] no-underline shadow-lg shadow-[var(--gold)]/20 transition-all hover:bg-[var(--gold-hover)] hover:shadow-xl hover:shadow-[var(--gold)]/30"
        >
          Register free
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
          </svg>
        </Link>
        <Link
          href="/GoFeatured"
          className="inline-flex items-center rounded-lg border border-white/25 bg-white/10 px-5 py-2.5 text-sm font-semibold text-white no-underline backdrop-blur-sm transition-colors hover:bg-white/20"
        >
          Go Featured
        </Link>
      </div>
    );
  }

  if (variant === 'empty-state') {
    return (
      <div className="rounded-2xl border-2 border-dashed border-[var(--navy)]/15 bg-gradient-to-br from-[var(--gold-pale)] to-white p-8 text-center">
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-[var(--navy)]/10">
          <svg className="h-6 w-6 text-[var(--navy)]" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M18 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zM3 19.235v-.11a6.375 6.375 0 0112.75 0v.109A12.318 12.318 0 019.374 21c-2.331 0-4.512-.645-6.374-1.766z" />
          </svg>
        </div>
        <h3 className="text-lg font-bold text-[var(--navy)]">
          Accredited rep{countyName ? ` in ${countyName}` : ''}?
        </h3>
        <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-slate-600">
          Register your free profile in minutes. Fully accredited PSRAS reps, duty solicitors and
          solicitors with verifiable details go live immediately.
        </p>
        <Link
          href="/register"
          className="btn-gold mt-4 inline-flex items-center gap-2 !text-sm no-underline"
        >
          Register free
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
          </svg>
        </Link>
        <div className="mt-6">
          <FirmCoverCTA countyName={countyName} compact />
        </div>
      </div>
    );
  }

  if (variant === 'sidebar') {
    return (
      <div className="rounded-xl border border-[var(--navy)]/10 bg-gradient-to-b from-[var(--navy)] to-[#0f1d45] p-5 shadow-sm">
        <h3 className="text-sm font-extrabold text-white">Get more police station work</h3>
        <p className="mt-1.5 text-xs leading-relaxed text-slate-300">
          {totalReps ? `${totalReps} verified reps listed. ` : ''}Fully accredited PSRAS reps,
          duty solicitors and solicitors only. Free to list &mdash; with automatic verification.
        </p>
        <Link
          href="/register"
          className="mt-3 flex items-center justify-center gap-2 rounded-lg bg-[var(--gold)] px-4 py-2.5 text-xs font-bold text-[var(--ink)] no-underline transition-colors hover:bg-[var(--gold-hover)]"
        >
          Register free
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
          </svg>
        </Link>
        <Link
          href="/GoFeatured"
          className="mt-2 block text-center text-[10px] font-bold uppercase tracking-wider text-[var(--gold)]/80 no-underline hover:text-white"
        >
          Or go featured &rarr;
        </Link>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-[var(--navy)]/10 bg-gradient-to-r from-[var(--navy)] to-[#152e6e] px-6 py-5 shadow-sm sm:flex sm:items-center sm:justify-between sm:gap-4">
      <div className="min-w-0">
        <p className="text-sm font-extrabold text-white">Accredited reps welcome</p>
        <p className="mt-1 text-xs leading-relaxed text-slate-300">
          Free to list. Fully accredited PSRAS reps, duty solicitors and solicitors with
          verifiable details go live immediately.
        </p>
      </div>
      <div className="mt-3 flex shrink-0 gap-2 sm:mt-0">
        <Link
          href="/register"
          className="inline-flex items-center gap-1.5 rounded-lg bg-[var(--gold)] px-5 py-2.5 text-xs font-bold text-[var(--ink)] no-underline transition-colors hover:bg-[var(--gold-hover)]"
        >
          Register free
        </Link>
        <Link
          href="/GoFeatured"
          className="inline-flex items-center rounded-lg border border-white/20 bg-white/10 px-4 py-2.5 text-xs font-semibold text-white no-underline transition-colors hover:bg-white/20"
        >
          Go Featured
        </Link>
      </div>
    </div>
  );
}
