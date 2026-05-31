'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export function CookieBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const accepted = localStorage.getItem('cookies-accepted');
    if (!accepted) setVisible(true);
  }, []);

  const accept = () => {
    localStorage.setItem('cookies-accepted', 'true');
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div
      className="psr-cookie-bar fixed bottom-0 left-0 right-0 z-50 border-t border-[var(--border)] bg-white/95 px-[var(--container-gutter)] py-1 shadow-md backdrop-blur supports-[backdrop-filter]:bg-white/85 sm:px-6 sm:py-3 lg:px-8 lg:py-4"
      style={{ paddingBottom: 'max(0.25rem, var(--safe-area-bottom))' }}
    >
      <div className="mx-auto flex max-w-[var(--container-max)] flex-wrap items-center justify-between gap-1.5 sm:flex-nowrap sm:gap-3">
        <div className="flex min-w-0 items-center gap-1.5 sm:gap-3">
          <span className="text-[11px] font-bold leading-none text-[var(--navy)] sm:text-sm">Cookies</span>
          <span className="hidden text-xs text-[var(--muted)] sm:inline sm:text-sm">
            Essential + analytics.
          </span>
        </div>
        <div className="flex shrink-0 items-center gap-1 sm:gap-3">
          <Link
            href="/Cookies"
            className="inline-flex min-h-[32px] items-center justify-center rounded-md border border-[var(--border)] px-2 py-0.5 text-[11px] font-medium leading-none text-[var(--navy)] no-underline transition-colors hover:border-[var(--gold)] sm:min-h-[44px] sm:rounded-lg sm:px-4 sm:py-2 sm:text-sm"
          >
            Manage
          </Link>
          <button
            type="button"
            onClick={accept}
            className="inline-flex min-h-[32px] items-center justify-center rounded-md bg-[var(--navy)] px-2.5 py-0.5 text-[11px] font-semibold leading-none text-white transition-colors hover:bg-[var(--navy-light)] sm:min-h-[44px] sm:rounded-lg sm:px-4 sm:py-2 sm:text-sm"
          >
            Accept
          </button>
        </div>
      </div>
    </div>
  );
}
