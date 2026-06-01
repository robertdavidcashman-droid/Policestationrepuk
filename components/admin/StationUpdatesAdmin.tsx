'use client';

import { useState } from 'react';
import type {
  PendingStationUpdate,
  StationOverride,
  StationOverrideFields,
} from '@/lib/station-overrides';

const FIELD_LABELS: Record<string, string> = {
  address: 'Address',
  postcode: 'Postcode',
  phone: 'Main line',
  custodyPhone: 'Custody desk',
  custodyPhone2: 'Custody desk (alt)',
  nonEmergencyPhone: 'Non-emergency',
};

function fieldRows(fields: StationOverrideFields) {
  return (Object.entries(fields) as [string, string | undefined][])
    .filter(([, v]) => typeof v === 'string' && v.trim())
    .map(([k, v]) => ({ label: FIELD_LABELS[k] ?? k, value: v as string }));
}

export function StationUpdatesAdmin({
  initialPending,
  initialOverrides,
}: {
  initialPending: PendingStationUpdate[];
  initialOverrides: StationOverride[];
}) {
  const [pending, setPending] = useState(initialPending);
  const [overrides, setOverrides] = useState(initialOverrides);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function call(body: Record<string, unknown>, key: string) {
    setBusy(key);
    setError(null);
    try {
      const res = await fetch('/api/admin/station-update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Request failed');
      return data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Request failed');
      return null;
    } finally {
      setBusy(null);
    }
  }

  async function approve(item: PendingStationUpdate) {
    const data = await call(
      { action: 'approve', id: item.id, stationId: item.stationId, fields: item.fields },
      `approve-${item.id}`,
    );
    if (!data) return;
    setPending((p) => p.filter((x) => x.id !== item.id));
    setOverrides((o) => [
      data.override as StationOverride,
      ...o.filter((x) => x.stationId !== item.stationId),
    ]);
  }

  async function reject(item: PendingStationUpdate) {
    const data = await call({ action: 'reject', id: item.id }, `reject-${item.id}`);
    if (!data) return;
    setPending((p) => p.filter((x) => x.id !== item.id));
  }

  async function revert(stationId: string) {
    const data = await call({ action: 'revert', stationId }, `revert-${stationId}`);
    if (!data) return;
    setOverrides((o) => o.filter((x) => x.stationId !== stationId));
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
          Pending corrections ({pending.length})
        </h2>
        <p className="mt-1 text-sm text-[var(--muted)]">
          Approving publishes the change to the live directory immediately (no redeploy) and
          revalidates the affected pages.
        </p>
        {pending.length === 0 ? (
          <p className="mt-4 rounded-lg border border-[var(--border)] bg-white px-4 py-6 text-center text-sm text-[var(--muted)]">
            No pending station corrections.
          </p>
        ) : (
          <div className="mt-4 space-y-4">
            {pending.map((item) => (
              <div
                key={item.id}
                className="rounded-xl border border-[var(--border)] bg-white p-5 shadow-sm"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-bold text-[var(--navy)]">{item.stationName}</p>
                    <p className="text-xs text-[var(--muted)]">
                      {item.stationId} · {new Date(item.submittedAt).toLocaleString('en-GB')}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => approve(item)}
                      disabled={busy !== null}
                      className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-bold text-white hover:bg-emerald-700 disabled:opacity-50"
                    >
                      {busy === `approve-${item.id}` ? 'Publishing…' : 'Approve & publish'}
                    </button>
                    <button
                      type="button"
                      onClick={() => reject(item)}
                      disabled={busy !== null}
                      className="rounded-lg border border-[var(--border)] bg-white px-4 py-2 text-sm font-semibold text-[var(--navy)] hover:border-red-300 hover:text-red-700 disabled:opacity-50"
                    >
                      Reject
                    </button>
                  </div>
                </div>

                <dl className="mt-3 grid gap-x-4 gap-y-1 text-sm sm:grid-cols-[140px_1fr]">
                  {fieldRows(item.fields).map((r) => (
                    <div key={r.label} className="contents">
                      <dt className="font-semibold text-[var(--muted)]">{r.label}</dt>
                      <dd className="text-[var(--navy)]">{r.value}</dd>
                    </div>
                  ))}
                </dl>

                {item.notes && (
                  <p className="mt-3 rounded-lg bg-slate-50 px-3 py-2 text-sm text-[var(--muted)]">
                    {item.notes}
                  </p>
                )}
                {(item.submitterName || item.submitterEmail) && (
                  <p className="mt-2 text-xs text-[var(--muted)]">
                    Submitted by {item.submitterName}
                    {item.submitterEmail ? ` · ${item.submitterEmail}` : ''}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="text-lg font-bold text-[var(--navy)]">
          Published overrides ({overrides.length})
        </h2>
        <p className="mt-1 text-sm text-[var(--muted)]">
          Live corrections layered over <code>data/stations.json</code>. Revert to fall back to the
          original record.
        </p>
        {overrides.length === 0 ? (
          <p className="mt-4 rounded-lg border border-[var(--border)] bg-white px-4 py-6 text-center text-sm text-[var(--muted)]">
            No published overrides.
          </p>
        ) : (
          <div className="mt-4 space-y-3">
            {overrides.map((ov) => (
              <div
                key={ov.stationId}
                className="flex flex-wrap items-start justify-between gap-3 rounded-xl border border-[var(--border)] bg-white p-4 shadow-sm"
              >
                <div className="text-sm">
                  <p className="font-semibold text-[var(--navy)]">{ov.stationId}</p>
                  <p className="text-xs text-[var(--muted)]">
                    Updated {new Date(ov.updatedAt).toLocaleString('en-GB')}
                    {ov.approvedBy ? ` by ${ov.approvedBy}` : ''}
                  </p>
                  <p className="mt-1 text-[var(--navy)]">
                    {fieldRows(ov.fields)
                      .map((r) => `${r.label}: ${r.value}`)
                      .join(' · ')}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => revert(ov.stationId)}
                  disabled={busy !== null}
                  className="rounded-lg border border-[var(--border)] bg-white px-4 py-2 text-sm font-semibold text-[var(--navy)] hover:border-red-300 hover:text-red-700 disabled:opacity-50"
                >
                  {busy === `revert-${ov.stationId}` ? 'Reverting…' : 'Revert'}
                </button>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
