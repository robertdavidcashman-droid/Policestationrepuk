import Link from 'next/link';
import { StationsDataContributeCta } from '@/components/StationsDataContributeCta';
import type { StationPhonePublicStats } from '@/lib/station-phone-stats-server';

type Variant = 'section' | 'sidebar' | 'inline';

interface StationNumbersPromoProps {
  variant?: Variant;
  stats?: Pick<StationPhonePublicStats, 'directLine' | 'total' | 'needsHelp' | 'verifiedCustodyCount'>;
  countyFilter?: string;
  forceFilter?: string;
  className?: string;
}

function directoryHref(countyFilter?: string, forceFilter?: string): string {
  if (countyFilter) {
    return `/StationsDirectory?county=${encodeURIComponent(countyFilter)}`;
  }
  if (forceFilter) {
    return `/StationsDirectory?force=${encodeURIComponent(forceFilter)}`;
  }
  return '/StationsDirectory';
}

export function StationNumbersPromo({
  variant = 'section',
  stats,
  countyFilter,
  forceFilter,
  className = '',
}: StationNumbersPromoProps) {
  const href = directoryHref(countyFilter, forceFilter);
  const statsLine =
    stats && stats.total > 0
      ? `${stats.directLine} direct lines · ${stats.total} stations${stats.verifiedCustodyCount ? ` · ${stats.verifiedCustodyCount} verified custody` : ''}`
      : null;

  if (variant === 'inline') {
    return (
      <StationsDataContributeCta variant="inline" className={className} showCampaignLink />
    );
  }

  if (variant === 'sidebar') {
    return (
      <div
        className={`rounded-xl border border-slate-200/80 bg-gradient-to-b from-white to-slate-50/50 p-4 shadow-sm ${className}`.trim()}
      >
        <p className="text-sm font-bold text-[var(--navy)]">Station phone numbers</p>
        {statsLine && <p className="mt-1 text-xs text-slate-500">{statsLine}</p>}
        <p className="mt-2 text-xs leading-relaxed text-slate-600">
          Custody desk lines and main numbers for England &amp; Wales.
        </p>
        <div className="mt-3 flex flex-col gap-2">
          <Link
            href={href}
            className="text-xs font-semibold text-[var(--gold-link)] no-underline hover:text-[var(--gold)] hover:underline"
          >
            Search station numbers →
          </Link>
          <Link
            href="/UpdateStation"
            className="text-xs font-semibold text-[var(--gold-link)] no-underline hover:text-[var(--gold)] hover:underline"
          >
            Report updated number →
          </Link>
        </div>
      </div>
    );
  }

  return (
    <section
      className={`rounded-[var(--radius-lg)] border border-[var(--card-border)] bg-[var(--card-bg)] p-6 shadow-[var(--card-shadow)] ${className}`.trim()}
      aria-label="Police station phone numbers"
    >
      <h2 className="text-lg font-bold text-[var(--navy)]">UK police station phone numbers</h2>
      {statsLine && (
        <p className="mt-2 text-sm font-medium text-[var(--navy)]/80">{statsLine}</p>
      )}
      <p className="mt-2 text-sm leading-relaxed text-[var(--muted)]">
        Search custody suite lines, main numbers, and addresses. Numbers are community-maintained —
        report corrections when you spot an outdated line.
      </p>
      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
        <Link href={href} className="btn-gold w-full sm:w-auto">
          Station phone directory
        </Link>
        <Link href="/HelpUsStationNumbers" className="btn-outline w-full sm:w-auto">
          Help us — station numbers
        </Link>
        <Link href="/UpdateStation" className="btn-outline w-full sm:w-auto">
          Report a number
        </Link>
      </div>
    </section>
  );
}
