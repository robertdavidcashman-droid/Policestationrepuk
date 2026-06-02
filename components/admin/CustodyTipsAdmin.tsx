'use client';

import { useState } from 'react';
import type { CustodyConsensus } from '@/lib/custody-tips/types';

export function CustodyTipsAdmin({
  initialConsensus,
  stationNames,
}: {
  initialConsensus: CustodyConsensus[];
  stationNames: Record<string, string>;
}) {
  const [rows, setRows] = useState(initialConsensus);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function call(action: 'verify' | 'reject', stationId: string) {
    setBusy(`${action}-${stationId}`);
    setError(null);
    try {
      const res = await fetch('/api/admin/custody-tips', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, stationId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Request failed');
      if (action === 'reject') {
        setRows((r) => r.filter((x) => x.stationId !== stationId));
      } else {
        setRows((r) =>
          r.map((x) => (x.stationId === stationId ? (data.consensus as CustodyConsensus) : x)),
        );
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Request failed');
    } finally {
      setBusy(null);
    }
  }

  const needsAttention = rows.filter((r) => r.status === 'unverified' || r.conflict);
  const verified = rows.filter((r) => r.status === 'verified' && !r.conflict);

  function card(r: CustodyConsensus) {
    return (
      <div
        key={r.stationId}
        className="rounded-xl border border-[var(--border)] bg-white p-5 shadow-sm"
      >
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="font-bold text-[var(--navy)]">
              {stationNames[r.stationId] ?? r.stationId}
            </p>
            <p className="text-xs text-[var(--muted)]">
              {r.stationId} · updated {new Date(r.updatedAt).toLocaleString('en-GB')}
            </p>
            <p className="mt-2 text-[var(--navy)]">
              <span className="font-mono text-lg">{r.number}</span>{' '}
              <span className="text-sm text-[var(--muted)]">
                — {r.confirmedBy} {r.confirmedBy === 1 ? 'rep' : 'reps'}
                {r.status === 'verified' ? ' · verified' : ' · unverified'}
                {r.conflict ? ' · CONFLICT' : ''}
              </span>
            </p>
          </div>
          <div className="flex gap-2">
            {r.status !== 'verified' && (
              <button
                type="button"
                onClick={() => call('verify', r.stationId)}
                disabled={busy !== null}
                className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-bold text-white hover:bg-emerald-700 disabled:opacity-50"
              >
                {busy === `verify-${r.stationId}` ? 'Publishing…' : 'Verify & publish'}
              </button>
            )}
            <button
              type="button"
              onClick={() => call('reject', r.stationId)}
              disabled={busy !== null}
              className="rounded-lg border border-[var(--border)] bg-white px-4 py-2 text-sm font-semibold text-[var(--navy)] hover:border-red-300 hover:text-red-700 disabled:opacity-50"
            >
              {busy === `reject-${r.stationId}` ? 'Removing…' : 'Reject'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-10">
      {error && (
        <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      <section>
        <h2 className="text-lg font-bold text-[var(--navy)]">
          Needs attention ({needsAttention.length})
        </h2>
        <p className="mt-1 text-sm text-[var(--muted)]">
          Single-source (unverified) numbers and conflicts where reps disagree. Verifying publishes
          the number to the live station page; rejecting clears the tips, consensus and any override.
        </p>
        {needsAttention.length === 0 ? (
          <p className="mt-4 rounded-lg border border-[var(--border)] bg-white px-4 py-6 text-center text-sm text-[var(--muted)]">
            Nothing awaiting review.
          </p>
        ) : (
          <div className="mt-4 space-y-4">{needsAttention.map(card)}</div>
        )}
      </section>

      <section>
        <h2 className="text-lg font-bold text-[var(--navy)]">
          Verified by reps ({verified.length})
        </h2>
        {verified.length === 0 ? (
          <p className="mt-4 rounded-lg border border-[var(--border)] bg-white px-4 py-6 text-center text-sm text-[var(--muted)]">
            No rep-verified numbers yet.
          </p>
        ) : (
          <div className="mt-4 space-y-3">{verified.map(card)}</div>
        )}
      </section>
    </div>
  );
}
