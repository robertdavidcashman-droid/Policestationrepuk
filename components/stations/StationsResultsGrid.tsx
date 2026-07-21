'use client';

import Link from 'next/link';
import type { ScoredStation } from '@/lib/station-search';
import { StationContactDisclaimer } from '@/components/StationPhone';
import { StationDirectoryCard } from '@/components/stations/StationDirectoryCard';
import {
  AdminWideTable,
  adminBadgeClass,
  type AdminWideTableColumn,
} from '@/components/admin/AdminWideTable';
import { getCustodyPublicDisplay } from '@/lib/station-contacts/publish';
import { isCustodyStation } from '@/lib/custody-station';
import { phoneToTelHref } from '@/lib/phone';
import { StationPhoneActions } from '@/components/stations/StationPhoneActions';
import type { StationsViewMode } from '@/components/stations/stations-filter-types';

export interface StationsResultsGridProps {
  shown: number;
  isFlat: boolean;
  hasArea: boolean;
  areaValue?: string;
  hasTextQuery: boolean;
  viewMode: StationsViewMode;
  visible: ScoredStation[];
  groupedSorted: {
    map: Record<string, ScoredStation[]>;
    visibleKeys: string[];
  } | null;
  groupBy: string;
  repCountBySlug: Record<string, number>;
  tableColumns: AdminWideTableColumn<ScoredStation>[];
  hideSingleMatchInGrid: boolean;
  onClearAll: () => void;
  hasMore: boolean;
  renderedCount: number;
  onLoadMore: () => void;
}

export function StationsResultsGrid({
  shown,
  isFlat,
  hasArea,
  areaValue,
  hasTextQuery,
  viewMode,
  visible,
  groupedSorted,
  groupBy,
  repCountBySlug,
  tableColumns,
  hideSingleMatchInGrid,
  onClearAll,
  hasMore,
  renderedCount,
  onLoadMore,
}: StationsResultsGridProps) {
  const cardVariant = hasTextQuery ? 'search' : 'browse';
  const gridStations = hideSingleMatchInGrid ? [] : visible;

  if (shown === 0) {
    return (
      <div className="rounded-[var(--radius-lg)] border border-[var(--card-border)] bg-[var(--card-bg)] p-8 text-center">
        <p className="text-[var(--muted)]">No stations match your filters.</p>
        <button
          type="button"
          onClick={onClearAll}
          className="mt-4 rounded-lg bg-[var(--navy)] px-4 py-2 text-sm font-semibold text-white hover:bg-[var(--navy-light)]"
        >
          Clear search and filters
        </button>
      </div>
    );
  }

  return (
    <>
      {isFlat ? (
        <>
          {hasArea && areaValue ? (
            <h2 className="mb-4 text-lg font-semibold text-[var(--navy)]">
              {areaValue}{' '}
              <span className="text-sm font-normal text-[var(--muted)]">({shown})</span>
            </h2>
          ) : null}
          {hideSingleMatchInGrid ? null : viewMode === 'table' ? (
            <AdminWideTable
              columns={tableColumns}
              rows={visible}
              getRowKey={(s) => s.id}
              emptyMessage="No stations match your filters."
            />
          ) : gridStations.length > 0 ? (
            <div className="grid gap-3 sm:grid-cols-2">
              {gridStations.map((station, idx) => (
                <StationDirectoryCard
                  key={station.id}
                  station={station}
                  repCount={repCountBySlug[station.slug] ?? 0}
                  variant={cardVariant}
                  highlight={hasTextQuery && idx === 0 && !hideSingleMatchInGrid}
                />
              ))}
            </div>
          ) : null}
        </>
      ) : (
        <div className="space-y-10">
          {groupedSorted?.visibleKeys.map((groupName, idx) => (
            <section
              key={`${groupBy}-${groupName}-${idx}`}
              aria-labelledby={`stations-group-${idx}`}
              className="scroll-mt-station-results"
            >
              <h2 id={`stations-group-${idx}`} className="mb-4 text-lg font-semibold text-[var(--navy)]">
                {groupName}{' '}
                <span className="text-sm font-normal text-[var(--muted)]">
                  ({groupedSorted.map[groupName].length})
                </span>
              </h2>
              <div className="grid gap-3 sm:grid-cols-2">
                {groupedSorted.map[groupName].map((station) => (
                  <StationDirectoryCard
                    key={station.id}
                    station={station}
                    repCount={repCountBySlug[station.slug] ?? 0}
                    variant={cardVariant}
                  />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}

      {hasMore ? (
        <div className="mt-8 flex flex-col items-center gap-2">
          <p className="text-xs text-[var(--muted)]">
            Showing {renderedCount} of {shown}
          </p>
          <button
            type="button"
            onClick={onLoadMore}
            className="rounded-lg border border-[var(--navy)] bg-white px-5 py-2.5 text-sm font-semibold text-[var(--navy)] hover:bg-[var(--navy)] hover:text-white"
          >
            Load more stations
          </button>
          <StationContactDisclaimer className="mt-4 max-w-3xl text-center" />
        </div>
      ) : shown > 0 ? (
        <div className="mt-8">
          <StationContactDisclaimer className="max-w-3xl" />
        </div>
      ) : null}
    </>
  );
}

export function buildStationTableColumns(): AdminWideTableColumn<ScoredStation>[] {
  return [
    {
      id: 'station',
      header: 'Station',
      render: (s) => (
        <Link
          href={`/police-station/${s.slug}`}
          className="font-semibold text-[var(--gold-link)] no-underline hover:underline"
        >
          {s.name}
        </Link>
      ),
    },
    {
      id: 'force',
      header: 'Force',
      hideBelow: 'md',
      render: (s) => s.forceName ?? '—',
    },
    {
      id: 'county',
      header: 'County',
      hideBelow: 'lg',
      render: (s) => s.county ?? '—',
    },
    {
      id: 'contacts',
      header: 'Contacts',
      render: (s) => (
        <div className="min-w-[220px]">
          <StationPhoneActions station={s} compact />
        </div>
      ),
    },
    {
      id: 'status',
      header: 'Status',
      render: (s) => {
        const pub = getCustodyPublicDisplay(s);
        if (pub.published) {
          return (
            <span className={adminBadgeClass('success')}>
              Custody published
              {pub.number ? (
                <>
                  {' '}
                  <a href={phoneToTelHref(pub.number)} className="font-mono underline">
                    {pub.number}
                  </a>
                </>
              ) : null}
            </span>
          );
        }
        if (isCustodyStation(s)) return <span className={adminBadgeClass('warning')}>Custody missing</span>;
        return <span className={adminBadgeClass('neutral')}>Standard</span>;
      },
    },
  ];
}
