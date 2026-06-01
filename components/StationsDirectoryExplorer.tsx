'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import type { PoliceStation } from '@/lib/types';
import { searchStations, type ScoredStation } from '@/lib/station-search';
import { StationPhone } from '@/components/StationPhone';

type GroupBy = 'county' | 'force';
type SortBy = 'relevance' | 'name';

const PAGE_SIZE = 60;

function isCustodyStation(s: PoliceStation): boolean {
  return Boolean(s.isCustodyStation || s.custodySuite);
}

function groupKey(s: PoliceStation, groupBy: GroupBy): string {
  if (groupBy === 'county') {
    return (s.county && s.county.trim()) || 'Other';
  }
  const force = (s.forceName && s.forceName.trim()) || (s.forceCode && s.forceCode.trim());
  return force || 'Force not listed';
}

export function StationsDirectoryExplorer({
  stations,
  initialQuery = '',
}: {
  stations: PoliceStation[];
  initialQuery?: string;
}) {
  const [query, setQuery] = useState(initialQuery);
  const [groupBy, setGroupBy] = useState<GroupBy>('force');
  const [custodyOnly, setCustodyOnly] = useState(false);
  const [sortBy, setSortBy] = useState<SortBy>('name');
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  const hasTextQuery = query.trim().length > 0;

  useEffect(() => {
    if (hasTextQuery && sortBy !== 'relevance') setSortBy('relevance');
    else if (!hasTextQuery && sortBy === 'relevance') setSortBy('name');
  }, [hasTextQuery]); // eslint-disable-line react-hooks/exhaustive-deps

  // Reset the visible window whenever the result set changes.
  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [query, custodyOnly, groupBy, sortBy]);

  // Keep the URL's ?q= in sync so a typed search is shareable/bookmarkable.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const handle = window.setTimeout(() => {
      const url = new URL(window.location.href);
      const q = query.trim();
      if (q) url.searchParams.set('q', q);
      else url.searchParams.delete('q');
      window.history.replaceState(null, '', url.toString());
    }, 300);
    return () => window.clearTimeout(handle);
  }, [query]);

  const filtered = useMemo(() => {
    let result: ScoredStation[] = searchStations(query, stations);

    if (custodyOnly) {
      result = result.filter((s) => isCustodyStation(s));
    }

    if (sortBy === 'name' || !hasTextQuery) {
      result.sort((a, b) => a.name.localeCompare(b.name, 'en-GB'));
    }

    return result;
  }, [stations, query, custodyOnly, sortBy, hasTextQuery]);

  const total = stations.length;
  const shown = filtered.length;

  const visible = useMemo(
    () => filtered.slice(0, visibleCount),
    [filtered, visibleCount],
  );

  const groupedSorted = useMemo(() => {
    if (hasTextQuery) return null;

    const map = visible.reduce<Record<string, ScoredStation[]>>((acc, station) => {
      const key = groupKey(station, groupBy);
      if (!acc[key]) acc[key] = [];
      acc[key].push(station);
      return acc;
    }, {});
    for (const k of Object.keys(map)) {
      map[k].sort((a, b) => a.name.localeCompare(b.name, 'en-GB'));
    }
    const keys = Object.keys(map).sort((a, b) => a.localeCompare(b, 'en-GB'));
    return { map, keys };
  }, [visible, groupBy, hasTextQuery]);

  const hasMore = visibleCount < shown;

  if (total === 0) {
    return (
      <div className="rounded-[var(--radius-lg)] border border-[var(--card-border)] bg-[var(--card-bg)] p-8 text-center">
        <p className="text-[var(--muted)]">Station data loading shortly. Check back soon.</p>
      </div>
    );
  }

  return (
    <>
      <div className="sticky top-14 z-20 -mx-[var(--container-gutter)] border-b border-[var(--border)] bg-[var(--background)]/95 px-[var(--container-gutter)] py-4 shadow-sm backdrop-blur-sm sm:top-16 sm:mx-0 sm:rounded-[var(--radius-lg)] sm:border sm:px-5 sm:py-4">
        <div className="mx-auto max-w-4xl space-y-4">
          <div>
            <label htmlFor="stations-search" className="block text-sm font-semibold text-[var(--navy)]">
              Search stations
            </label>
            <input
              id="stations-search"
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Name, town, postcode, county, force…"
              autoComplete="off"
              className="mt-1.5 w-full rounded-lg border border-[var(--border)] bg-white px-4 py-3 text-base text-[var(--foreground)] sm:text-sm"
            />
          </div>

          <div className="flex flex-wrap items-end gap-4">
            {!hasTextQuery && (
              <fieldset className="space-y-2">
                <legend className="text-sm font-semibold text-[var(--navy)]">Group by</legend>
                <div className="flex flex-wrap gap-2">
                  {(
                    [
                      { value: 'county' as const, label: 'County' },
                      { value: 'force' as const, label: 'Police force' },
                    ] as const
                  ).map((opt) => (
                    <label
                      key={opt.value}
                      className={`inline-flex cursor-pointer items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium ${
                        groupBy === opt.value
                          ? 'border-[var(--navy)] bg-[var(--navy)] text-white'
                          : 'border-[var(--border)] bg-white text-[var(--navy)] hover:border-[var(--gold)]'
                      }`}
                    >
                      <input
                        type="radio"
                        name="stations-groupby"
                        value={opt.value}
                        checked={groupBy === opt.value}
                        onChange={() => setGroupBy(opt.value)}
                        className="sr-only"
                      />
                      {opt.label}
                    </label>
                  ))}
                </div>
              </fieldset>
            )}

            {hasTextQuery && (
              <fieldset className="space-y-2">
                <legend className="text-sm font-semibold text-[var(--navy)]">Sort by</legend>
                <div className="flex flex-wrap gap-2">
                  {(
                    [
                      { value: 'relevance' as const, label: 'Relevance' },
                      { value: 'name' as const, label: 'Name (A-Z)' },
                    ] as const
                  ).map((opt) => (
                    <label
                      key={opt.value}
                      className={`inline-flex cursor-pointer items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium ${
                        sortBy === opt.value
                          ? 'border-[var(--navy)] bg-[var(--navy)] text-white'
                          : 'border-[var(--border)] bg-white text-[var(--navy)] hover:border-[var(--gold)]'
                      }`}
                    >
                      <input
                        type="radio"
                        name="stations-sortby"
                        value={opt.value}
                        checked={sortBy === opt.value}
                        onChange={() => setSortBy(opt.value)}
                        className="sr-only"
                      />
                      {opt.label}
                    </label>
                  ))}
                </div>
              </fieldset>
            )}
          </div>

          <div className="flex items-start gap-3">
            <input
              id="stations-custody-only"
              type="checkbox"
              checked={custodyOnly}
              onChange={(e) => setCustodyOnly(e.target.checked)}
              className="mt-1 h-4 w-4 shrink-0 rounded border-[var(--border)]"
            />
            <label htmlFor="stations-custody-only" className="text-sm text-[var(--muted)]">
              <span className="font-medium text-[var(--navy)]">Custody / custody suite only</span>
              <span className="block text-xs">
                Many listings are not flagged as custody suites in the dataset — this filter may hide most stations.
              </span>
            </label>
          </div>

          <p className="text-sm text-[var(--muted)]" role="status" aria-live="polite">
            Showing <strong className="text-[var(--navy)]">{shown}</strong> of{' '}
            <strong className="text-[var(--navy)]">{total}</strong> stations
            {query.trim() ? ` matching "${query.trim()}"` : ''}
            {custodyOnly ? ' · custody flagged only' : ''}
          </p>
          <p className="text-xs text-[var(--muted)]">
            Know a more up-to-date telephone number?{' '}
            <Link
              href="/UpdateStation"
              className="font-semibold text-[var(--gold-link)] no-underline hover:text-[var(--gold)] hover:underline"
            >
              Report it here
            </Link>{' '}
            — reviewed before publishing.
          </p>
        </div>
      </div>

      {shown === 0 ? (
        <div className="mt-8 rounded-[var(--radius-lg)] border border-[var(--card-border)] bg-[var(--card-bg)] p-8 text-center">
          <p className="text-[var(--muted)]">No stations match your filters.</p>
          <button
            type="button"
            onClick={() => {
              setQuery('');
              setCustodyOnly(false);
            }}
            className="mt-4 rounded-lg bg-[var(--navy)] px-4 py-2 text-sm font-semibold text-white hover:bg-[var(--navy-light)]"
          >
            Clear search and filters
          </button>
        </div>
      ) : hasTextQuery ? (
        <div className="mt-8">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {visible.map((station) => (
              <StationDirectoryCard key={station.id} station={station} />
            ))}
          </div>
        </div>
      ) : (
        <div className="mt-8 space-y-10">
          {groupedSorted?.keys.map((groupName, idx) => (
            <section key={`${groupBy}-${groupName}-${idx}`} aria-labelledby={`stations-group-${idx}`}>
              <h2 id={`stations-group-${idx}`} className="mb-4 text-lg font-semibold text-[var(--navy)]">
                {groupName}
              </h2>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {groupedSorted.map[groupName].map((station) => (
                  <StationDirectoryCard key={station.id} station={station} />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}

      {hasMore && (
        <div className="mt-8 flex flex-col items-center gap-2">
          <p className="text-xs text-[var(--muted)]">
            Showing {visible.length} of {shown}
          </p>
          <button
            type="button"
            onClick={() => setVisibleCount((c) => c + PAGE_SIZE)}
            className="rounded-lg border border-[var(--navy)] bg-white px-5 py-2.5 text-sm font-semibold text-[var(--navy)] hover:bg-[var(--navy)] hover:text-white"
          >
            Load more stations
          </button>
        </div>
      )}
    </>
  );
}

/* ------------------------------------------------------------------ */
/*  Station card                                                       */
/* ------------------------------------------------------------------ */

function StationDirectoryCard({ station }: { station: PoliceStation }) {
  const custody = isCustodyStation(station);
  const updateHref = `/UpdateStation?station=${encodeURIComponent(station.id)}`;

  return (
    <article className="flex flex-col rounded-[var(--radius)] border border-[var(--card-border)] bg-[var(--card-bg)] shadow-[var(--card-shadow)] transition-all hover:border-[var(--gold)]/40 hover:shadow-[var(--card-shadow-hover)]">
      <Link
        href={`/police-station/${station.slug}`}
        className="group flex flex-1 flex-col p-4 no-underline"
      >
        <div className="flex items-start justify-between gap-2">
          <p className="font-medium text-[var(--navy)] group-hover:text-[var(--gold-link)]">{station.name}</p>
          {custody && (
            <span className="shrink-0 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold uppercase text-emerald-700">
              Custody
            </span>
          )}
        </div>
        {station.address && (
          <p className="mt-1 text-xs text-[var(--muted)] line-clamp-2">{station.address}</p>
        )}
        {station.postcode && (
          <p className="mt-0.5 text-xs text-[var(--muted)]">{station.postcode}</p>
        )}
        {(station.forceName || station.county) && (
          <p className="mt-1 text-xs font-medium text-[var(--navy)]/80">
            {station.forceName || station.county}
          </p>
        )}
        <StationPhone station={station} />
      </Link>
      <div className="border-t border-[var(--card-border)] px-4 py-2.5">
        <Link
          href={updateHref}
          className="text-xs font-semibold text-[var(--gold-link)] no-underline hover:text-[var(--gold)] hover:underline"
        >
          Help us to help you — report number →
        </Link>
      </div>
    </article>
  );
}
