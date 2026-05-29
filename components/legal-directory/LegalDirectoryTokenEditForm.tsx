'use client';

import { useState } from 'react';
import type { LegalDirectoryListing } from '@/lib/legal-directory/types';
import { ENGLISH_COUNTIES } from '@/lib/english-counties';

const inputClass =
  'mt-1 w-full rounded-lg border border-[var(--border)] px-3 py-2 text-sm';

export function LegalDirectoryTokenEditForm({
  listing,
  token,
}: {
  listing: LegalDirectoryListing;
  token: string;
}) {
  const [status, setStatus] = useState<'idle' | 'loading' | 'done' | 'error'>('idle');
  const [message, setMessage] = useState('');

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus('loading');
    const fd = new FormData(e.currentTarget);
    const changes: Record<string, string | boolean> = {};
    fd.forEach((v, k) => {
      if (k === 'availability24Hour') changes[k] = v === 'on';
      else if (typeof v === 'string') changes[k] = v;
    });
    try {
      const res = await fetch('/api/admin/legal-directory/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, action: 'amend', changes }),
      });
      const data = (await res.json()) as { ok?: boolean; error?: string; message?: string };
      if (!res.ok || !data.ok) {
        setStatus('error');
        setMessage(data.error ?? 'Update failed.');
        return;
      }
      setStatus('done');
      setMessage(data.message ?? 'Listing updated.');
    } catch {
      setStatus('error');
      setMessage('Network error.');
    }
  }

  if (status === 'done') {
    return (
      <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-6">
        <p className="text-sm text-emerald-900">{message}</p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="card-surface space-y-4 p-6">
      <p className="text-sm text-[var(--muted)]">
        Amending <strong>{listing.businessName}</strong>. Changes go live immediately.
      </p>
      <label className="block">
        <span className="text-sm font-semibold text-[var(--navy)]">Business name</span>
        <input name="businessName" defaultValue={listing.businessName} className={inputClass} />
      </label>
      <label className="block">
        <span className="text-sm font-semibold text-[var(--navy)]">Contact person</span>
        <input name="contactPerson" defaultValue={listing.contactPerson} className={inputClass} />
      </label>
      <label className="block">
        <span className="text-sm font-semibold text-[var(--navy)]">Phone</span>
        <input name="phone" defaultValue={listing.phone} className={inputClass} />
      </label>
      <label className="block">
        <span className="text-sm font-semibold text-[var(--navy)]">Emergency phone</span>
        <input name="emergencyPhone" defaultValue={listing.emergencyPhone} className={inputClass} />
      </label>
      <label className="block">
        <span className="text-sm font-semibold text-[var(--navy)]">Website</span>
        <input name="websiteUrl" defaultValue={listing.websiteUrl} className={inputClass} />
      </label>
      <label className="block">
        <span className="text-sm font-semibold text-[var(--navy)]">Description</span>
        <textarea name="description" defaultValue={listing.description} rows={6} className={inputClass} />
      </label>
      <label className="block">
        <span className="text-sm font-semibold text-[var(--navy)]">Areas covered</span>
        <textarea name="areasCovered" defaultValue={listing.areasCovered} rows={3} className={inputClass} />
      </label>
      <label className="block">
        <span className="text-sm font-semibold text-[var(--navy)]">Specialisms</span>
        <textarea name="specialisms" defaultValue={listing.specialisms} rows={2} className={inputClass} />
      </label>
      <label className="block">
        <span className="text-sm font-semibold text-[var(--navy)]">County</span>
        <select name="county" defaultValue={listing.county} className={inputClass}>
          {ENGLISH_COUNTIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </label>
      <label className="flex items-center gap-2">
        <input
          type="checkbox"
          name="availability24Hour"
          defaultChecked={listing.availability24Hour}
          className="h-4 w-4"
        />
        <span className="text-sm text-[var(--navy)]">24-hour availability</span>
      </label>
      {status === 'error' && <p className="text-sm text-red-700">{message}</p>}
      <button type="submit" className="btn-gold" disabled={status === 'loading'}>
        {status === 'loading' ? 'Saving…' : 'Save changes'}
      </button>
    </form>
  );
}
