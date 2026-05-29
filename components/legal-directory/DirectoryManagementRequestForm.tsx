'use client';

import { useState } from 'react';

export function DirectoryManagementRequestForm() {
  const [status, setStatus] = useState<'idle' | 'loading' | 'done' | 'error'>('idle');
  const [message, setMessage] = useState('');

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus('loading');
    const fd = new FormData(e.currentTarget);
    const body = Object.fromEntries(fd.entries());
    try {
      const res = await fetch('/api/legal-directory/manage-request', {
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
      setMessage(
        data.message ??
          'If a listing exists for this email, we have sent a secure management link.',
      );
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
      <label className="block">
        <span className="text-sm font-semibold text-[var(--navy)]">Email address used on your listing *</span>
        <input name="email" type="email" required className="mt-1 w-full rounded-lg border px-3 py-2 text-sm" />
      </label>
      <p className="text-sm text-[var(--muted)]">
        We will send a secure link if a listing is registered to this email. The link expires after 7 days.
        Do not share it with anyone else.
      </p>
      {status === 'error' && <p className="text-sm text-red-700">{message}</p>}
      <button type="submit" className="btn-gold" disabled={status === 'loading'}>
        {status === 'loading' ? 'Sending…' : 'Send secure management link'}
      </button>
    </form>
  );
}
