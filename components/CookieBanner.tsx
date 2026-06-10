'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

const COOKIE_ACCEPTED_KEY = 'cookies-accepted';

export function CookieBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const accepted = localStorage.getItem(COOKIE_ACCEPTED_KEY);
    if (!accepted) setVisible(true);
  }, []);

  useEffect(() => {
    if (!visible) {
      document.body.classList.remove('cookie-bar-visible');
      return;
    }
    document.body.classList.add('cookie-bar-visible');
    return () => document.body.classList.remove('cookie-bar-visible');
  }, [visible]);

  const accept = () => {
    localStorage.setItem(COOKIE_ACCEPTED_KEY, 'true');
    setVisible(false);
    document.body.classList.remove('cookie-bar-visible');
    const gaId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID?.trim();
    if (gaId && typeof window.gtag === 'function') {
      window.gtag('config', gaId, { anonymize_ip: true });
    }
  };

  if (!visible) return null;

  return (
    <div
      data-hook="cookie-banner"
      className="cookie-bar-compact psr-cookie-bar fixed bottom-0 left-0 right-0 z-50 border-t border-[var(--border)] bg-white shadow-md"
      style={{ paddingBottom: 'max(0.5rem, var(--safe-area-bottom))' }}
      role="dialog"
      aria-label="Cookie consent"
    >
      <div className="mx-auto flex max-w-[var(--container-max)] flex-wrap items-center justify-between gap-2 px-[var(--container-gutter)] py-2 sm:flex-nowrap sm:px-6 lg:px-8">
        <p className="min-w-0 text-xs leading-snug text-[var(--muted)] sm:text-sm">
          <span className="font-bold text-[var(--navy)]">Cookies.</span> Essential cookies only — see our{' '}
          <Link href="/Cookies" className="font-semibold !text-[var(--navy)] no-underline hover:!text-[var(--gold-link)]">
            cookie policy
          </Link>
          .
        </p>
        <div className="flex w-full shrink-0 items-center gap-2 sm:w-auto">
          <Link
            href="/Cookies"
            className="inline-flex h-9 flex-1 items-center justify-center rounded-md border border-[var(--border)] px-3 text-xs font-semibold text-[var(--navy)] no-underline transition-colors hover:border-[var(--gold)] sm:flex-none sm:text-sm"
          >
            Manage
          </Link>
          <button
            type="button"
            onClick={accept}
            className="inline-flex h-9 flex-1 items-center justify-center rounded-md bg-[var(--navy)] px-4 text-xs font-semibold text-white transition-colors hover:bg-[var(--navy-light)] sm:flex-none sm:text-sm"
          >
            Accept
          </button>
        </div>
      </div>
    </div>
  );
}
