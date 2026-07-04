'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import type { PoliceStation } from '@/lib/types';
import { searchStations, type ScoredStation } from '@/lib/station-search';
import {
  ALL_AREAS,
  areaKey,
  buildAreaIndex,
  filterByArea,
  hasDirectNumber,
  type AreaSelection,
  type AreaType,
} from '@/lib/station-browse';
import { getCustodyPublicDisplay } from '@/lib/station-contacts/publish';
import { deriveRegionForStation } from '@/lib/station-contacts/types';
import { isCustodyStation } from '@/lib/custody-station';
import { MobileFilterDrawer } from '@/components/directory/MobileFilterDrawer';
import { StationsSearchBar } from '@/components/stations/StationsSearchBar';
import { StationsFilterPanel } from '@/components/stations/StationsFilterPanel';
import {
  StationSearchSpotlight,
  StationSearchSummaryStrip,
} from '@/components/stations/StationSearchSpotlight';
import {
  StationsResultsGrid,
  buildStationTableColumns,
} from '@/components/stations/StationsResultsGrid';
import { StationContactDisclaimer } from '@/components/StationPhone';
import type {
  StationsCustodyFilter,
  StationsFrontCounterFilter,
  StationsSortBy,
  StationsViewMode,
} from '@/components/stations/stations-filter-types';

const PAGE_SIZE = 60;
const SPOTLIGHT_MAX = 5;

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
  const [regionFilter, setRegionFilter] = useState('');
  const [custodyFilter, setCustodyFilter] = useState<StationsCustodyFilter>('all');
  const [frontCounterFilter, setFrontCounterFilter] = useState<StationsFrontCounterFilter>('all');
  const [viewMode, setViewMode] = useState<StationsViewMode>('cards');
  const [sortBy, setSortBy] = useState<StationsSortBy>('name');
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const didScrollToResults = useRef(false);

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
  const isFlat = hasTextQuery || hasArea;

  const areaIndex = useMemo(() => buildAreaIndex(stations, groupBy), [stations, groupBy]);

  useEffect(() => {
    if (hasTextQuery && sortBy !== 'relevance') setSortBy('relevance');
    else if (!hasTextQuery && sortBy === 'relevance') setSortBy('name');
  }, [hasTextQuery]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [query, custodyOnly, directOnly, regionFilter, custodyFilter, frontCounterFilter, groupBy, sortBy, area]);

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
    if (regionFilter) {
      result = result.filter((s) => deriveRegionForStation(s) === regionFilter);
    }
    if (custodyFilter === 'published') {
      result = result.filter((s) => getCustodyPublicDisplay(s).published);
    } else if (custodyFilter === 'not_published') {
      result = result.filter(
        (s) => isCustodyStation(s) && !getCustodyPublicDisplay(s).published,
      );
    }
    if (frontCounterFilter !== 'all') {
      result = result.filter((s) => s.frontCounterStatus === frontCounterFilter);
    }

    if (sortBy === 'name' || !hasTextQuery) {
      result.sort((a, b) => a.name.localeCompare(b.name, 'en-GB'));
    }

    return result;
  }, [stations, query, area, hasArea, custodyOnly, directOnly, regionFilter, custodyFilter, frontCounterFilter, sortBy, hasTextQuery]);

  const total = stations.length;
  const shown = filtered.length;

  const visible = useMemo(
    () => filtered.slice(0, visibleCount),
    [filtered, visibleCount],
  );

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

  const regionOptions = useMemo(() => {
    const set = new Set(stations.map((s) => deriveRegionForStation(s)));
    return [...set].sort((a, b) => a.localeCompare(b, 'en-GB'));
  }, [stations]);

  const tableColumns = useMemo(() => buildStationTableColumns(), []);

  const hasActiveFilters =
    hasArea ||
    hasTextQuery ||
    custodyOnly ||
    directOnly ||
    Boolean(regionFilter) ||
    custodyFilter !== 'all' ||
    frontCounterFilter !== 'all';

  const spotlightStations =
    hasTextQuery && shown > 0 && shown <= SPOTLIGHT_MAX ? filtered.slice(0, shown) : [];
  const hideGridForSpotlight = hasTextQuery && shown >= 1 && shown <= SPOTLIGHT_MAX;
  const showSummaryStrip = hasTextQuery && shown > SPOTLIGHT_MAX;

  useEffect(() => {
    if (typeof window === 'undefined' || didScrollToResults.current) return;
    const sp = new URLSearchParams(window.location.search);
    const q = sp.get('q')?.trim();
    const hash = window.location.hash;
    if ((!q && hash !== '#directory-search' && hash !== '#station-results') || shown === 0) return;

    requestAnimationFrame(() => {
      const target =
        document.getElementById('station-results') ?? document.getElementById('directory-search');
      target?.scrollIntoView({ block: 'start', behavior: 'smooth' });
      didScrollToResults.current = true;
    });
  }, [shown, hasTextQuery]);

  function selectArea(value: string) {
    setArea(value ? { type: groupBy, value } : ALL_AREAS);
  }

  function changeGroupBy(next: AreaType) {
    setGroupBy(next);
    setArea(ALL_AREAS);
  }

  function clearAll() {
    setQuery('');
    setCustodyOnly(false);
    setDirectOnly(false);
    setRegionFilter('');
    setCustodyFilter('all');
    setFrontCounterFilter('all');
    setArea(ALL_AREAS);
  }

  function clearSearchOnly() {
    setQuery('');
  }

  const filterPanelProps = {
    total,
    shown,
    query,
    groupBy,
    area,
    areaIndex,
    areaNoun,
    regionOptions,
    custodyOnly,
    directOnly,
    regionFilter,
    custodyFilter,
    frontCounterFilter,
    sortBy,
    viewMode,
    hasTextQuery,
    hasArea,
    onGroupByChange: changeGroupBy,
    onAreaSelect: selectArea,
    onCustodyOnlyChange: setCustodyOnly,
    onDirectOnlyChange: setDirectOnly,
    onRegionFilterChange: setRegionFilter,
    onCustodyFilterChange: setCustodyFilter,
    onFrontCounterFilterChange: setFrontCounterFilter,
    onSortByChange: setSortBy,
    onViewModeChange: setViewMode,
    onClearAll: clearAll,
  };

  if (total === 0) {
    return (
      <div className="rounded-[var(--radius-lg)] border border-[var(--card-border)] bg-[var(--card-bg)] p-8 text-center">
        <p className="text-[var(--muted)]">Station data loading shortly. Check back soon.</p>
      </div>
    );
  }

  return (
    <div id="directory-search" className="space-y-5">
      <div className="sticky top-[var(--site-chrome-offset)] z-20 -mx-[var(--container-gutter)] border-b border-[var(--border)] bg-[var(--background)] px-[var(--container-gutter)] py-3 shadow-sm sm:mx-0 sm:rounded-[var(--radius-lg)] sm:border sm:px-4">
        <StationsSearchBar
          value={query}
          onChange={setQuery}
          resultCount={shown}
          onClear={hasTextQuery ? clearSearchOnly : undefined}
        />
      </div>

      <div className="lg:hidden">
        <button
          type="button"
          onClick={() => setMobileFiltersOpen(true)}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-[var(--navy)] shadow-sm"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" aria-hidden>
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M10.5 6h9.75M10.5 6a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-9.75 0h9.75"
            />
          </svg>
          Filters &amp; sorting
          {hasActiveFilters ? (
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[var(--gold)] text-[10px] font-bold text-[var(--ink)]">
              !
            </span>
          ) : null}
        </button>
      </div>

      <MobileFilterDrawer open={mobileFiltersOpen} onClose={() => setMobileFiltersOpen(false)}>
        <StationsFilterPanel {...filterPanelProps} showViewMode={false} />
      </MobileFilterDrawer>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <aside className="hidden lg:col-span-3 lg:block">
          <div className="sticky top-24">
            <StationsFilterPanel {...filterPanelProps} />
          </div>
        </aside>

        <main id="station-results" className="scroll-mt-station-results lg:col-span-9">
          {showSummaryStrip ? (
            <StationSearchSummaryStrip count={shown} query={query.trim()} />
          ) : null}

          {spotlightStations.length > 0 ? (
            <div className={showSummaryStrip ? 'mt-4' : ''}>
              <StationSearchSpotlight stations={spotlightStations} />
              {hideGridForSpotlight ? (
                <StationContactDisclaimer className="mt-6 max-w-3xl" />
              ) : null}
            </div>
          ) : null}

          {!hideGridForSpotlight ? (
            <div className={spotlightStations.length > 0 || showSummaryStrip ? 'mt-6' : ''}>
              <StationsResultsGrid
                shown={shown}
                isFlat={isFlat}
                hasArea={hasArea}
                areaValue={hasArea ? area.value : undefined}
                hasTextQuery={hasTextQuery}
                viewMode={viewMode}
                visible={visible}
                groupedSorted={groupedSorted}
                groupBy={groupBy}
                repCountBySlug={repCountBySlug}
                tableColumns={tableColumns}
                hideSingleMatchInGrid={false}
                onClearAll={clearAll}
                hasMore={hasMore}
                renderedCount={renderedCount}
                onLoadMore={() => setVisibleCount((c) => c + PAGE_SIZE)}
              />
            </div>
          ) : null}
        </main>
      </div>
    </div>
  );
}
