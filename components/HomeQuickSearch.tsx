'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { AnalyticsEvents } from '@/lib/analytics';

interface QuickSearchProps {
  stations?: string[];
  counties?: string[];
}

export function HomeQuickSearch({ counties = [] }: QuickSearchProps) {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [county, setCounty] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (query.trim()) params.set('q', query.trim());
    if (county) params.set('county', county);
    const searchLabel = [query.trim(), county].filter(Boolean).join(' ');
    if (searchLabel) AnalyticsEvents.directorySearch(searchLabel);
    const qs = params.toString();
    router.push(qs ? `/directory?${qs}` : '/directory');
  };

  return (
    <section className="section-pad bg-[var(--background)]" aria-label="Search directory call to action">
      <div className="page-container !py-0">
        <div className="mx-auto max-w-3xl">
          <div className="text-center">
            <h2 className="text-h2 mt-0 text-[var(--navy)]">
              Out-of-hours police station cover for solicitors
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-[var(--muted)]">
              Search our free directory by police station, county, or availability.
              Find qualified reps in seconds, not hours.
            </p>
          </div>

          <div className="mt-8 card-surface">
            <h3 className="text-h3 mt-0 text-[var(--navy)]">Quick Rep Search</h3>
            <p className="mt-1 text-sm text-[var(--muted)]">
              Find reps instantly by name, station, or county
            </p>

            <form onSubmit={handleSubmit} className="mt-4 flex flex-col gap-3">
              <div className="grid gap-3 sm:grid-cols-2">
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search by name or station…"
                  className="w-full rounded-[var(--radius)] border border-[var(--border)] px-4 py-2.5 text-sm outline-none transition-colors focus:border-[var(--gold)] focus:ring-2 focus:ring-[var(--gold)]/20"
                />
                <select
                  value={county}
                  onChange={(e) => setCounty(e.target.value)}
                  aria-label="Filter by county"
                  className="rounded-[var(--radius)] border border-[var(--border)] px-4 py-2.5 text-sm text-[var(--foreground)] outline-none transition-colors focus:border-[var(--gold)] focus:ring-2 focus:ring-[var(--gold)]/20"
                >
                  <option value="">All counties</option>
                  {counties.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
              <button type="submit" className="btn-gold !min-h-[44px] w-full !text-sm">
                Search Directory
              </button>
            </form>
          </div>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Link href="/StationsDirectory" className="btn-outline w-full sm:w-auto">
              Station phone numbers
            </Link>
            <Link href="/Forces" className="btn-outline w-full sm:w-auto">
              Browse by force
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
