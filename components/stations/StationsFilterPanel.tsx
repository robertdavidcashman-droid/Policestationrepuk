'use client';

import Link from 'next/link';
import type { AreaSelection, AreaType } from '@/lib/station-browse';
import type {
  AreaIndexEntry,
  StationsCustodyFilter,
  StationsFrontCounterFilter,
  StationsSortBy,
  StationsViewMode,
} from '@/components/stations/stations-filter-types';

export interface StationsFilterPanelProps {
  total: number;
  shown: number;
  query: string;
  groupBy: AreaType;
  area: AreaSelection;
  areaIndex: AreaIndexEntry[];
  areaNoun: string;
  regionOptions: string[];
  custodyOnly: boolean;
  directOnly: boolean;
  regionFilter: string;
  custodyFilter: StationsCustodyFilter;
  frontCounterFilter: StationsFrontCounterFilter;
  sortBy: StationsSortBy;
  viewMode: StationsViewMode;
  hasTextQuery: boolean;
  hasArea: boolean;
  onGroupByChange: (next: AreaType) => void;
  onAreaSelect: (value: string) => void;
  onCustodyOnlyChange: (value: boolean) => void;
  onDirectOnlyChange: (value: boolean) => void;
  onRegionFilterChange: (value: string) => void;
  onCustodyFilterChange: (value: StationsCustodyFilter) => void;
  onFrontCounterFilterChange: (value: StationsFrontCounterFilter) => void;
  onSortByChange: (value: StationsSortBy) => void;
  onViewModeChange: (value: StationsViewMode) => void;
  onClearAll: () => void;
  showViewMode?: boolean;
}

export function StationsFilterPanel({
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
  onGroupByChange,
  onAreaSelect,
  onCustodyOnlyChange,
  onDirectOnlyChange,
  onRegionFilterChange,
  onCustodyFilterChange,
  onFrontCounterFilterChange,
  onSortByChange,
  onViewModeChange,
  onClearAll,
  showViewMode = true,
}: StationsFilterPanelProps) {
  const hasActiveFilters =
    hasArea ||
    hasTextQuery ||
    custodyOnly ||
    directOnly ||
    regionFilter ||
    custodyFilter !== 'all' ||
    frontCounterFilter !== 'all';

  return (
    <div className="space-y-4 rounded-[var(--radius-lg)] border border-[var(--card-border)] bg-[var(--card-bg)] p-4 shadow-[var(--card-shadow)]">
      <div className="space-y-1.5">
        <label htmlFor="stations-area" className="block text-sm font-semibold text-[var(--navy)]">
          Jump to {areaNoun}
        </label>
        <select
          id="stations-area"
          value={hasArea ? area.value : ''}
          onChange={(e) => onAreaSelect(e.target.value)}
          className="w-full rounded-lg border border-[var(--border)] bg-white px-3 py-2.5 text-sm text-[var(--foreground)]"
        >
          <option value="">
            All {areaNoun === 'county' ? 'counties' : 'forces'} ({total})
          </option>
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
              className={`inline-flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium ${
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
                onChange={() => onGroupByChange(opt.value)}
                className="sr-only"
              />
              {opt.label}
            </label>
          ))}
        </div>
      </fieldset>

      {hasTextQuery ? (
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
                className={`inline-flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium ${
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
                  onChange={() => onSortByChange(opt.value)}
                  className="sr-only"
                />
                {opt.label}
              </label>
            ))}
          </div>
        </fieldset>
      ) : null}

      <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
        <button
          type="button"
          onClick={() => onAreaSelect('')}
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
            onClick={() => onAreaSelect(a.label)}
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

      <div className="flex flex-col gap-2">
        <label htmlFor="stations-custody-only" className="flex items-start gap-2 text-sm">
          <input
            id="stations-custody-only"
            type="checkbox"
            checked={custodyOnly}
            onChange={(e) => onCustodyOnlyChange(e.target.checked)}
            className="mt-0.5 h-4 w-4 shrink-0 rounded border-[var(--border)]"
          />
          <span className="font-medium text-[var(--navy)]">Custody suite only</span>
        </label>
        <label htmlFor="stations-direct-only" className="flex items-start gap-2 text-sm">
          <input
            id="stations-direct-only"
            type="checkbox"
            checked={directOnly}
            onChange={(e) => onDirectOnlyChange(e.target.checked)}
            className="mt-0.5 h-4 w-4 shrink-0 rounded border-[var(--border)]"
          />
          <span className="font-medium text-[var(--navy)]">Has a direct number</span>
        </label>
      </div>

      <div className="space-y-3">
        <div className="space-y-1">
          <label htmlFor="stations-region" className="block text-xs font-semibold text-[var(--navy)]">
            Region
          </label>
          <select
            id="stations-region"
            value={regionFilter}
            onChange={(e) => onRegionFilterChange(e.target.value)}
            className="w-full rounded-lg border border-[var(--border)] bg-white px-3 py-2 text-sm"
          >
            <option value="">All regions</option>
            {regionOptions.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1">
          <label
            htmlFor="stations-custody-filter"
            className="block text-xs font-semibold text-[var(--navy)]"
          >
            Custody number
          </label>
          <select
            id="stations-custody-filter"
            value={custodyFilter}
            onChange={(e) => onCustodyFilterChange(e.target.value as StationsCustodyFilter)}
            className="w-full rounded-lg border border-[var(--border)] bg-white px-3 py-2 text-sm"
          >
            <option value="all">All</option>
            <option value="published">Published custody line</option>
            <option value="not_published">Custody not published</option>
          </select>
        </div>
        <div className="space-y-1">
          <label
            htmlFor="stations-front-counter"
            className="block text-xs font-semibold text-[var(--navy)]"
          >
            Front counter
          </label>
          <select
            id="stations-front-counter"
            value={frontCounterFilter}
            onChange={(e) => onFrontCounterFilterChange(e.target.value as StationsFrontCounterFilter)}
            className="w-full rounded-lg border border-[var(--border)] bg-white px-3 py-2 text-sm"
          >
            <option value="all">All</option>
            <option value="open">Open</option>
            <option value="closed">Closed</option>
            <option value="appointment_only">Appointment only</option>
          </select>
        </div>
      </div>

      {showViewMode ? (
        <fieldset>
          <legend className="text-xs font-semibold text-[var(--navy)]">Desktop view</legend>
          <div className="mt-1 flex gap-2">
            {(
              [
                { value: 'cards' as const, label: 'Cards' },
                { value: 'table' as const, label: 'Table' },
              ] as const
            ).map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => onViewModeChange(opt.value)}
                className={`rounded-lg border px-3 py-1.5 text-xs font-semibold ${
                  viewMode === opt.value
                    ? 'border-[var(--navy)] bg-[var(--navy)] text-white'
                    : 'border-[var(--border)] bg-white text-[var(--navy)]'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </fieldset>
      ) : null}

      <p className="text-sm text-[var(--muted)]" role="status" aria-live="polite">
        Showing <strong className="text-[var(--navy)]">{shown}</strong> of{' '}
        <strong className="text-[var(--navy)]">{total}</strong> stations
        {hasArea ? ` in ${area.value}` : ''}
        {query.trim() ? ` matching "${query.trim()}"` : ''}
        {custodyOnly ? ' · custody only' : ''}
        {directOnly ? ' · direct number' : ''}
        {regionFilter ? ` · ${regionFilter}` : ''}
        {custodyFilter !== 'all' ? ` · custody ${custodyFilter.replace('_', ' ')}` : ''}
        {frontCounterFilter !== 'all' ? ` · front counter ${frontCounterFilter.replace('_', ' ')}` : ''}
        {hasActiveFilters ? (
          <>
            {' · '}
            <button
              type="button"
              onClick={onClearAll}
              className="font-semibold text-[var(--gold-link)] underline hover:text-[var(--gold)]"
            >
              Clear all
            </button>
          </>
        ) : null}
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
  );
}
