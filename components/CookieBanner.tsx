'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { SCROLL_HIDE_PX, shouldUseCookiePill } from '@/lib/promo-banner-scroll';

const COOKIE_ACCEPTED_KEY = 'cookies-accepted';

export function CookieBanner() {
  const [visible, setVisible] = useState(false);
  const [pillMode, setPillMode] = useState(false);
  const scrolledPastRef = useRef(false);

  useEffect(() => {
    const accepted = localStorage.getItem(COOKIE_ACCEPTED_KEY);
    if (!accepted) setVisible(true);
  }, []);

  useEffect(() => {
    if (!visible) {
      document.body.classList.remove('cookie-bar-visible', 'cookie-bar-pill');
      return;
    }

    const onScroll = () => {
      if (shouldUseCookiePill(window.scrollY, SCROLL_HIDE_PX)) {
        scrolledPastRef.current = true;
      }
      const usePill = scrolledPastRef.current;
      setPillMode(usePill);
      document.body.classList.toggle('cookie-bar-pill', usePill);
      document.body.classList.add('cookie-bar-visible');
    };

    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      document.body.classList.remove('cookie-bar-visible', 'cookie-bar-pill');
    };
  }, [visible]);

  const accept = () => {
    localStorage.setItem(COOKIE_ACCEPTED_KEY, 'true');
    setVisible(false);
    document.body.classList.remove('cookie-bar-visible', 'cookie-bar-pill');
  };

  if (!visible) return null;

  if (pillMode) {
    return (
      <div
        className="cookie-bar-pill fixed-ui-left fixed-ui-bottom z-50 flex max-w-[calc(100vw-2rem-var(--safe-area-left)-var(--safe-area-right))] items-center gap-2 rounded-full border border-[var(--border)] bg-white/95 py-1 pl-3 pr-1 shadow-lg backdrop-blur supports-[backdrop-filter]:bg-white/90"
        role="dialog"
        aria-label="Cookie consent"
      >
        <Link
          href="/Cookies"
          className="truncate text-xs font-semibold !text-[var(--navy)] no-underline hover:!text-[var(--gold-link)]"
        >
          Cookies
        </Link>
        <span className="text-xs text-[var(--muted)]" aria-hidden>
          ·
        </span>
        <button
          type="button"
          onClick={accept}
          className="inline-flex h-8 shrink-0 items-center justify-center rounded-full bg-[var(--navy)] px-3 text-xs font-semibold text-white transition-colors hover:bg-[var(--navy-light)]"
        >
          Accept
        </button>
      </div>
    );
  }

  return (
    <div
      className="cookie-bar-compact psr-cookie-bar fixed bottom-0 left-0 right-0 z-50 border-t border-[var(--border)] bg-white/95 shadow-md backdrop-blur supports-[backdrop-filter]:bg-white/85"
      style={{ paddingBottom: 'max(0.375rem, var(--safe-area-bottom))' }}
      role="dialog"
      aria-label="Cookie consent"
    >
      <div className="mx-auto flex max-w-[var(--container-max)] items-center justify-between gap-2 px-[var(--container-gutter)] py-1.5 sm:px-6 lg:px-8">
        <div className="flex min-w-0 items-center gap-2">
          <Link
            href="/Cookies"
            className="shrink-0 text-xs font-bold !text-[var(--navy)] no-underline hover:!text-[var(--gold-link)] sm:text-sm"
          >
            Cookies
          </Link>
          <span className="hidden text-xs text-[var(--muted)] sm:inline">Essential cookies only.</span>
        </div>
        <button
          type="button"
          onClick={accept}
          className="inline-flex h-8 shrink-0 items-center justify-center rounded-md bg-[var(--navy)] px-3 text-xs font-semibold text-white transition-colors hover:bg-[var(--navy-light)] sm:h-9 sm:px-4 sm:text-sm"
        >
          Accept
        </button>
      </div>
    </div>
  );
}
