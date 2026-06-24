'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  AdminWideTable,
  adminBadgeClass,
  type AdminWideTableColumn,
} from '@/components/admin/AdminWideTable';
import type {
  StationContactOverview,
  StationContactSummary,
} from '@/lib/station-contacts/types';

type TabId = 'overview' | 'directory';

interface ApiResponse {
  ok?: boolean;
  error?: string;
  generatedAt?: string;
  overview?: StationContactOverview;
  pagination?: { page: number; limit: number; total: number; totalPages: number };
  filters?: { forces: string[]; counties: string[]; regions: string[] };
  rows?: StationContactSummary[];
}

function fmt(iso?: string): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('en-GB', { dateStyle: 'short', timeStyle: 'short' });
}

function StatCard({ label, value, hint }: { label: string; value: number; hint?: string }) {
  return (
    <div className="rounded-xl border border-[var(--border)] bg-white p-4 shadow-sm">
      <p className="text-xs font-bold uppercase tracking-wider text-[var(--muted)]">{label}</p>
      <p className="mt-1 text-2xl font-extrabold text-[var(--navy)]">{value}</p>
      {hint ? <p className="mt-0.5 text-xs font-semibold text-[var(--gold)]">{hint}</p> : null}
    </div>
  );
}

export function StationContactsAdmin() {
  const [tab, setTab] = useState<TabId>('overview');
  const [overview, setOverview] = useState<StationContactOverview | null>(null);
  const [rows, setRows] = useState<StationContactSummary[]>([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 50, total: 0, totalPages: 1 });
  const [filters, setFilters] = useState<{ forces: string[]; counties: string[]; regions: string[] }>({
    forces: [],
    counties: [],
    regions: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [q, setQ] = useState('');
  const [forceFilter, setForceFilter] = useState('');
  const [countyFilter, setCountyFilter] = useState('');
  const [regionFilter, setRegionFilter] = useState('');
  const [badgeFilter, setBadgeFilter] = useState('');
  const [missingCustody, setMissingCustody] = useState(false);
  const [page, setPage] = useState(1);

  const loadDirectory = useCallback(async () => {
    setLoading(true);
    setError(null);
    const params = new URLSearchParams();
    params.set('page', String(page));
    params.set('limit', '50');
    if (q.trim()) params.set('q', q.trim());
    if (forceFilter) params.set('force', forceFilter);
    if (countyFilter) params.set('county', countyFilter);
    if (regionFilter) params.set('region', regionFilter);
    if (badgeFilter) params.set('badge', badgeFilter);
    if (missingCustody) params.set('missingCustody', '1');

    try {
      const res = await fetch(`/api/admin/station-contacts?${params.toString()}`);
      const json = (await res.json()) as ApiResponse;
      if (!res.ok) throw new Error(json.error ?? `Failed (${res.status})`);
      setOverview(json.overview ?? null);
      setRows(json.rows ?? []);
      if (json.pagination) setPagination(json.pagination);
      if (json.filters) setFilters(json.filters);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error loading station contacts');
    } finally {
      setLoading(false);
    }
  }, [page, q, forceFilter, countyFilter, regionFilter, badgeFilter, missingCustody]);

  useEffect(() => {
    void loadDirectory();
  }, [loadDirectory]);

  useEffect(() => {
    setPage(1);
  }, [q, forceFilter, countyFilter, regionFilter, badgeFilter, missingCustody]);

  const columns = useMemo<AdminWideTableColumn<StationContactSummary>[]>(
    () => [
      {
        id: 'station',
        header: 'Station',
        render: (row) => (
          <div>
            <Link
              href={`/police-station/${row.slug}`}
              className="font-semibold text-[var(--gold-link)] no-underline hover:underline"
            >
              {row.name}
            </Link>
            <p className="text-xs text-[var(--muted)]">{row.slug}</p>
          </div>
        ),
      },
      {
        id: 'force',
        header: 'Force',
        hideBelow: 'md',
        render: (row) => row.forceName || '—',
      },
      {
        id: 'county',
        header: 'County',
        hideBelow: 'lg',
        render: (row) => row.county || '—',
      },
      {
        id: 'main',
        header: 'Main',
        render: (row) => (
          <span className="font-mono text-xs">
            {row.mainPublished ? row.mainPhone : '—'}
          </span>
        ),
      },
      {
        id: 'custody',
        header: 'Custody',
        render: (row) =>
          row.custodyPublished ? (
            <span className="font-mono text-xs">{row.custodyPhone}</span>
          ) : row.isCustody ? (
            <span className="text-xs text-amber-800">Not published</span>
          ) : (
            <span className="text-xs text-[var(--muted)]">n/a</span>
          ),
      },
      {
        id: 'badges',
        header: 'Health',
        render: (row) => (
          <div className="flex flex-wrap gap-1">
            {row.badges.length === 0 ? (
              <span className={adminBadgeClass('success')}>OK</span>
            ) : (
              row.badges.map((b) => (
                <span key={b.id} className={adminBadgeClass(b.tone)}>
                  {b.label}
                </span>
              ))
            )}
          </div>
        ),
      },
      {
        id: 'checked',
        header: 'Last checked',
        hideBelow: 'lg',
        render: (row) => <span className="text-xs whitespace-nowrap">{row.lastChecked ?? '—'}</span>,
      },
      {
        id: 'actions',
        header: 'Review',
        render: (row) => (
          <div className="space-y-1 text-xs">
            {row.openFindingCount > 0 ? (
              <Link
                href={`/admin/custody-number-review?force=${encodeURIComponent(row.forceName)}`}
                className="block font-semibold text-[var(--gold-link)] hover:underline"
              >
                Custody findings ({row.openFindingCount})
              </Link>
            ) : null}
            {row.hasPendingUpdate ? (
              <Link href="/admin/station-updates" className="block font-semibold text-[var(--gold-link)] hover:underline">
                Pending update
              </Link>
            ) : null}
            {!row.openFindingCount && !row.hasPendingUpdate ? (
              <span className="text-[var(--muted)]">—</span>
            ) : null}
          </div>
        ),
      },
    ],
    [],
  );

  const o = overview;

  return (
    <div className="space-y-6">
      {error ? (
        <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">{error}</p>
      ) : null}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs text-[var(--muted)]">
          Automated ingestion only — no CSV upload. Approve findings and community updates from linked queues.
        </p>
        <a
          href="/api/admin/station-contacts?format=snapshot"
          className="btn-outline !text-sm no-underline"
          download
        >
          Download JSON snapshot
        </a>
      </div>

      <nav className="flex flex-wrap gap-2 border-b border-[var(--border)] pb-3">
        {(
          [
            ['overview', 'Overview'],
            ['directory', 'Directory'],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={`rounded-lg px-3 py-1.5 text-sm font-semibold ${
              tab === id
                ? 'bg-[var(--navy)] text-white'
                : 'border border-[var(--border)] bg-white text-[var(--navy)] hover:border-[var(--gold)]'
            }`}
          >
            {label}
          </button>
        ))}
      </nav>

      {tab === 'overview' && o ? (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard label="Total stations" value={o.totalStations} />
            <StatCard label="Custody stations" value={o.custodyStations} />
            <StatCard label="Published custody" value={o.publishedCustodyCount} />
            <StatCard label="Missing custody" value={o.missingCustodyCount} />
            <StatCard label="Open findings" value={o.openFindings} />
            <StatCard label="Pending community updates" value={o.pendingCommunityUpdates} />
            <StatCard label="Stale (>12 mo)" value={o.staleCount} />
            <StatCard label="Low confidence" value={o.lowConfidenceCount} />
          </div>

          <div className="rounded-xl border border-[var(--border)] bg-white p-6 shadow-sm">
            <h2 className="text-lg font-bold text-[var(--navy)]">Review shortcuts</h2>
            <p className="mt-2 text-sm text-[var(--muted)]">
              Discovery runs every 6 hours via cron. Auto-publish stays off — approve numbers here before they appear
              on public station pages.
            </p>
            <div className="mt-4 flex flex-wrap gap-3">
              <Link href="/admin/custody-number-review" className="btn-primary !text-sm no-underline">
                Custody discovery review
              </Link>
              <Link href="/admin/station-updates" className="btn-outline !text-sm no-underline">
                Community station updates
              </Link>
              <Link href="/admin/custody-tips" className="btn-outline !text-sm no-underline">
                Custody tips
              </Link>
            </div>
            <p className="mt-4 text-xs text-[var(--muted)]">Last refreshed {fmt(o.generatedAt)}</p>
          </div>
        </div>
      ) : null}

      {tab === 'directory' ? (
        <div className="space-y-4">
          <div className="flex flex-wrap gap-3">
            <input
              type="search"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search station, slug, phone…"
              className="min-w-[220px] flex-1 rounded-lg border border-[var(--border)] px-3 py-2 text-sm"
            />
            <select
              value={forceFilter}
              onChange={(e) => setForceFilter(e.target.value)}
              className="rounded-lg border border-[var(--border)] px-3 py-2 text-sm"
            >
              <option value="">All forces</option>
              {filters.forces.map((f) => (
                <option key={f} value={f}>
                  {f}
                </option>
              ))}
            </select>
            <select
              value={countyFilter}
              onChange={(e) => setCountyFilter(e.target.value)}
              className="rounded-lg border border-[var(--border)] px-3 py-2 text-sm"
            >
              <option value="">All counties</option>
              {filters.counties.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
            <select
              value={regionFilter}
              onChange={(e) => setRegionFilter(e.target.value)}
              className="rounded-lg border border-[var(--border)] px-3 py-2 text-sm"
            >
              <option value="">All regions</option>
              {filters.regions.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
            <select
              value={badgeFilter}
              onChange={(e) => setBadgeFilter(e.target.value)}
              className="rounded-lg border border-[var(--border)] px-3 py-2 text-sm"
            >
              <option value="">All health states</option>
              <option value="missing-custody">Missing custody</option>
              <option value="missing-source">Missing source</option>
              <option value="open-finding">Open finding</option>
              <option value="pending-update">Pending update</option>
              <option value="stale">Stale</option>
              <option value="low-confidence">Low confidence</option>
            </select>
            <label className="flex items-center gap-2 text-sm text-[var(--muted)]">
              <input
                type="checkbox"
                checked={missingCustody}
                onChange={(e) => setMissingCustody(e.target.checked)}
              />
              Missing custody only
            </label>
          </div>

          {loading ? (
            <p className="text-sm text-[var(--muted)]">Loading directory…</p>
          ) : (
            <>
              <p className="text-sm text-[var(--muted)]">
                Showing {rows.length} of {pagination.total} stations (page {pagination.page} of{' '}
                {pagination.totalPages})
              </p>
              <AdminWideTable
                title="Station contact directory"
                columns={columns}
                rows={rows}
                getRowKey={(row) => row.stationId}
                emptyMessage="No stations match the current filters."
              />
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  disabled={pagination.page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="btn-outline !text-sm disabled:opacity-50"
                >
                  Previous
                </button>
                <button
                  type="button"
                  disabled={pagination.page >= pagination.totalPages}
                  onClick={() => setPage((p) => p + 1)}
                  className="btn-outline !text-sm disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </>
          )}
        </div>
      ) : null}
    </div>
  );
}
