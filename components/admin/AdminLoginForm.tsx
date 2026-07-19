'use client';

import { useState } from 'react';
import Link from 'next/link';

type Stage = 'email' | 'otp' | 'checking';

const DEFAULT_ADMIN_EMAIL = 'robertdavidcashman@gmail.com';

export function AdminLoginForm() {
  const [stage, setStage] = useState<Stage>('email');
  const [email, setEmail] = useState(DEFAULT_ADMIN_EMAIL);
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function handleSendCode(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    const trimmed = email.trim().toLowerCase();
    if (!trimmed || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      setError('Please enter a valid admin email address.');
      return;
    }
    setBusy(true);
    try {
      const res = await fetch('/api/auth/send-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: trimmed }),
      });
      const data = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok) {
        setError(data.error || 'Could not send login code. Please try again.');
        return;
      }
      setStage('otp');
    } catch {
      setError('Could not send login code. Please try again.');
    } finally {
      setBusy(false);
    }
  }

  async function handleVerifyCode(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    const code = otp.trim();
    if (!code || code.length < 6) {
      setError('Please enter the 6-digit code from your email.');
      return;
    }
    setBusy(true);
    setStage('checking');
    try {
      const res = await fetch('/api/auth/verify-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim().toLowerCase(), code }),
      });
      const data = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok) {
        setError(data.error || 'Verification failed. Please try again.');
        setStage('otp');
        return;
      }
      window.location.reload();
    } catch {
      setError('Verification failed. Please try again.');
      setStage('otp');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-md rounded-xl border border-[var(--card-border)] bg-white p-8 shadow-sm">
      <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--gold)]">Admin</p>
      <h2 className="mt-1 text-xl font-bold text-[var(--navy)]">Sign in to admin</h2>
      <p className="mt-2 text-sm text-[var(--muted)]">
        We&rsquo;ll email a one-time magic code. Password sign-in is disabled. Admin sessions last
        1 hour.
      </p>

      {stage === 'email' && (
        <form onSubmit={handleSendCode} className="mt-6 space-y-4">
          <div>
            <label htmlFor="admin-email" className="block text-sm font-medium text-[var(--navy)]">
              Admin email
            </label>
            <input
              id="admin-email"
              type="email"
              autoComplete="username"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 w-full rounded-[var(--radius)] border border-[var(--border)] px-4 py-2.5 text-sm outline-none focus:border-[var(--gold)] focus:ring-2 focus:ring-[var(--gold)]/20"
            />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button type="submit" disabled={busy} className="btn-gold w-full !text-sm disabled:opacity-60">
            {busy ? 'Sending code…' : 'Email me a magic code'}
          </button>
        </form>
      )}

      {(stage === 'otp' || stage === 'checking') && (
        <form onSubmit={handleVerifyCode} className="mt-6 space-y-4">
          <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3">
            <p className="text-sm font-medium text-emerald-800">Check your email for a login code.</p>
            <p className="mt-1 text-xs text-emerald-700">
              We sent a 6-digit code to <strong>{email.trim()}</strong>. It may take a minute to
              arrive.
            </p>
          </div>
          <div>
            <label htmlFor="admin-otp" className="block text-sm font-medium text-[var(--navy)]">
              Magic code
            </label>
            <input
              id="admin-otp"
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              required
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="123456"
              className="mt-1 w-full rounded-[var(--radius)] border border-[var(--border)] px-4 py-2.5 text-center text-lg tracking-[0.3em] outline-none focus:border-[var(--gold)] focus:ring-2 focus:ring-[var(--gold)]/20"
            />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button type="submit" disabled={busy} className="btn-gold w-full !text-sm disabled:opacity-60">
            {stage === 'checking' || busy ? 'Verifying…' : 'Sign in'}
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => {
              setStage('email');
              setOtp('');
              setError('');
            }}
            className="w-full text-sm font-semibold text-[var(--navy)] underline disabled:opacity-60"
          >
            Use a different email
          </button>
        </form>
      )}

      <p className="mt-4 text-center text-xs text-[var(--muted)]">
        Reps can still use{' '}
        <Link href="/Account" className="font-semibold text-[var(--navy)] underline">
          magic-code sign-in
        </Link>
        .
      </p>
    </div>
  );
}
