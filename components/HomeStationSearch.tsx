'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { AnalyticsEvents } from '@/lib/analytics';
import type { StationPhonePublicStats } from '@/lib/station-phone-stats-server';

interface HomeStationSearchProps {
  stats: StationPhonePublicStats;
}

export function HomeStationSearch({ stats }: HomeStationSearchProps) {
  const router = useRouter();
  const [query, setQuery] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = query.trim();
    if (trimmed) {
      AnalyticsEvents.directorySearch(`station:${trimmed}`);
      router.push(`/StationsDirectory?q=${encodeURIComponent(trimmed)}`);
    } else {
      router.push('/StationsDirectory');
    }
  };

  return (
    <section className="section-pad border-b border-[var(--border)] bg-slate-50" aria-label="Police station phone numbers">
      <div className="page-container !py-0">
        <div className="mx-auto max-w-3xl">
          <div className="text-center">
            <h2 className="text-h2 mt-0 text-[var(--navy)]">UK police station phone numbers</h2>
            <p className="mt-3 text-sm leading-relaxed text-[var(--muted)]">
              Search custody desk lines, main numbers, and addresses across England &amp; Wales — kept
              accurate with help from reps and firms.
            </p>
            <p className="mt-2 text-xs font-semibold text-[var(--navy)]/80">
              {stats.directLine} direct lines · {stats.total} stations listed
              {stats.verifiedCustodyCount > 0
                ? ` · ${stats.verifiedCustodyCount} verified custody suites`
                : ''}
              {stats.needsHelp > 0 ? ` · ${stats.needsHelp} need your help` : ''}
            </p>
          </div>

          <div className="mt-8 card-surface">
            <h3 className="text-h3 mt-0 text-[var(--navy)]">Search station numbers</h3>
            <p className="mt-1 text-sm text-[var(--muted)]">
              Station name, town, postcode, or police force
            </p>
            <form onSubmit={handleSubmit} className="mt-4 flex flex-col gap-3 sm:flex-row">
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="e.g. Canterbury, Medway, SW1…"
                className="min-h-[44px] flex-1 rounded-[var(--radius)] border border-[var(--border)] px-4 py-2.5 text-sm outline-none transition-colors focus:border-[var(--gold)] focus:ring-2 focus:ring-[var(--gold)]/20"
              />
              <button type="submit" className="btn-gold !min-h-[44px] w-full !text-sm sm:w-auto sm:px-8">
                Search numbers
              </button>
            </form>
          </div>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:justify-center">
            <Link href="/StationsDirectory" className="btn-gold w-full sm:w-auto">
              Browse all stations
            </Link>
            <Link href="/Forces" className="btn-outline w-full sm:w-auto">
              Browse by force
            </Link>
            <Link href="/UpdateStation" className="btn-outline w-full sm:w-auto">
              Report a number
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
