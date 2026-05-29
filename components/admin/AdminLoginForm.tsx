'use client';

import { useState } from 'react';
import Link from 'next/link';

export function AdminLoginForm() {
  const [email, setEmail] = useState('robertdavidcashman@gmail.com');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      const res = await fetch('/api/auth/admin-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim().toLowerCase(), password }),
      });
      const data = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok || !data.ok) {
        setError(data.error ?? 'Sign-in failed.');
        return;
      }
      window.location.reload();
    } catch {
      setError('Sign-in failed. Please try again.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-md rounded-xl border border-[var(--card-border)] bg-white p-8 shadow-sm">
      <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--gold)]">Admin</p>
      <h2 className="mt-1 text-xl font-bold text-[var(--navy)]">Sign in to admin</h2>
      <p className="mt-2 text-sm text-[var(--muted)]">
        Combined admin for rep verification and the Legal Services Directory.
      </p>
      <form onSubmit={onSubmit} className="mt-6 space-y-4">
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
        <div>
          <label htmlFor="admin-password" className="block text-sm font-medium text-[var(--navy)]">
            Password
          </label>
          <input
            id="admin-password"
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1 w-full rounded-[var(--radius)] border border-[var(--border)] px-4 py-2.5 text-sm outline-none focus:border-[var(--gold)] focus:ring-2 focus:ring-[var(--gold)]/20"
          />
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button type="submit" disabled={busy} className="btn-gold w-full !text-sm disabled:opacity-60">
          {busy ? 'Signing in…' : 'Sign in'}
        </button>
      </form>
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
