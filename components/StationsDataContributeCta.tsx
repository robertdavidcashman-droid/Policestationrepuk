import Link from 'next/link';

type Variant = 'prominent' | 'slim' | 'inline';

/**
 * Encourages reps, firms, and the public to report up-to-date police station phone numbers.
 */
export function StationsDataContributeCta({
  variant = 'prominent',
  className = '',
}: {
  variant?: Variant;
  className?: string;
}) {
  if (variant === 'inline') {
    return (
      <p className={`text-sm text-[var(--muted)] ${className}`.trim()}>
        Know a more up-to-date telephone number?{' '}
        <Link
          href="/UpdateStation"
          className="font-semibold text-[var(--gold-link)] no-underline hover:underline"
        >
          Report it here
        </Link>{' '}
        — we review every correction.
      </p>
    );
  }

  if (variant === 'slim') {
    return (
      <aside
        className={`flex flex-col gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between ${className}`.trim()}
        aria-label="Help keep station phone numbers accurate"
      >
        <p className="text-sm leading-relaxed text-emerald-950">
          <strong className="font-bold text-emerald-900">Help keep numbers accurate.</strong>{' '}
          Report updated custody desk, main line, or address details — reviewed before publishing.
        </p>
        <Link href="/UpdateStation" className="btn-gold shrink-0 !px-4 !py-2 !text-xs no-underline">
          Report a correction
        </Link>
      </aside>
    );
  }

  return (
    <aside
      className={`rounded-[var(--radius-lg)] border-2 border-[var(--gold)]/35 bg-gradient-to-br from-[var(--navy)] to-[#152e6e] p-5 shadow-md sm:p-6 ${className}`.trim()}
      aria-label="Community station data corrections"
    >
      <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--gold)]">
        Community-maintained directory
      </p>
      <h2 className="mt-2 text-lg font-extrabold text-white sm:text-xl">
        Know a more up-to-date telephone number?
      </h2>
      <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-300">
        Custody suite numbers change. If you are a rep, solicitor, or firm staff and have verified a
        correct phone number or address, please tell us — your correction helps everyone who relies on
        this directory for out-of-hours cover and custody attendance.
      </p>
      <ul className="mt-4 space-y-2 text-sm text-slate-200">
        {[
          'Takes about two minutes — select the station and enter the right number',
          'We review every submission before it goes live',
          'Use the link on any station card, or open the correction form directly',
        ].map((item) => (
          <li key={item} className="flex gap-2">
            <span className="shrink-0 text-[var(--gold)]" aria-hidden>
              ✓
            </span>
            {item}
          </li>
        ))}
      </ul>
      <div className="mt-5 flex flex-wrap gap-3">
        <Link href="/UpdateStation" className="btn-gold no-underline">
          Report phone number or address
        </Link>
        <Link
          href="/StationsDirectory"
          className="inline-flex min-h-[44px] items-center rounded-lg border border-white/25 px-4 text-sm font-semibold text-white no-underline hover:bg-white/10"
        >
          Browse all stations
        </Link>
      </div>
    </aside>
  );
}
