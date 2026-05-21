'use client';

import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import type { Representative, County, PoliceStation } from '@/lib/types';
import { repMatchesCountyName } from '@/lib/county-matching';
import {
  buildCountyCanonicalMap,
  representativeToSearchRow,
  searchDirectory,
} from '@/lib/directory-search-engine';
import {
  repMatchesPoliceForce,
  repMatchesAccreditationFilter,
  type AccreditationFilterKey,
} from '@/lib/directory-rep-filters';
import { forceMatchesCounty } from '@/lib/police-force-to-counties';
import {
  computeSmartRank,
  matchesExperienceTier,
  isUrgentCoverCapable,
  isFullProfileListing,
  type ExperienceTier,
} from '@/lib/directory-ranking';

import { SearchBar } from '@/components/directory/SearchBar';
import { FilterSidebar, type FilterState } from '@/components/directory/FilterSidebar';
import { ResultsGrid } from '@/components/directory/ResultsGrid';
import { RightPanel } from '@/components/directory/RightPanel';
import { QuickActions } from '@/components/directory/QuickActions';
import { MobileFilterDrawer } from '@/components/directory/MobileFilterDrawer';
import { DirectoryCredentialVerificationNotice } from '@/components/DirectoryCredentialVerificationNotice';

type ScoredRep = Representative & { _score: number };

type SortKey = 'smart' | 'relevance' | 'name' | 'county';

interface DirectorySearchProps {
  reps: Representative[];
  counties: County[];
  stations: PoliceStation[];
  urlBase?: string;
  defaultCounty?: string;
  defaultStation?: string;
  defaultAvailability?: string;
  defaultQuery?: string;
}

function normalizeAvailability(raw: string): string {
  const lower = (raw || '').toLowerCase().trim();
  if (!lower) return 'unknown';

  if (/24\s*[\/\s]?\s*7|24\s*hour|all\s*hour|anytime|any\s*time|full\s*time|any$|all$|all\s*day|mon-sun\s*24|at any time|most\s*days/i.test(lower))
    return '24-7';
  if (/evening|night|after\s*(5|6|7|8)|out\s*of\s*hours|18:30|pm\s*onwards|17:00\s*onwards/i.test(lower))
    return 'evenings-nights';
  if (/weekend|sat|sun|fri.*sat.*sun/i.test(lower))
    return 'weekends';
  if (/day(time|s)|morning|afternoon|mon.*fri|9.*5|8.*6|9am|08\.|09\./i.test(lower))
    return 'daytime';
  if (/flexi|arrangement|please\s*call|call\s*to|usually|general|most|majority/i.test(lower))
    return 'flexible';

  return 'flexible';
}

const PAGE_SIZE = 24;

export function DirectorySearch({
  reps,
  counties,
  stations,
  urlBase = '/directory',
  defaultCounty = '',
  defaultStation = '',
  defaultAvailability = '',
  defaultQuery = '',
}: DirectorySearchProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const internalNavigationRef = useRef(false);

  const [query, setQuery] = useState(defaultQuery);
  const [debouncedQuery, setDebouncedQuery] = useState(defaultQuery);
  const [county, setCounty] = useState(defaultCounty);
  const [station, setStation] = useState(defaultStation);
  const [availability, setAvailability] = useState(defaultAvailability);
  const [accreditation, setAccreditation] = useState<AccreditationFilterKey>('');
  const [force, setForce] = useState('');
  const [experience, setExperience] = useState<ExperienceTier>('');
  const [urgentOnly, setUrgentOnly] = useState(false);
  const [completeOnly, setCompleteOnly] = useState(false);
  const [sort, setSort] = useState<SortKey>('smart');
  const [page, setPage] = useState(1);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(query), 200);
    return () => clearTimeout(t);
  }, [query]);

  useEffect(() => {
    if (internalNavigationRef.current) {
      internalNavigationRef.current = false;
      return;
    }

    const nextQuery = searchParams.get('q') ?? '';
    const nextCounty = searchParams.get('county') ?? '';
    const nextStation = searchParams.get('station') ?? '';
    const nextAvailability = searchParams.get('availability') ?? '';
    const nextAcc = (searchParams.get('accreditation') ?? '') as AccreditationFilterKey;
    const nextForce = searchParams.get('force') ?? '';
    const nextExp = (searchParams.get('experience') ?? '') as ExperienceTier;
    const nextUrgent = searchParams.get('urgent') === '1';
    const nextComplete = searchParams.get('complete') === '1';
    const nextSortRaw = searchParams.get('sort') ?? '';
    const allowedAcc: AccreditationFilterKey[] = ['', 'duty', 'solicitor', 'accredited'];
    const allowedExp: ExperienceTier[] = ['', 'senior', 'mid', 'junior', 'unspecified'];
    const allowedSort: SortKey[] = ['smart', 'relevance', 'name', 'county'];

    setQuery(nextQuery);
    setDebouncedQuery(nextQuery);
    setCounty(nextCounty);
    setStation(nextStation);
    setAvailability(nextAvailability);
    setAccreditation(allowedAcc.includes(nextAcc) ? nextAcc : '');
    setForce(nextForce);
    setExperience(allowedExp.includes(nextExp) ? nextExp : '');
    setUrgentOnly(nextUrgent);
    setCompleteOnly(nextComplete);

    const nextSort = nextSortRaw as SortKey;
    if (allowedSort.includes(nextSort)) {
      setSort(nextSort);
    } else {
      setSort('smart');
    }
    setPage(1);
  }, [pathname, searchParams]);

  const syncUrl = useCallback(() => {
    const params = new URLSearchParams();
    const qTrim = debouncedQuery.trim();
    if (qTrim) params.set('q', qTrim);
    if (county) params.set('county', county);
    if (station) params.set('station', station);
    if (availability) params.set('availability', availability);
    if (accreditation) params.set('accreditation', accreditation);
    if (force) params.set('force', force);
    if (experience) params.set('experience', experience);
    if (urgentOnly) params.set('urgent', '1');
    if (completeOnly) params.set('complete', '1');
    if (sort !== 'smart') params.set('sort', sort);

    const qs = params.toString();
    const path = qs ? `${urlBase}?${qs}` : urlBase;
    const currentQs = searchParams.toString();
    const currentPath = currentQs ? `${pathname}?${currentQs}` : pathname;
    if (currentPath === path) return;
    internalNavigationRef.current = true;
    router.replace(path, { scroll: false });
  }, [
    router, pathname, searchParams, urlBase, debouncedQuery,
    county, station, availability, accreditation, force,
    experience, urgentOnly, completeOnly, sort,
  ]);

  useEffect(() => {
    const timer = setTimeout(syncUrl, 400);
    return () => clearTimeout(timer);
  }, [syncUrl]);

  const hasTextQuery = debouncedQuery.trim().length > 0;

  useEffect(() => {
    if (!debouncedQuery.trim() && sort === 'relevance') {
      setSort('smart');
    }
  }, [debouncedQuery, sort]);

  const countyCanonicalMap = useMemo(
    () => buildCountyCanonicalMap(counties.map((c) => c.name)),
    [counties],
  );

  const searchRows = useMemo(
    () => reps.map((r) => representativeToSearchRow(r, countyCanonicalMap, stations)),
    [reps, countyCanonicalMap, stations],
  );

  const forceOptions = useMemo(() => {
    const s = new Set<string>();
    for (const st of stations) {
      const f = (st.forceName || '').trim();
      if (f) s.add(f);
    }
    return [...s].sort((a, b) => a.localeCompare(b, 'en-GB'));
  }, [stations]);

  const filtered = useMemo(() => {
    let result: ScoredRep[];

    const q = debouncedQuery.trim();
    if (!q) {
      result = reps.map((r) => ({ ...r, _score: 0 }));
    } else {
      const matched = searchDirectory(searchRows, q, counties.map((c) => c.name));
      result = matched.map((row, i) => ({ ...row.rep, _score: 1000 - i }));
    }

    if (county) {
      result = result.filter((r) => repMatchesCountyName(r.county, county));
    }

    const stationTrim = station.trim();
    if (stationTrim) {
      const st = stationTrim.toLowerCase();
      result = result.filter((r) =>
        (r.stations || []).some((s) => s.toLowerCase().includes(st) || st.includes(s.toLowerCase())),
      );
    }

    if (availability) {
      result = result.filter((r) => normalizeAvailability(r.availability) === availability);
    }

    if (accreditation) {
      result = result.filter((r) => repMatchesAccreditationFilter(r, accreditation));
    }

    if (force) {
      result = result.filter((r) => repMatchesPoliceForce(r, force, stations));
    }

    if (experience) {
      result = result.filter((r) => matchesExperienceTier(r, experience));
    }

    if (urgentOnly) {
      result = result.filter((r) => isUrgentCoverCapable(r));
    }

    if (completeOnly) {
      result = result.filter((r) => isFullProfileListing(r));
    }

    const ctxBase = {
      countySelected: county || undefined,
      stationFilter: station || undefined,
    };

    const featured = result.filter((r) => r.featured);
    const nonFeatured = result.filter((r) => !r.featured);

    const sortKey = sort;

    const rankCtx = (rep: ScoredRep) => ({
      ...ctxBase,
      textScore: rep._score,
    });

    const sortFn = (a: ScoredRep, b: ScoredRep) => {
      if (sortKey === 'smart') {
        return computeSmartRank(b, rankCtx(b)) - computeSmartRank(a, rankCtx(a));
      }
      if (sortKey === 'relevance') {
        if (!hasTextQuery) {
          return computeSmartRank(b, rankCtx(b)) - computeSmartRank(a, rankCtx(a));
        }
        const d = b._score - a._score;
        if (d !== 0) return d;
        return (a.name || '').localeCompare(b.name || '', 'en-GB');
      }
      if (sortKey === 'name') {
        if (hasTextQuery) {
          const d = b._score - a._score;
          if (d !== 0) return d;
        }
        return (a.name || '').localeCompare(b.name || '', 'en-GB');
      }
      if (sortKey === 'county') {
        const c = (a.county || '').localeCompare(b.county || '', 'en-GB');
        if (c !== 0) return c;
        if (hasTextQuery) return b._score - a._score;
        return (a.name || '').localeCompare(b.name || '', 'en-GB');
      }
      return (a.name || '').localeCompare(b.name || '', 'en-GB');
    };

    featured.sort(sortFn);
    nonFeatured.sort(sortFn);

    return [...featured, ...nonFeatured];
  }, [
    reps, searchRows, debouncedQuery, county, station,
    availability, accreditation, force, experience,
    urgentOnly, completeOnly, stations, counties, hasTextQuery, sort,
  ]);

  const featuredReps = filtered.filter((r) => r.featured).sort((a, b) => {
    const ROBERT = 'robert-cashman';
    if (a.slug === ROBERT && b.slug !== ROBERT) return -1;
    if (b.slug === ROBERT && a.slug !== ROBERT) return 1;
    return 0;
  });
  const nonFeaturedReps = filtered.filter((r) => !r.featured);
  const pagedNonFeatured = nonFeaturedReps.slice(0, page * PAGE_SIZE);
  const hasMoreNonFeatured = pagedNonFeatured.length < nonFeaturedReps.length;

  function resetFilters() {
    setQuery('');
    setDebouncedQuery('');
    setCounty('');
    setStation('');
    setAvailability('');
    setAccreditation('');
    setForce('');
    setExperience('');
    setUrgentOnly(false);
    setCompleteOnly(false);
    setSort('smart');
    setPage(1);
  }

  const sortIsNonDefault = sort !== 'smart';
  const hasActiveFilters = !!(
    query.trim() || county || station || availability ||
    accreditation || force || experience || urgentOnly ||
    completeOnly || sortIsNonDefault
  );

  const countyStations = county
    ? stations.filter((s) => forceMatchesCounty(s.forceName || '', county))
    : [];

  function goQuick(entries: [string, string][]) {
    setPage(1);
    const p = new URLSearchParams();
    for (const [k, v] of entries) {
      if (v) p.set(k, v);
    }
    if (!p.get('sort')) p.set('sort', 'smart');
    router.replace(`${urlBase}?${p.toString()}`, { scroll: false });
  }

  const filterState: FilterState = {
    county,
    station,
    availability,
    accreditation,
    force,
    experience,
    urgentOnly,
    completeOnly,
    sort,
  };

  const handleFilterChange = useCallback(<K extends keyof FilterState>(key: K, value: FilterState[K]) => {
    setPage(1);
    switch (key) {
      case 'county': setCounty(value as string); break;
      case 'station': setStation(value as string); break;
      case 'availability': setAvailability(value as string); break;
      case 'accreditation': setAccreditation(value as AccreditationFilterKey); break;
      case 'force': setForce(value as string); break;
      case 'experience': setExperience(value as ExperienceTier); break;
      case 'urgentOnly': setUrgentOnly(value as boolean); break;
      case 'completeOnly': setCompleteOnly(value as boolean); break;
      case 'sort': setSort(value as SortKey); break;
    }
  }, []);

  const filterSidebarContent = (
    <FilterSidebar
      filters={filterState}
      onFilterChange={handleFilterChange}
      onReset={resetFilters}
      counties={counties}
      countyStations={countyStations}
      forceOptions={forceOptions}
      hasTextQuery={hasTextQuery}
      hasActiveFilters={hasActiveFilters}
      resultCount={filtered.length}
    />
  );

  return (
    <div className="space-y-5">
      {/* Search bar — full width above the grid */}
      <SearchBar
        value={query}
        onChange={(v) => { setQuery(v); setPage(1); }}
        resultCount={filtered.length}
        onQuickCounty={(c) => { setQuery(c); setPage(1); }}
      />

      {/* Quick actions strip */}
      <QuickActions counties={counties} onQuick={goQuick} />

      {/* Mobile filter toggle */}
      <div className="lg:hidden">
        <button
          type="button"
          onClick={() => setMobileFiltersOpen(true)}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-[var(--navy)] shadow-sm"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-9.75 0h9.75" />
          </svg>
          Filters & sorting
          {hasActiveFilters && (
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[var(--gold)] text-[10px] font-bold text-[var(--ink)]">
              !
            </span>
          )}
        </button>
      </div>

      {/* Mobile filter drawer */}
      <MobileFilterDrawer
        open={mobileFiltersOpen}
        onClose={() => setMobileFiltersOpen(false)}
      >
        {filterSidebarContent}
      </MobileFilterDrawer>

      {/* 3-column layout: Sidebar | Results | Right panel */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Left sidebar — filters (desktop only) */}
        <aside className="hidden lg:col-span-3 lg:block">
          <div className="sticky top-24">
            {filterSidebarContent}
          </div>
        </aside>

        {/* Center — results */}
        <main className="lg:col-span-6">
          <DirectoryCredentialVerificationNotice className="mb-5" />
          <ResultsGrid
            featuredReps={featuredReps}
            nonFeaturedReps={nonFeaturedReps}
            pagedNonFeatured={pagedNonFeatured}
            hasMore={hasMoreNonFeatured}
            onLoadMore={() => setPage((p) => p + 1)}
            sort={sort}
            hasActiveFilters={hasActiveFilters}
            onReset={resetFilters}
            totalCount={filtered.length}
          />
        </main>

        {/* Right sidebar (desktop only) */}
        <aside className="hidden lg:col-span-3 lg:block">
          <div className="sticky top-24">
            <RightPanel
              featuredReps={featuredReps}
              totalReps={reps.length}
            />
          </div>
        </aside>
      </div>
    </div>
  );
}
