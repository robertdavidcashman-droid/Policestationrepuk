'use client';

import { useRef, useState } from 'react';

export function ClaimListingForm({ slug, businessName }: { slug: string; businessName: string }) {
  const [status, setStatus] = useState<'idle' | 'loading' | 'done' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const startedAt = useRef(Date.now());

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus('loading');
    const fd = new FormData(e.currentTarget);
    const body = {
      ...Object.fromEntries(fd.entries()),
      slug,
      _startedAt: startedAt.current,
      consentAuthority: fd.get('consentAuthority') === 'on',
    };
    try {
      const res = await fetch('/api/legal-directory/claim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = (await res.json()) as { ok?: boolean; error?: string; message?: string };
      if (!res.ok || !data.ok) {
        setStatus('error');
        setMessage(data.error ?? 'Request failed.');
        return;
      }
      setStatus('done');
      setMessage(data.message ?? 'If this listing can be claimed, we have emailed a secure link.');
    } catch {
      setStatus('error');
      setMessage('Network error.');
    }
  }

  if (status === 'done') {
    return (
      <div className="card-surface border-emerald-200 bg-emerald-50 p-6">
        <p className="text-sm text-emerald-900">{message}</p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="card-surface space-y-4 p-6">
      <div className="absolute -left-[9999px] h-0 w-0 overflow-hidden" aria-hidden>
        <input type="text" name="_hp" tabIndex={-1} autoComplete="off" />
      </div>
      <p className="text-sm text-[var(--muted)]">
        Claiming <strong className="text-[var(--navy)]">{businessName}</strong>. We will email a secure
        link to manage this listing. Use an email at your firm so we can confirm authority.
      </p>
      <label className="block">
        <span className="text-sm font-semibold text-[var(--navy)]">Your work email *</span>
        <input name="email" type="email" required className="mt-1 w-full rounded-lg border px-3 py-2 text-sm" />
      </label>
      <label className="block">
        <span className="text-sm font-semibold text-[var(--navy)]">Your name</span>
        <input name="contactPerson" type="text" className="mt-1 w-full rounded-lg border px-3 py-2 text-sm" />
      </label>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="text-sm font-semibold text-[var(--navy)]">Phone</span>
          <input name="phone" type="tel" className="mt-1 w-full rounded-lg border px-3 py-2 text-sm" />
        </label>
        <label className="block">
          <span className="text-sm font-semibold text-[var(--navy)]">Website</span>
          <input name="websiteUrl" type="url" className="mt-1 w-full rounded-lg border px-3 py-2 text-sm" />
        </label>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="text-sm font-semibold text-[var(--navy)]">Regulatory body</span>
          <input name="regulatoryBody" type="text" placeholder="e.g. SRA" className="mt-1 w-full rounded-lg border px-3 py-2 text-sm" />
        </label>
        <label className="block">
          <span className="text-sm font-semibold text-[var(--navy)]">Regulatory / SRA number</span>
          <input name="regulatoryNumber" type="text" className="mt-1 w-full rounded-lg border px-3 py-2 text-sm" />
        </label>
      </div>
      <p className="text-xs text-[var(--muted)]">
        Providing your SRA number lets us confirm your listing against the public register automatically.
      </p>
      <label className="flex items-start gap-2">
        <input name="consentAuthority" type="checkbox" required className="mt-1" />
        <span className="text-sm text-[var(--muted)]">
          I am authorised to manage this listing on behalf of the firm. *
        </span>
      </label>
      {status === 'error' && <p className="text-sm text-red-700">{message}</p>}
      <button type="submit" className="btn-gold" disabled={status === 'loading'}>
        {status === 'loading' ? 'Sending…' : 'Claim this listing'}
      </button>
    </form>
  );
}
