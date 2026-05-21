'use client';

import { useCallback, useState } from 'react';
import { TurnstileWidget } from '@/components/TurnstileWidget';

const REASONS = [
  'Not actually accredited / no PIN or SRA',
  'Probationary representative / trainee / unaccredited',
  'Impersonation of another person',
  'Inaccurate contact details',
  'Inaccurate station / county coverage',
  'Spam, fake listing, or duplicate',
  'Other',
];

export function ReportProfileButton({
  targetSlug,
  targetEmail,
  turnstileSiteKey = null,
}: {
  targetSlug: string;
  targetEmail?: string;
  turnstileSiteKey?: string | null;
}) {
  const [open, setOpen] = useState(false);
  const [reporterName, setReporterName] = useState('');
  const [reporterEmail, setReporterEmail] = useState('');
  const [reason, setReason] = useState('');
  const [details, setDetails] = useState('');
  const [hp, setHp] = useState('');
  const [status, setStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);
  const [turnstileToken, setTurnstileToken] = useState('');
  const handleTurnstileToken = useCallback((t: string) => setTurnstileToken(t), []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (hp) return;
    setError(null);
    if (!reporterName.trim() || !reporterEmail.trim() || !reason || !details.trim()) {
      setStatus('error');
      setError('Please complete every field before submitting.');
      return;
    }
    if (turnstileSiteKey && !turnstileToken) {
      setStatus('error');
      setError('Please complete the bot-protection check before submitting.');
      return;
    }
    setStatus('sending');
    try {
      const res = await fetch('/api/report-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetSlug,
          targetEmail,
          reporterName: reporterName.trim(),
          reporterEmail: reporterEmail.trim().toLowerCase(),
          reason,
          details: details.trim(),
          turnstileToken,
          _hp: hp,
        }),
      });
      const out = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string };
      if (res.ok && out.ok) {
        setStatus('success');
        return;
      }
      setStatus('error');
      setError(out.error || 'Could not send report.');
    } catch {
      setStatus('error');
      setError('Could not send report. Please try again.');
    }
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-700 transition-colors hover:bg-red-100"
      >
        Report this profile
      </button>
    );
  }

  if (status === 'success') {
    return (
      <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-800">
        Thank you. Your report has been logged. An admin will review it and may contact you for
        further detail.
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3 rounded-lg border border-red-200 bg-red-50 p-3">
      <p className="text-xs font-semibold text-red-800">Report this profile</p>
      <div
        aria-hidden="true"
        style={{ position: 'absolute', left: '-9999px', top: '-9999px', height: 0, width: 0, overflow: 'hidden', opacity: 0 }}
      >
        <label htmlFor="report-website">Website</label>
        <input
          id="report-website"
          name="website"
          type="text"
          tabIndex={-1}
          autoComplete="nope"
          value={hp}
          onChange={(e) => setHp(e.target.value)}
        />
      </div>
      <input
        type="text"
        required
        placeholder="Your name"
        value={reporterName}
        onChange={(e) => setReporterName(e.target.value)}
        className="w-full rounded-md border border-red-200 bg-white px-3 py-2 text-xs"
      />
      <input
        type="email"
        required
        placeholder="Your email"
        value={reporterEmail}
        onChange={(e) => setReporterEmail(e.target.value)}
        className="w-full rounded-md border border-red-200 bg-white px-3 py-2 text-xs"
      />
      <select
        required
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        className="w-full rounded-md border border-red-200 bg-white px-3 py-2 text-xs"
      >
        <option value="">Select a reason</option>
        {REASONS.map((r) => (
          <option key={r} value={r}>
            {r}
          </option>
        ))}
      </select>
      <textarea
        rows={3}
        required
        placeholder="Details (please include any specifics that help us investigate)"
        value={details}
        onChange={(e) => setDetails(e.target.value)}
        className="w-full rounded-md border border-red-200 bg-white px-3 py-2 text-xs"
      />
      {turnstileSiteKey && (
        <TurnstileWidget siteKey={turnstileSiteKey} onToken={handleTurnstileToken} />
      )}
      {error && <p className="text-xs text-red-700">{error}</p>}
      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="rounded-md border border-red-200 bg-white px-3 py-1.5 text-xs"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={status === 'sending'}
          className="rounded-md bg-red-600 px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-60"
        >
          {status === 'sending' ? 'Sending…' : 'Send report'}
        </button>
      </div>
    </form>
  );
}
