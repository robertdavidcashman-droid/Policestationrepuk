'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import type { PoliceStation } from '@/lib/types';
import { searchStations, type ScoredStation } from '@/lib/station-search';
import { StationPhone } from '@/components/StationPhone';
import {
  ALL_AREAS,
  areaKey,
  buildAreaIndex,
  filterByArea,
  hasDirectNumber,
  type AreaSelection,
  type AreaType,
} from '@/lib/station-browse';
import { shouldIndexPoliceStationPage } from '@/lib/station-indexing';

type SortBy = 'relevance' | 'name';

const PAGE_SIZE = 60;

function isCustodyStation(s: PoliceStation): boolean {
  return Boolean(s.isCustodyStation || s.custodySuite);
}

export function StationsDirectoryExplorer({
  stations,
  repCountBySlug = {},
  initialQuery = '',
  initialForce = '',
  initialCounty = '',
}: {
  stations: PoliceStation[];
  repCountBySlug?: Record<string, number>;
  initialQuery?: string;
  initialForce?: string;
  initialCounty?: string;
}) {
  const [query, setQuery] = useState(initialQuery);
  const [groupBy, setGroupBy] = useState<AreaType>(initialCounty ? 'county' : 'force');
  const [area, setArea] = useState<AreaSelection>(
    initialForce
      ? { type: 'force', value: initialForce }
      : initialCounty
        ? { type: 'county', value: initialCounty }
        : ALL_AREAS,
  );
  const [custodyOnly, setCustodyOnly] = useState(false);
  const [directOnly, setDirectOnly] = useState(false);
  const [sortBy, setSortBy] = useState<SortBy>('name');
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  // The directory page is statically generated, so server-side searchParams are
  // not reliably passed in. Read the URL on mount to honour deep links
  // (?force= / ?county= / ?q=) from /Forces, shared links, and bookmarks.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const sp = new URLSearchParams(window.location.search);
    const q = sp.get('q');
    const force = sp.get('force');
    const county = sp.get('county');
    if (q) setQuery(q);
    if (force) {
      setGroupBy('force');
      setArea({ type: 'force', value: force });
    } else if (county) {
      setGroupBy('county');
      setArea({ type: 'county', value: county });
    }
  }, []);

  const hasTextQuery = query.trim().length > 0;
  const hasArea = area.type !== 'all' && area.value.length > 0;
  // Flat list when narrowed by search or a single area; grouped browse otherwise.
  const isFlat = hasTextQuery || hasArea;

  // Areas (forces or counties) with counts for the picker and chip bar.
  const areaIndex = useMemo(() => buildAreaIndex(stations, groupBy), [stations, groupBy]);

  useEffect(() => {
    if (hasTextQuery && sortBy !== 'relevance') setSortBy('relevance');
    else if (!hasTextQuery && sortBy === 'relevance') setSortBy('name');
  }, [hasTextQuery]); // eslint-disable-line react-hooks/exhaustive-deps

  // Reset the visible window whenever the result set changes.
  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [query, custodyOnly, directOnly, groupBy, sortBy, area]);

  // Keep the URL in sync (q / force / county) so any view is shareable.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const handle = window.setTimeout(() => {
      const url = new URL(window.location.href);
      const q = query.trim();
      if (q) url.searchParams.set('q', q);
      else url.searchParams.delete('q');
      if (area.type === 'force') url.searchParams.set('force', area.value);
      else url.searchParams.delete('force');
      if (area.type === 'county') url.searchParams.set('county', area.value);
      else url.searchParams.delete('county');
      window.history.replaceState(null, '', url.toString());
    }, 300);
    return () => window.clearTimeout(handle);
  }, [query, area]);

  const filtered = useMemo(() => {
    let result: ScoredStation[] = searchStations(query, stations);

    if (hasArea) {
      result = filterByArea(result, area) as ScoredStation[];
    }
    if (custodyOnly) {
      result = result.filter((s) => isCustodyStation(s));
    }
    if (directOnly) {
      result = result.filter((s) => hasDirectNumber(s));
    }

    if (sortBy === 'name' || !hasTextQuery) {
      result.sort((a, b) => a.name.localeCompare(b.name, 'en-GB'));
    }

    return result;
  }, [stations, query, area, hasArea, custodyOnly, directOnly, sortBy, hasTextQuery]);

  const total = stations.length;
  const shown = filtered.length;

  // Flat list (search / single-area mode): paginate the rows directly.
  const visible = useMemo(
    () => filtered.slice(0, visibleCount),
    [filtered, visibleCount],
  );

  // Grouped list (browse mode): group the FULL result set first, then page by
  // whole groups. Slicing before grouping was the bug that made most forces
  // appear to contain a single station.
  const groupedSorted = useMemo(() => {
    if (isFlat) return null;

    const map = filtered.reduce<Record<string, ScoredStation[]>>((acc, station) => {
      const key = areaKey(station, groupBy);
      if (!acc[key]) acc[key] = [];
      acc[key].push(station);
      return acc;
    }, {});
    for (const k of Object.keys(map)) {
      map[k].sort((a, b) => a.name.localeCompare(b.name, 'en-GB'));
    }
    const keys = Object.keys(map).sort((a, b) => a.localeCompare(b, 'en-GB'));

    // Reveal whole groups until we've shown at least `visibleCount` stations;
    // each rendered group always shows all of its stations.
    const visibleKeys: string[] = [];
    let running = 0;
    for (const k of keys) {
      visibleKeys.push(k);
      running += map[k].length;
      if (running >= visibleCount) break;
    }
    return { map, keys, visibleKeys, shownCount: running };
  }, [filtered, groupBy, isFlat, visibleCount]);

  const hasMore = isFlat
    ? visibleCount < shown
    : (groupedSorted?.visibleKeys.length ?? 0) < (groupedSorted?.keys.length ?? 0);

  const renderedCount = isFlat ? visible.length : groupedSorted?.shownCount ?? 0;

  const areaNoun = groupBy === 'county' ? 'county' : 'force';

  function selectArea(value: string) {
    setArea(value ? { type: groupBy, value } : ALL_AREAS);
  }

  function changeGroupBy(next: AreaType) {
    setGroupBy(next);
    setArea(ALL_AREAS); // labels differ between dimensions, so reset selection
  }

  function clearAll() {
    setQuery('');
    setCustodyOnly(false);
    setDirectOnly(false);
    setArea(ALL_AREAS);
  }

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
            <div className="space-y-1.5">
              <label
                htmlFor="stations-area"
                className="block text-sm font-semibold text-[var(--navy)]"
              >
                Jump to {areaNoun}
              </label>
              <select
                id="stations-area"
                value={hasArea ? area.value : ''}
                onChange={(e) => selectArea(e.target.value)}
                className="w-full min-w-[15rem] rounded-lg border border-[var(--border)] bg-white px-3 py-2.5 text-sm text-[var(--foreground)]"
              >
                <option value="">All {areaNoun === 'county' ? 'counties' : 'forces'} ({total})</option>
                {areaIndex.map((a) => (
                  <option key={a.label} value={a.label}>
                    {a.label} ({a.count})
                  </option>
                ))}
              </select>
            </div>

            <fieldset className="space-y-1.5">
              <legend className="text-sm font-semibold text-[var(--navy)]">Browse by</legend>
              <div className="flex flex-wrap gap-2">
                {(
                  [
                    { value: 'force' as const, label: 'Police force' },
                    { value: 'county' as const, label: 'County' },
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
                      onChange={() => changeGroupBy(opt.value)}
                      className="sr-only"
                    />
                    {opt.label}
                  </label>
                ))}
              </div>
            </fieldset>

            {hasTextQuery && (
              <fieldset className="space-y-1.5">
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

          {/* Quick-jump chips for one-tap area selection */}
          <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
            <button
              type="button"
              onClick={() => selectArea('')}
              className={`shrink-0 rounded-full border px-3 py-1 text-xs font-medium ${
                !hasArea
                  ? 'border-[var(--navy)] bg-[var(--navy)] text-white'
                  : 'border-[var(--border)] bg-white text-[var(--navy)] hover:border-[var(--gold)]'
              }`}
            >
              All
            </button>
            {areaIndex.map((a) => (
              <button
                key={a.label}
                type="button"
                onClick={() => selectArea(a.label)}
                className={`shrink-0 rounded-full border px-3 py-1 text-xs font-medium ${
                  hasArea && area.value === a.label
                    ? 'border-[var(--navy)] bg-[var(--navy)] text-white'
                    : 'border-[var(--border)] bg-white text-[var(--navy)] hover:border-[var(--gold)]'
                }`}
              >
                {a.label} <span className="opacity-70">({a.count})</span>
              </button>
            ))}
          </div>

          <div className="flex flex-wrap gap-x-6 gap-y-2">
            <label htmlFor="stations-custody-only" className="flex items-start gap-2 text-sm text-[var(--muted)]">
              <input
                id="stations-custody-only"
                type="checkbox"
                checked={custodyOnly}
                onChange={(e) => setCustodyOnly(e.target.checked)}
                className="mt-0.5 h-4 w-4 shrink-0 rounded border-[var(--border)]"
              />
              <span className="font-medium text-[var(--navy)]">Custody suite only</span>
            </label>
            <label htmlFor="stations-direct-only" className="flex items-start gap-2 text-sm text-[var(--muted)]">
              <input
                id="stations-direct-only"
                type="checkbox"
                checked={directOnly}
                onChange={(e) => setDirectOnly(e.target.checked)}
                className="mt-0.5 h-4 w-4 shrink-0 rounded border-[var(--border)]"
              />
              <span className="font-medium text-[var(--navy)]">Has a direct number</span>
            </label>
          </div>

          <p className="text-sm text-[var(--muted)]" role="status" aria-live="polite">
            Showing <strong className="text-[var(--navy)]">{shown}</strong> of{' '}
            <strong className="text-[var(--navy)]">{total}</strong> stations
            {hasArea ? ` in ${area.value}` : ''}
            {query.trim() ? ` matching "${query.trim()}"` : ''}
            {custodyOnly ? ' · custody only' : ''}
            {directOnly ? ' · direct number' : ''}
            {(hasArea || hasTextQuery || custodyOnly || directOnly) && (
              <>
                {' · '}
                <button
                  type="button"
                  onClick={clearAll}
                  className="font-semibold text-[var(--gold-link)] underline hover:text-[var(--gold)]"
                >
                  Clear
                </button>
              </>
            )}
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
            onClick={clearAll}
            className="mt-4 rounded-lg bg-[var(--navy)] px-4 py-2 text-sm font-semibold text-white hover:bg-[var(--navy-light)]"
          >
            Clear search and filters
          </button>
        </div>
      ) : isFlat ? (
        <div className="mt-8">
          {hasArea && (
            <h2 className="mb-4 text-lg font-semibold text-[var(--navy)]">
              {area.value}{' '}
              <span className="text-sm font-normal text-[var(--muted)]">({shown})</span>
            </h2>
          )}
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {visible.map((station) => (
              <StationDirectoryCard
                key={station.id}
                station={station}
                repCount={repCountBySlug[station.slug] ?? 0}
              />
            ))}
          </div>
        </div>
      ) : (
        <div className="mt-8 space-y-10">
          {groupedSorted?.visibleKeys.map((groupName, idx) => (
            <section key={`${groupBy}-${groupName}-${idx}`} aria-labelledby={`stations-group-${idx}`}>
              <h2 id={`stations-group-${idx}`} className="mb-4 text-lg font-semibold text-[var(--navy)]">
                {groupName}{' '}
                <span className="text-sm font-normal text-[var(--muted)]">
                  ({groupedSorted.map[groupName].length})
                </span>
              </h2>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {groupedSorted.map[groupName].map((station) => (
                  <StationDirectoryCard
                    key={station.id}
                    station={station}
                    repCount={repCountBySlug[station.slug] ?? 0}
                  />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}

      {hasMore && (
        <div className="mt-8 flex flex-col items-center gap-2">
          <p className="text-xs text-[var(--muted)]">
            Showing {renderedCount} of {shown}
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

function StationDirectoryCard({
  station,
  repCount,
}: {
  station: PoliceStation;
  repCount: number;
}) {
  const custody = isCustodyStation(station);
  const indexable = shouldIndexPoliceStationPage(station, repCount);
  const updateHref = `/UpdateStation?station=${encodeURIComponent(station.id)}`;

  const cardBody = (
    <>
      <div className="flex items-start justify-between gap-2">
        <p
          className={`font-medium text-[var(--navy)] ${indexable ? 'group-hover:text-[var(--gold-link)]' : ''}`}
        >
          {station.name}
        </p>
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
      <StationPhone station={station} link />
    </>
  );

  return (
    <article className="flex flex-col rounded-[var(--radius)] border border-[var(--card-border)] bg-[var(--card-bg)] shadow-[var(--card-shadow)] transition-all hover:border-[var(--gold)]/40 hover:shadow-[var(--card-shadow-hover)]">
      {indexable ? (
        <Link
          href={`/police-station/${station.slug}`}
          className="group flex flex-1 flex-col p-4 no-underline"
        >
          {cardBody}
        </Link>
      ) : (
        <div className="flex flex-1 flex-col p-4">{cardBody}</div>
      )}
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
