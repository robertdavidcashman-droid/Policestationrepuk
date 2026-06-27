'use client';

import { useState } from 'react';

interface GuideEmailCaptureProps {
  /** Short heading, e.g. "Get the police station rates summary". */
  title: string;
  /** One-line supporting copy under the heading. */
  description: string;
  /** Analytics/source tag stored with the submission, e.g. "rates-page". */
  source: string;
  /** Lead magnet label stored with the submission, e.g. "Legal Aid rates summary". */
  leadMagnet: string;
  /** Submit button label. */
  buttonLabel?: string;
  className?: string;
}

/**
 * Reusable email capture for high-intent guide pages.
 * Posts to the existing /api/lead-magnet endpoint (Resend + submission store).
 */
export function GuideEmailCapture({
  title,
  description,
  source,
  leadMagnet,
  buttonLabel = 'Email it to me',
  className = '',
}: GuideEmailCaptureProps) {
  const [email, setEmail] = useState('');
  const [hp, setHp] = useState('');
  const [startedAt] = useState(() => Date.now());
  const [status, setStatus] = useState<'idle' | 'sending' | 'done' | 'error'>('idle');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (hp) return;
    setStatus('sending');
    try {
      const res = await fetch('/api/lead-magnet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          source,
          leadMagnet,
          _hp: hp,
          _startedAt: startedAt,
        }),
      });
      const data = (await res.json().catch(() => ({}))) as { ok?: boolean };
      if (res.ok && data.ok) {
        setStatus('done');
        setEmail('');
      } else {
        setStatus('error');
      }
    } catch {
      setStatus('error');
    }
  }

  return (
    <div
      className={`rounded-2xl border-2 border-dashed border-[var(--gold)]/50 bg-white p-6 sm:p-8 ${className}`}
    >
      <h2 className="text-lg font-extrabold text-[var(--navy)]">{title}</h2>
      <p className="mt-1 text-sm text-[var(--muted)]">{description}</p>
      {status === 'done' ? (
        <p className="mt-4 text-sm font-medium text-green-700">
          Thanks — check your inbox shortly.
        </p>
      ) : (
        <form onSubmit={handleSubmit} className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end">
          <div aria-hidden className="absolute -left-[9999px]">
            <label htmlFor={`ge-company-${source}`}>Company</label>
            <input
              id={`ge-company-${source}`}
              type="text"
              tabIndex={-1}
              value={hp}
              onChange={(e) => setHp(e.target.value)}
            />
          </div>
          <div className="min-w-0 flex-1">
            <label htmlFor={`ge-email-${source}`} className="sr-only">
              Email
            </label>
            <input
              id={`ge-email-${source}`}
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Your email"
              className="w-full rounded-xl border-2 border-slate-300 px-4 py-3 text-slate-900 shadow-sm focus:border-[var(--navy)] focus:outline-none focus:ring-2 focus:ring-[var(--navy)]/20"
            />
          </div>
          <button
            type="submit"
            disabled={status === 'sending'}
            className="min-h-[48px] shrink-0 rounded-xl bg-[var(--navy)] px-6 py-3 text-sm font-bold text-white hover:bg-[var(--navy-light)] disabled:opacity-60"
          >
            {status === 'sending' ? 'Sending…' : buttonLabel}
          </button>
        </form>
      )}
      {status === 'error' && (
        <p className="mt-2 text-sm text-red-600">Could not send — try again in a moment.</p>
      )}
    </div>
  );
}
