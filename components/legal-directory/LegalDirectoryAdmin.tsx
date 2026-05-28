'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { ModerationStatusBadge } from './ModerationStatusBadge';
import type { LegalDirectoryListingStatus } from '@/lib/legal-directory/types';

interface ListingRow {
  id: string;
  businessName: string;
  slug: string;
  status: LegalDirectoryListingStatus;
  categorySlug: string;
  county: string;
  riskScore: number;
  reviewFlags: string[];
  featured: boolean;
  promoted: boolean;
  verified: boolean;
  dateSubmitted: string;
  ownerEmail: string;
  hasPendingChanges: boolean;
}

export function LegalDirectoryAdmin({ reviewQueueOnly = false }: { reviewQueueOnly?: boolean }) {
  const [listings, setListings] = useState<ListingRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/admin/legal-directory');
      const data = (await res.json()) as { listings?: ListingRow[]; error?: string };
      if (!res.ok) {
        setError(data.error ?? 'Failed to load');
        return;
      }
      let rows = data.listings ?? [];
      if (reviewQueueOnly) {
        rows = rows.filter(
          (l) =>
            l.status === 'flagged_for_review' ||
            l.status === 'pending_update' ||
            l.status === 'deletion_requested' ||
            l.status === 'rejected_spam' ||
            l.status === 'pending_review' ||
            l.riskScore >= 51,
        );
        rows.sort((a, b) => b.riskScore - a.riskScore);
      }
      setListings(rows);
    } catch {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  }, [reviewQueueOnly]);

  useEffect(() => {
    load();
  }, [load]);

  async function action(id: string, actionName: string, extra?: Record<string, unknown>) {
    const res = await fetch(`/api/admin/legal-directory/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: actionName, ...extra }),
    });
    if (res.ok) await load();
    else {
      const d = (await res.json()) as { error?: string };
      alert(d.error ?? 'Action failed');
    }
  }

  const filtered = listings.filter((l) => {
    if (!filter) return true;
    const f = filter.toLowerCase();
    return (
      l.businessName.toLowerCase().includes(f) ||
      l.ownerEmail.toLowerCase().includes(f) ||
      l.status.includes(f) ||
      l.county.toLowerCase().includes(f)
    );
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-4">
        <input
          type="search"
          placeholder="Search listings…"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="rounded-lg border px-3 py-2 text-sm"
        />
        <button type="button" onClick={load} className="btn-outline !text-sm">
          Refresh
        </button>
        {!reviewQueueOnly && (
          <Link href="/admin/legal-directory/review-queue" className="btn-gold !text-sm no-underline">
            Review queue
          </Link>
        )}
      </div>

      {loading && <p className="text-sm text-[var(--muted)]">Loading…</p>}
      {error && <p className="text-sm text-red-700">{error}</p>}

      <div className="overflow-x-auto rounded-xl border border-[var(--card-border)] bg-white">
        <table className="w-full min-w-[800px] text-left text-sm">
          <thead className="border-b bg-slate-50 text-xs uppercase text-[var(--muted)]">
            <tr>
              <th className="p-3">Business</th>
              <th className="p-3">Status</th>
              <th className="p-3">Risk</th>
              <th className="p-3">County</th>
              <th className="p-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((l) => (
              <tr key={l.id} className="border-b last:border-0">
                <td className="p-3">
                  <p className="font-semibold text-[var(--navy)]">{l.businessName}</p>
                  <p className="text-xs text-[var(--muted)]">{l.ownerEmail}</p>
                  {l.hasPendingChanges && (
                    <p className="text-xs font-semibold text-amber-700">Pending amendment</p>
                  )}
                </td>
                <td className="p-3">
                  <ModerationStatusBadge status={l.status} />
                </td>
                <td className="p-3">
                  <span className={l.riskScore >= 51 ? 'font-bold text-red-700' : ''}>{l.riskScore}</span>
                  {l.reviewFlags.length > 0 && (
                    <p className="mt-1 text-[10px] text-[var(--muted)]">{l.reviewFlags.join(', ')}</p>
                  )}
                </td>
                <td className="p-3">{l.county}</td>
                <td className="p-3">
                  <div className="flex flex-wrap gap-1">
                    {l.status !== 'approved' && (
                      <button
                        type="button"
                        className="rounded bg-emerald-600 px-2 py-1 text-xs text-white"
                        onClick={() => action(l.id, 'approve')}
                      >
                        Approve
                      </button>
                    )}
                    {l.status === 'pending_update' && l.hasPendingChanges && (
                      <button
                        type="button"
                        className="rounded bg-blue-600 px-2 py-1 text-xs text-white"
                        onClick={() => action(l.id, 'approve_amendment')}
                      >
                        Approve amend
                      </button>
                    )}
                    {l.status === 'deletion_requested' && (
                      <button
                        type="button"
                        className="rounded bg-orange-600 px-2 py-1 text-xs text-white"
                        onClick={() => action(l.id, 'approve_deletion')}
                      >
                        Approve delete
                      </button>
                    )}
                    <button
                      type="button"
                      className="rounded bg-slate-600 px-2 py-1 text-xs text-white"
                      onClick={() => action(l.id, 'flag')}
                    >
                      Flag
                    </button>
                    <button
                      type="button"
                      className="rounded border px-2 py-1 text-xs"
                      onClick={() => action(l.id, 'set_featured', { featured: !l.featured })}
                    >
                      {l.featured ? 'Unfeature' : 'Feature'}
                    </button>
                    <button
                      type="button"
                      className="rounded border px-2 py-1 text-xs text-red-700"
                      onClick={() => action(l.id, 'reject')}
                    >
                      Reject
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && !loading && (
          <p className="p-8 text-center text-sm text-[var(--muted)]">No listings in this view.</p>
        )}
      </div>
    </div>
  );
}
