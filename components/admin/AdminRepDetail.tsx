'use client';

import { useEffect, useState } from 'react';

interface DetailResponse {
  email: string;
  source: 'registered' | 'static';
  newrep: Record<string, unknown> | null;
  profile: Record<string, unknown> | null;
  featured: Record<string, unknown> | null;
  review: {
    email: string;
    status: 'pending' | 'approved' | 'flagged' | 'rejected';
    adminNotes: string;
    lastReviewedAt: string;
    reviewedBy: string;
  } | null;
  staticRep: Record<string, unknown> | null;
}

type ReviewStatus = 'pending' | 'approved' | 'flagged' | 'rejected';

const EDITABLE_FIELDS: Array<{ key: string; label: string; kind: 'text' | 'textarea' | 'list' }> = [
  { key: 'name', label: 'Name', kind: 'text' },
  { key: 'phone', label: 'Phone', kind: 'text' },
  { key: 'availability', label: 'Availability', kind: 'text' },
  { key: 'accreditation', label: 'Accreditation', kind: 'text' },
  { key: 'counties', label: 'Counties (comma-separated)', kind: 'list' },
  { key: 'stations_covered', label: 'Stations covered (comma-separated)', kind: 'list' },
  { key: 'coverage_areas', label: 'Coverage areas', kind: 'textarea' },
  { key: 'postcode', label: 'Postcode', kind: 'text' },
  { key: 'website_url', label: 'Website URL', kind: 'text' },
  { key: 'whatsapp_link', label: 'WhatsApp link / preference', kind: 'text' },
  { key: 'dscc_pin', label: 'DSCC PIN', kind: 'text' },
  { key: 'holiday_availability', label: 'Holiday availability', kind: 'text' },
  { key: 'languages', label: 'Languages', kind: 'text' },
  { key: 'specialisms', label: 'Specialisms', kind: 'text' },
  { key: 'years_experience', label: 'Years of experience', kind: 'text' },
  { key: 'notes', label: 'Notes / bio', kind: 'textarea' },
];

function readField(
  profile: Record<string, unknown> | null,
  base: Record<string, unknown> | null,
  key: string,
): string {
  if (profile && key in profile && profile[key] != null) return stringify(profile[key]);
  if (base && key in base && base[key] != null) return stringify(base[key]);
  return '';
}

function stringify(value: unknown): string {
  if (Array.isArray(value)) return value.join(', ');
  if (value == null) return '';
  if (typeof value === 'string') return value;
  return String(value);
}

function formatDate(value: string | null | undefined): string {
  if (!value) return '—';
  try {
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return value;
    return d.toLocaleString('en-GB');
  } catch {
    return value;
  }
}

export function AdminRepDetail({
  email,
  adminEmail,
  onClose,
  onChanged,
}: {
  email: string;
  adminEmail: string;
  onClose: () => void;
  onChanged: () => void;
}) {
  const [data, setData] = useState<DetailResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const [reviewStatus, setReviewStatus] = useState<ReviewStatus>('pending');
  const [adminNotes, setAdminNotes] = useState('');
  const [featuredExpires, setFeaturedExpires] = useState('');

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/reps/${encodeURIComponent(email)}`, { cache: 'no-store' });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || `Request failed: ${res.status}`);
      }
      const payload = (await res.json()) as DetailResponse;
      setData(payload);
      const seed: Record<string, string> = {};
      const base = payload.newrep ?? (payload.staticRep as Record<string, unknown> | null);
      for (const f of EDITABLE_FIELDS) {
        seed[f.key] = readField(payload.profile, base, f.key === 'stations_covered' ? 'stations' : f.key) ||
          readField(payload.profile, base, f.key);
      }
      setForm(seed);
      setReviewStatus(payload.review?.status ?? 'pending');
      setAdminNotes(payload.review?.adminNotes ?? '');
      setFeaturedExpires('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [email]);

  const flash = (msg: string) => {
    setMessage(msg);
    window.setTimeout(() => setMessage(null), 3500);
  };

  const handleProfileSave = async () => {
    setSaving(true);
    setMessage(null);
    try {
      const body: Record<string, unknown> = {};
      for (const f of EDITABLE_FIELDS) {
        const raw = form[f.key] ?? '';
        if (f.kind === 'list') {
          body[f.key] = raw.split(/[,;]+/).map((s) => s.trim()).filter(Boolean);
        } else {
          body[f.key] = raw.trim();
        }
      }
      const res = await fetch(`/api/admin/reps/${encodeURIComponent(email)}`, {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(body),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || 'Save failed');
      flash('Profile saved');
      onChanged();
      await load();
    } catch (err) {
      flash(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const handleReviewSave = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/review/${encodeURIComponent(email)}`, {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ status: reviewStatus, adminNotes }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || 'Review save failed');
      flash('Review saved');
      onChanged();
      await load();
    } catch (err) {
      flash(err instanceof Error ? err.message : 'Review save failed');
    } finally {
      setSaving(false);
    }
  };

  const handleHide = async (hide: boolean) => {
    if (!confirm(hide ? 'Hide this listing from the public directory?' : 'Restore this listing to the public directory?')) return;
    setSaving(true);
    try {
      const res = await fetch('/api/admin/hide', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email, hide }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || 'Hide failed');
      flash(hide ? 'Listing hidden' : 'Listing restored');
      onChanged();
      await load();
    } catch (err) {
      flash(err instanceof Error ? err.message : 'Hide failed');
    } finally {
      setSaving(false);
    }
  };

  const handleFeaturedAction = async (action: 'activate' | 'cancel' | 'expire') => {
    if (action === 'expire' && !confirm('Mark this rep\'s featured listing as expired?')) return;
    setSaving(true);
    try {
      const payload: Record<string, unknown> = { email, action };
      if (action === 'activate') payload.tier = 'manual-admin';
      if ((action === 'activate' || action === 'cancel') && featuredExpires) {
        payload.expiresAt = new Date(featuredExpires).toISOString();
      }
      const res = await fetch('/api/admin/featured', {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || 'Featured action failed');
      flash(`Featured ${action} ok`);
      onChanged();
      await load();
    } catch (err) {
      flash(err instanceof Error ? err.message : 'Featured action failed');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (
      !confirm(
        `Delete listing for ${email}? This removes the registration / hides a static rep, plus any profile, featured, and review records. This cannot be undone for registered rows.`,
      )
    )
      return;
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/reps/${encodeURIComponent(email)}`, {
        method: 'DELETE',
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || 'Delete failed');
      flash('Listing removed');
      onChanged();
      onClose();
    } catch (err) {
      flash(err instanceof Error ? err.message : 'Delete failed');
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-sm">
      <div className="flex h-full w-full max-w-4xl flex-col bg-white shadow-2xl">
        <div className="flex items-start justify-between border-b border-[var(--card-border)] px-6 py-4">
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--gold)]">
              Rep detail
            </p>
            <h2 className="truncate text-h3 text-[var(--navy)]">{email}</h2>
            <p className="text-xs text-[var(--muted)]">
              Acting as {adminEmail} · Source: {data?.source ?? '—'}
            </p>
          </div>
          <button onClick={onClose} className="rounded-lg border border-[var(--border)] px-3 py-1 text-sm">
            Close
          </button>
        </div>

        {message && (
          <div className="border-b border-amber-200 bg-amber-50 px-6 py-2 text-sm text-amber-900">
            {message}
          </div>
        )}

        <div className="flex-1 overflow-y-auto px-6 py-5">
          {loading && <p className="text-sm text-[var(--muted)]">Loading…</p>}
          {error && (
            <p className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">{error}</p>
          )}

          {data && (
            <>
              <section className="mb-6">
                <h3 className="mb-2 text-sm font-bold uppercase tracking-wide text-[var(--navy)]">
                  Profile overrides (saved to profile:{email})
                </h3>
                <div className="grid gap-3 sm:grid-cols-2">
                  {EDITABLE_FIELDS.map((f) => (
                    <label key={f.key} className={f.kind === 'textarea' ? 'sm:col-span-2 block' : 'block'}>
                      <span className="block text-xs font-semibold text-[var(--muted)]">{f.label}</span>
                      {f.kind === 'textarea' ? (
                        <textarea
                          rows={3}
                          value={form[f.key] ?? ''}
                          onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}
                          className="mt-1 w-full rounded-lg border border-[var(--border)] px-3 py-2 text-sm outline-none focus:border-[var(--gold)] focus:ring-2 focus:ring-[var(--gold)]/20"
                          placeholder="Not provided"
                        />
                      ) : (
                        <input
                          type="text"
                          value={form[f.key] ?? ''}
                          onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}
                          className="mt-1 w-full rounded-lg border border-[var(--border)] px-3 py-2 text-sm outline-none focus:border-[var(--gold)] focus:ring-2 focus:ring-[var(--gold)]/20"
                          placeholder="Not provided"
                        />
                      )}
                    </label>
                  ))}
                </div>
                <div className="mt-3 flex gap-2">
                  <button onClick={handleProfileSave} disabled={saving} className="btn-gold !text-sm">
                    {saving ? 'Saving…' : 'Save profile overrides'}
                  </button>
                </div>
              </section>

              <section className="mb-6 rounded-xl border border-[var(--card-border)] bg-slate-50 p-4">
                <h3 className="mb-3 text-sm font-bold uppercase tracking-wide text-[var(--navy)]">
                  Review (suspicious entry triage)
                </h3>
                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="block">
                    <span className="block text-xs font-semibold text-[var(--muted)]">Status</span>
                    <select
                      value={reviewStatus}
                      onChange={(e) => setReviewStatus(e.target.value as ReviewStatus)}
                      className="mt-1 w-full rounded-lg border border-[var(--border)] bg-white px-3 py-2 text-sm"
                    >
                      <option value="pending">Pending</option>
                      <option value="approved">Approved</option>
                      <option value="flagged">Flagged</option>
                      <option value="rejected">Rejected</option>
                    </select>
                  </label>
                  <div className="text-xs text-[var(--muted)]">
                    <p>Last reviewed: {formatDate(data.review?.lastReviewedAt)}</p>
                    <p>Reviewed by: {data.review?.reviewedBy ?? '—'}</p>
                  </div>
                  <label className="block sm:col-span-2">
                    <span className="block text-xs font-semibold text-[var(--muted)]">Admin notes</span>
                    <textarea
                      rows={3}
                      value={adminNotes}
                      onChange={(e) => setAdminNotes(e.target.value)}
                      placeholder="Why is this flagged / what was checked / who confirmed?"
                      className="mt-1 w-full rounded-lg border border-[var(--border)] px-3 py-2 text-sm"
                    />
                  </label>
                </div>
                <div className="mt-3 flex gap-2">
                  <button onClick={handleReviewSave} disabled={saving} className="btn-outline !text-sm">
                    {saving ? 'Saving…' : 'Save review'}
                  </button>
                </div>
              </section>

              <section className="mb-6 rounded-xl border border-[var(--card-border)] bg-slate-50 p-4">
                <h3 className="mb-3 text-sm font-bold uppercase tracking-wide text-[var(--navy)]">
                  Featured listing
                </h3>
                {data.featured ? (
                  <pre className="overflow-x-auto rounded-lg bg-white p-3 text-xs">
                    {JSON.stringify(data.featured, null, 2)}
                  </pre>
                ) : (
                  <p className="text-xs text-[var(--muted)]">No featured record.</p>
                )}
                <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                  <label className="block sm:col-span-2 lg:col-span-3">
                    <span className="block text-xs font-semibold text-[var(--muted)]">
                      Expires at (activate / cancel)
                    </span>
                    <input
                      type="datetime-local"
                      value={featuredExpires}
                      onChange={(e) => setFeaturedExpires(e.target.value)}
                      className="mt-1 w-full rounded-lg border border-[var(--border)] bg-white px-3 py-2 text-sm"
                    />
                  </label>
                  <button onClick={() => handleFeaturedAction('activate')} disabled={saving} className="btn-gold w-full !text-sm">
                    Activate
                  </button>
                  <button onClick={() => handleFeaturedAction('cancel')} disabled={saving} className="btn-outline w-full !text-sm">
                    Cancel
                  </button>
                  <button onClick={() => handleFeaturedAction('expire')} disabled={saving} className="btn-outline w-full !text-sm">
                    Expire now
                  </button>
                </div>
              </section>

              <section className="mb-6 rounded-xl border border-[var(--card-border)] bg-slate-50 p-4">
                <h3 className="mb-3 text-sm font-bold uppercase tracking-wide text-[var(--navy)]">
                  Visibility
                </h3>
                <p className="text-xs text-[var(--muted)]">
                  Toggle hidden flag for this email (uses <code>directory:hidden_listing_emails</code>).
                </p>
                <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                  <button onClick={() => handleHide(true)} disabled={saving} className="btn-outline w-full !text-sm sm:w-auto">
                    Hide from directory
                  </button>
                  <button onClick={() => handleHide(false)} disabled={saving} className="btn-outline w-full !text-sm sm:w-auto">
                    Restore to directory
                  </button>
                </div>
              </section>

              <section className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4">
                <h3 className="mb-2 text-sm font-bold uppercase tracking-wide text-red-700">
                  Danger zone
                </h3>
                <p className="text-xs text-red-700">
                  Hard delete the registration (or hide the static entry) plus any profile, featured, and review records for {email}.
                </p>
                <button
                  onClick={handleDelete}
                  disabled={saving}
                  className="mt-3 inline-flex items-center rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-700 disabled:opacity-60"
                >
                  Delete listing
                </button>
              </section>

              <section className="mb-6">
                <h3 className="mb-2 text-sm font-bold uppercase tracking-wide text-[var(--navy)]">
                  Raw KV records
                </h3>
                <details className="rounded-lg border border-[var(--card-border)] bg-white p-3">
                  <summary className="cursor-pointer text-xs font-semibold text-[var(--navy)]">
                    newrep:{email}
                  </summary>
                  <pre className="mt-2 overflow-x-auto text-xs">
                    {JSON.stringify(data.newrep, null, 2)}
                  </pre>
                </details>
                <details className="mt-2 rounded-lg border border-[var(--card-border)] bg-white p-3">
                  <summary className="cursor-pointer text-xs font-semibold text-[var(--navy)]">
                    profile:{email}
                  </summary>
                  <pre className="mt-2 overflow-x-auto text-xs">
                    {JSON.stringify(data.profile, null, 2)}
                  </pre>
                </details>
                <details className="mt-2 rounded-lg border border-[var(--card-border)] bg-white p-3">
                  <summary className="cursor-pointer text-xs font-semibold text-[var(--navy)]">
                    featured:{email}
                  </summary>
                  <pre className="mt-2 overflow-x-auto text-xs">
                    {JSON.stringify(data.featured, null, 2)}
                  </pre>
                </details>
                <details className="mt-2 rounded-lg border border-[var(--card-border)] bg-white p-3">
                  <summary className="cursor-pointer text-xs font-semibold text-[var(--navy)]">
                    repreview:{email}
                  </summary>
                  <pre className="mt-2 overflow-x-auto text-xs">
                    {JSON.stringify(data.review, null, 2)}
                  </pre>
                </details>
                {data.staticRep && (
                  <details className="mt-2 rounded-lg border border-[var(--card-border)] bg-white p-3">
                    <summary className="cursor-pointer text-xs font-semibold text-[var(--navy)]">
                      static rep (data/reps.json)
                    </summary>
                    <pre className="mt-2 overflow-x-auto text-xs">
                      {JSON.stringify(data.staticRep, null, 2)}
                    </pre>
                  </details>
                )}
              </section>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
