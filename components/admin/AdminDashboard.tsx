'use client';

import { useEffect, useMemo, useState } from 'react';
import { AdminRepDetail } from '@/components/admin/AdminRepDetail';
import { RepVerificationAudit } from '@/components/admin/RepVerificationAudit';

export interface AdminRepSummary {
  email: string;
  source: 'registered' | 'static';
  name: string;
  phone: string;
  county: string;
  counties: string[];
  stations: string[];
  coverage_areas: string;
  availability: string;
  accreditation: string;
  notes: string;
  postcode: string;
  slug: string;
  registeredAt: string | null;
  updatedAt: string | null;
  hidden: boolean;
  featured: {
    status: string | null;
    tier: string | null;
    activatedAt: string | null;
    expiresAt: string | null;
    isLegacyFeatured: boolean;
  };
  review: {
    status: 'pending' | 'approved' | 'flagged' | 'rejected';
    adminNotes: string;
    lastReviewedAt: string | null;
    reviewedBy: string | null;
  };
}

interface Counts {
  total: number;
  registered: number;
  static: number;
  hidden: number;
  featured: number;
  flagged: number;
  pending: number;
}

interface AdminListResponse {
  counts: Counts;
  reps: AdminRepSummary[];
}

type SourceFilter = 'all' | 'registered' | 'static';
type ReviewFilter = 'all' | AdminRepSummary['review']['status'];
type FeaturedFilter = 'all' | 'active' | 'expired' | 'cancelled' | 'legacy' | 'none';
type HiddenFilter = 'all' | 'hidden' | 'visible';

function formatDate(value: string | null): string {
  if (!value) return '—';
  try {
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return value;
    return d.toLocaleString('en-GB', {
      year: 'numeric',
      month: 'short',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return value;
  }
}

function reviewBadgeClass(status: AdminRepSummary['review']['status']): string {
  switch (status) {
    case 'approved':
      return 'bg-emerald-100 text-emerald-800 border-emerald-200';
    case 'flagged':
      return 'bg-amber-100 text-amber-800 border-amber-200';
    case 'rejected':
      return 'bg-red-100 text-red-800 border-red-200';
    case 'pending':
    default:
      return 'bg-slate-100 text-slate-700 border-slate-200';
  }
}

export function AdminDashboard({ adminEmail }: { adminEmail: string }) {
  const [tab, setTab] = useState<'audit' | 'reps'>('audit');
  const [data, setData] = useState<AdminListResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [sourceFilter, setSourceFilter] = useState<SourceFilter>('all');
  const [countyFilter, setCountyFilter] = useState<string>('all');
  const [accreditationFilter, setAccreditationFilter] = useState<string>('all');
  const [availabilityFilter, setAvailabilityFilter] = useState<string>('all');
  const [reviewFilter, setReviewFilter] = useState<ReviewFilter>('all');
  const [featuredFilter, setFeaturedFilter] = useState<FeaturedFilter>('all');
  const [hiddenFilter, setHiddenFilter] = useState<HiddenFilter>('all');
  const [selectedEmail, setSelectedEmail] = useState<string | null>(null);

  const reload = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/reps', { cache: 'no-store' });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || `Request failed: ${res.status}`);
      }
      const payload = (await res.json()) as AdminListResponse;
      setData(payload);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void reload();
  }, []);

  const counties = useMemo(() => {
    if (!data) return [];
    const set = new Set<string>();
    for (const r of data.reps) {
      for (const c of r.counties) if (c) set.add(c);
      if (r.county) set.add(r.county);
    }
    return Array.from(set).sort();
  }, [data]);

  const accreditations = useMemo(() => {
    if (!data) return [];
    const set = new Set<string>();
    for (const r of data.reps) if (r.accreditation) set.add(r.accreditation);
    return Array.from(set).sort();
  }, [data]);

  const availabilities = useMemo(() => {
    if (!data) return [];
    const set = new Set<string>();
    for (const r of data.reps) if (r.availability) set.add(r.availability);
    return Array.from(set).sort();
  }, [data]);

  const filtered = useMemo(() => {
    if (!data) return [];
    const q = query.trim().toLowerCase();
    return data.reps.filter((r) => {
      if (sourceFilter !== 'all' && r.source !== sourceFilter) return false;
      if (countyFilter !== 'all') {
        const hit = r.counties.some((c) => c.toLowerCase() === countyFilter.toLowerCase())
          || (r.county && r.county.toLowerCase() === countyFilter.toLowerCase());
        if (!hit) return false;
      }
      if (accreditationFilter !== 'all' && r.accreditation !== accreditationFilter) return false;
      if (availabilityFilter !== 'all' && r.availability !== availabilityFilter) return false;
      if (reviewFilter !== 'all' && r.review.status !== reviewFilter) return false;
      if (featuredFilter !== 'all') {
        const f = r.featured;
        if (featuredFilter === 'none' && f.status) return false;
        if (featuredFilter === 'active' && f.status !== 'active') return false;
        if (featuredFilter === 'expired' && f.status !== 'expired') return false;
        if (featuredFilter === 'cancelled' && f.status !== 'cancelled') return false;
        if (featuredFilter === 'legacy' && !(f.isLegacyFeatured || f.status === 'legacy')) return false;
      }
      if (hiddenFilter === 'hidden' && !r.hidden) return false;
      if (hiddenFilter === 'visible' && r.hidden) return false;

      if (q) {
        const hay = [
          r.name,
          r.email,
          r.phone,
          r.slug,
          r.county,
          r.counties.join(' '),
          r.stations.join(' '),
          r.coverage_areas,
          r.postcode,
          r.notes,
        ]
          .join(' ')
          .toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [
    data,
    query,
    sourceFilter,
    countyFilter,
    accreditationFilter,
    availabilityFilter,
    reviewFilter,
    featuredFilter,
    hiddenFilter,
  ]);

  const resetFilters = () => {
    setQuery('');
    setSourceFilter('all');
    setCountyFilter('all');
    setAccreditationFilter('all');
    setAvailabilityFilter('all');
    setReviewFilter('all');
    setFeaturedFilter('all');
    setHiddenFilter('all');
  };

  return (
    <>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div className="inline-flex overflow-hidden rounded-lg border border-slate-200 bg-white">
          <button
            type="button"
            onClick={() => setTab('audit')}
            className={`px-4 py-2 text-lg font-semibold ${
              tab === 'audit' ? 'bg-[var(--navy)] text-white' : 'text-[var(--navy)] hover:bg-slate-100'
            }`}
          >
            Rep Verification Audit
          </button>
          <button
            type="button"
            onClick={() => setTab('reps')}
            className={`px-4 py-2 text-lg font-semibold ${
              tab === 'reps' ? 'bg-[var(--navy)] text-white' : 'text-[var(--navy)] hover:bg-slate-100'
            }`}
          >
            Legacy rep manager
          </button>
          </div>
          {tab === 'reps' && (
            <button onClick={reload} className="btn-outline !text-sm" disabled={loading}>
              {loading ? 'Refreshing…' : 'Refresh'}
            </button>
          )}
        </div>

        {tab === 'audit' && (
          <RepVerificationAudit />
        )}

        {tab === 'reps' && (
        <>
        {data && (
          <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
            <Stat label="Total" value={data.counts.total} />
            <Stat label="Registered" value={data.counts.registered} />
            <Stat label="Static" value={data.counts.static} />
            <Stat label="Featured" value={data.counts.featured} />
            <Stat label="Hidden" value={data.counts.hidden} tone={data.counts.hidden ? 'warn' : undefined} />
            <Stat label="Flagged" value={data.counts.flagged} tone={data.counts.flagged ? 'flag' : undefined} />
            <Stat label="Pending review" value={data.counts.pending} />
          </div>
        )}

        <div className="rounded-xl border border-[var(--card-border)] bg-white p-4 shadow-sm">
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search name, email, phone, slug, county, station, postcode, notes…"
            className="w-full rounded-lg border border-[var(--border)] px-4 py-2.5 text-sm outline-none focus:border-[var(--gold)] focus:ring-2 focus:ring-[var(--gold)]/20"
          />
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <FilterSelect
              label="Source"
              value={sourceFilter}
              onChange={(v) => setSourceFilter(v as SourceFilter)}
              options={[
                { value: 'all', label: 'All sources' },
                { value: 'registered', label: 'Registered (newrep)' },
                { value: 'static', label: 'Static (reps.json)' },
              ]}
            />
            <FilterSelect
              label="County"
              value={countyFilter}
              onChange={setCountyFilter}
              options={[{ value: 'all', label: 'All counties' }, ...counties.map((c) => ({ value: c, label: c }))]}
            />
            <FilterSelect
              label="Accreditation"
              value={accreditationFilter}
              onChange={setAccreditationFilter}
              options={[
                { value: 'all', label: 'All accreditation' },
                ...accreditations.map((a) => ({ value: a, label: a })),
              ]}
            />
            <FilterSelect
              label="Availability"
              value={availabilityFilter}
              onChange={setAvailabilityFilter}
              options={[
                { value: 'all', label: 'All availability' },
                ...availabilities.map((a) => ({ value: a, label: a })),
              ]}
            />
            <FilterSelect
              label="Review status"
              value={reviewFilter}
              onChange={(v) => setReviewFilter(v as ReviewFilter)}
              options={[
                { value: 'all', label: 'All review states' },
                { value: 'pending', label: 'Pending' },
                { value: 'approved', label: 'Approved' },
                { value: 'flagged', label: 'Flagged' },
                { value: 'rejected', label: 'Rejected' },
              ]}
            />
            <FilterSelect
              label="Featured"
              value={featuredFilter}
              onChange={(v) => setFeaturedFilter(v as FeaturedFilter)}
              options={[
                { value: 'all', label: 'All featured states' },
                { value: 'active', label: 'Active' },
                { value: 'cancelled', label: 'Cancelled' },
                { value: 'expired', label: 'Expired' },
                { value: 'legacy', label: 'Legacy' },
                { value: 'none', label: 'Not featured' },
              ]}
            />
            <FilterSelect
              label="Hidden"
              value={hiddenFilter}
              onChange={(v) => setHiddenFilter(v as HiddenFilter)}
              options={[
                { value: 'all', label: 'All listings' },
                { value: 'visible', label: 'Visible only' },
                { value: 'hidden', label: 'Hidden only' },
              ]}
            />
            <div className="flex items-end">
              <button onClick={resetFilters} className="btn-outline w-full !text-sm">
                Reset filters
              </button>
            </div>
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between text-xs text-[var(--muted)]">
          <span>
            Showing <strong className="text-[var(--navy)]">{filtered.length}</strong> of{' '}
            <strong className="text-[var(--navy)]">{data?.reps.length ?? 0}</strong>
          </span>
          {data && (
            <span>
              Sorted newest first by registration date
            </span>
          )}
        </div>

        {loading && !data && (
          <div className="mt-6 rounded-xl border border-[var(--card-border)] bg-white p-8 text-center text-sm text-[var(--muted)]">
            Loading registered reps…
          </div>
        )}

        {error && (
          <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
            <strong className="block">Could not load admin data</strong>
            {error}
          </div>
        )}

        {!loading && data && filtered.length === 0 && (
          <div className="mt-6 rounded-xl border border-[var(--card-border)] bg-white p-8 text-center text-sm text-[var(--muted)]">
            No reps match the current filters.
          </div>
        )}

        {!loading && filtered.length > 0 && (
          <>
            <div className="mt-4 hidden min-w-0 overflow-x-auto rounded-xl border border-[var(--card-border)] bg-white shadow-sm lg:block">
              <table className="min-w-[1100px] w-full text-sm">
                <thead className="border-b border-[var(--card-border)] bg-slate-50 text-left text-xs uppercase tracking-wider text-[var(--muted)]">
                  <tr>
                    <th className="px-3 py-2">Name</th>
                    <th className="px-3 py-2">Email</th>
                    <th className="px-3 py-2">Phone</th>
                    <th className="px-3 py-2">County</th>
                    <th className="px-3 py-2">Stations</th>
                    <th className="px-3 py-2">Availability</th>
                    <th className="px-3 py-2">Source</th>
                    <th className="px-3 py-2">Review</th>
                    <th className="px-3 py-2">Registered</th>
                    <th className="px-3 py-2 text-right">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((r) => (
                    <tr key={`${r.source}:${r.email}`} className="border-b border-slate-100 hover:bg-slate-50/60">
                      <td className="px-3 py-2 font-medium text-[var(--navy)]">
                        {r.name || <span className="italic text-slate-400">Not provided</span>}
                        {r.hidden && (
                          <span className="ml-2 rounded bg-red-100 px-1.5 py-0.5 text-[10px] font-bold text-red-700">
                            HIDDEN
                          </span>
                        )}
                        {(r.featured.status === 'active' || r.featured.isLegacyFeatured) && (
                          <span className="ml-2 rounded bg-[var(--gold)]/20 px-1.5 py-0.5 text-[10px] font-bold text-[var(--navy)]">
                            FEATURED
                          </span>
                        )}
                      </td>
                      <td className="px-3 py-2 text-xs text-[var(--muted)]">{r.email}</td>
                      <td className="px-3 py-2 text-xs text-[var(--muted)]">{r.phone || '—'}</td>
                      <td className="px-3 py-2 text-xs">{r.county || r.counties[0] || '—'}</td>
                      <td className="px-3 py-2 text-xs text-[var(--muted)]">{r.stations.length}</td>
                      <td className="px-3 py-2 text-xs text-[var(--muted)]">{r.availability || '—'}</td>
                      <td className="px-3 py-2 text-xs uppercase tracking-wide text-slate-500">{r.source}</td>
                      <td className="px-3 py-2">
                        <span
                          className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${reviewBadgeClass(
                            r.review.status,
                          )}`}
                        >
                          {r.review.status}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-xs text-[var(--muted)]">{formatDate(r.registeredAt)}</td>
                      <td className="px-3 py-2 text-right">
                        <button
                          onClick={() => setSelectedEmail(r.email)}
                          className="btn-outline !px-3 !py-1 !text-xs"
                        >
                          View details
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-4 grid gap-3 lg:hidden">
              {filtered.map((r) => (
                <div
                  key={`mob-${r.source}:${r.email}`}
                  className="rounded-xl border border-[var(--card-border)] bg-white p-4 shadow-sm"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate font-bold text-[var(--navy)]">
                        {r.name || <span className="italic text-slate-400">Not provided</span>}
                      </p>
                      <p className="truncate text-xs text-[var(--muted)]">{r.email}</p>
                    </div>
                    <span
                      className={`inline-flex shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${reviewBadgeClass(
                        r.review.status,
                      )}`}
                    >
                      {r.review.status}
                    </span>
                  </div>
                  <dl className="mt-3 grid grid-cols-2 gap-x-3 gap-y-1 text-xs">
                    <dt className="text-[var(--muted)]">Phone</dt>
                    <dd className="text-[var(--navy)]">{r.phone || '—'}</dd>
                    <dt className="text-[var(--muted)]">County</dt>
                    <dd className="text-[var(--navy)]">{r.county || '—'}</dd>
                    <dt className="text-[var(--muted)]">Stations</dt>
                    <dd className="text-[var(--navy)]">{r.stations.length}</dd>
                    <dt className="text-[var(--muted)]">Source</dt>
                    <dd className="uppercase tracking-wide text-slate-500">{r.source}</dd>
                    <dt className="text-[var(--muted)]">Registered</dt>
                    <dd className="text-[var(--navy)]">{formatDate(r.registeredAt)}</dd>
                  </dl>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {r.hidden && (
                      <span className="rounded bg-red-100 px-2 py-0.5 text-[10px] font-bold text-red-700">HIDDEN</span>
                    )}
                    {(r.featured.status === 'active' || r.featured.isLegacyFeatured) && (
                      <span className="rounded bg-[var(--gold)]/20 px-2 py-0.5 text-[10px] font-bold text-[var(--navy)]">
                        FEATURED
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => setSelectedEmail(r.email)}
                    className="btn-outline mt-3 w-full !text-xs"
                  >
                    View details
                  </button>
                </div>
              ))}
            </div>
          </>
        )}
        </>
        )}

      {selectedEmail && (
        <AdminRepDetail
          email={selectedEmail}
          adminEmail={adminEmail}
          onClose={() => setSelectedEmail(null)}
          onChanged={() => {
            void reload();
          }}
        />
      )}
    </>
  );
}

function Stat({ label, value, tone }: { label: string; value: number; tone?: 'warn' | 'flag' }) {
  let cls = 'rounded-xl border border-[var(--card-border)] bg-white p-3 shadow-sm';
  if (tone === 'warn') cls += ' border-amber-200 bg-amber-50';
  if (tone === 'flag') cls += ' border-red-200 bg-red-50';
  return (
    <div className={cls}>
      <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--muted)]">{label}</p>
      <p className="mt-1 text-2xl font-extrabold text-[var(--navy)]">{value}</p>
    </div>
  );
}

function FilterSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: Array<{ value: string; label: string }>;
}) {
  return (
    <label className="block">
      <span className="block text-[10px] font-bold uppercase tracking-widest text-[var(--muted)]">
        {label}
      </span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full rounded-lg border border-[var(--border)] bg-white px-3 py-2 text-sm outline-none focus:border-[var(--gold)] focus:ring-2 focus:ring-[var(--gold)]/20"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}
