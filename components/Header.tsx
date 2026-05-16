'use client';

import Link from 'next/link';
import type { ReactNode } from 'react';
import { useState, useRef, useEffect } from 'react';
import { SITE_URL } from '@/lib/seo-layer/config';
import {
  PRIMARY_NAV,
  HEADER_SHARE_LABEL,
  HEADER_SHARE_LABEL_COPIED,
  HEADER_MOBILE_CTA_HREF,
  HEADER_MOBILE_CTA_TEXT,
  HEADER_HELP_HREF,
  HEADER_LOGIN_HREF,
} from '@/lib/site-navigation';

/** Fewer inline links between lg and xl (1280px) so the bar does not need horizontal scroll. */
const DESKTOP_NAV_COMPACT_PRIMARY = 5;
const DESKTOP_NAV_FULL_PRIMARY = 7;

function NavItem({
  href,
  children,
  className,
  onNavigate,
  external,
}: {
  href: string;
  children: ReactNode;
  className: string;
  onNavigate?: () => void;
  external?: boolean;
}) {
  if (external) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className={className}
        onClick={onNavigate}
      >
        {children}
      </a>
    );
  }
  return (
    <Link href={href} className={className} onClick={onNavigate}>
      {children}
    </Link>
  );
}

function MoreDropdown({ links, linkClass }: { links: ReadonlyArray<{ href: string; text: string }>; linkClass: string }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    if (open) document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, [open]);

  return (
    <div ref={ref} className="relative shrink-0">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={linkClass}
        aria-expanded={open}
        aria-haspopup="true"
      >
        More
        <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden className="ml-1">
          <path d="M2.5 4L5 6.5L7.5 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      </button>
      {open && (
        <div className="absolute right-0 top-full z-50 mt-1 min-w-[200px] rounded-lg border border-[var(--navy-light)] bg-[var(--navy)] py-1 shadow-xl">
          {links.map((link) => (
            <NavItem
              key={`${link.href}-${link.text}`}
              href={link.href}
              external={link.href.startsWith('http')}
              onNavigate={() => setOpen(false)}
              className="flex min-h-[40px] items-center px-4 py-2 text-sm font-medium !text-white no-underline transition-colors hover:bg-[var(--navy-light)] hover:!text-[var(--gold)]"
            >
              {link.text}
            </NavItem>
          ))}
        </div>
      )}
    </div>
  );
}

export function Header() {
  const [open, setOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  /** false until mounted = SSR + first paint match; then xl+ uses full primary count. */
  const [wideDesktopNav, setWideDesktopNav] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia('(min-width: 1280px)');
    const sync = () => setWideDesktopNav(mq.matches);
    sync();
    mq.addEventListener('change', sync);
    return () => mq.removeEventListener('change', sync);
  }, []);

  const desktopPrimaryCount = wideDesktopNav
    ? DESKTOP_NAV_FULL_PRIMARY
    : DESKTOP_NAV_COMPACT_PRIMARY;
  const desktopNavPrimary = PRIMARY_NAV.slice(0, desktopPrimaryCount);
  const desktopNavMore = PRIMARY_NAV.slice(desktopPrimaryCount);

  const handleShare = async () => {
    const url = typeof window !== 'undefined' ? window.location.href : SITE_URL;
    if (navigator.share) {
      try {
        await navigator.share({ title: 'PoliceStationRepUK', url });
      } catch {
        /* user cancelled */
      }
    } else {
      await navigator.clipboard.writeText(url);
      setShareOpen(true);
      setTimeout(() => setShareOpen(false), 2000);
    }
  };

  const desktopNavLinkClass =
    'inline-flex shrink-0 min-h-[44px] items-center rounded-lg px-2.5 py-2 text-[13px] font-semibold leading-snug !text-white no-underline transition-colors hover:bg-[var(--navy-light)] hover:!text-[var(--gold)] xl:px-3 xl:text-sm whitespace-nowrap';

  return (
    <>
      <header className="relative z-30 border-b border-[var(--navy-light)] bg-[var(--navy)] shadow-lg">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-2 px-4 py-2 sm:py-2.5 sm:px-6 lg:grid lg:grid-cols-[auto_minmax(0,1fr)_auto] lg:items-center lg:justify-normal lg:gap-x-3 lg:px-8">
          <div className="flex min-w-0 items-center gap-3 lg:min-w-0">
            <button
              type="button"
              onClick={() => setOpen((v) => !v)}
              aria-label={open ? 'Close menu' : 'Open menu'}
              aria-expanded={open}
              className="flex min-h-[44px] shrink-0 items-center gap-2 rounded-lg border-2 border-white/30 bg-[var(--navy-light)] px-3 py-2 text-sm font-bold text-white shadow-sm transition-colors hover:border-[var(--gold)] hover:bg-[var(--navy)] lg:hidden"
            >
              {open ? (
                <svg width="18" height="18" viewBox="0 0 20 20" fill="none" aria-hidden>
                  <path d="M5 5l10 10M15 5L5 15" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
                </svg>
              ) : (
                <svg width="18" height="18" viewBox="0 0 20 20" fill="none" aria-hidden>
                  <path d="M3 5h14M3 10h14M3 15h14" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
                </svg>
              )}
              <span className="hidden sm:inline">Menu</span>
            </button>

            <Link
              href="/"
              aria-label="PoliceStationRepUK home"
              className="flex min-w-0 shrink-0 items-center gap-2.5 no-underline"
            >
              <span
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[var(--gold)] text-base font-bold"
                aria-hidden
              >
                ⚖️
              </span>
              <span className="hidden text-sm font-bold tracking-tight text-white sm:inline lg:text-base">
                PoliceStationRep<span className="text-[var(--gold)]">UK</span>
              </span>
            </Link>
          </div>

          <div className="hidden min-w-0 justify-center px-1 lg:flex">
            <nav
              className="flex min-w-0 max-w-full items-center gap-0.5"
              aria-label="Main navigation"
            >
              {desktopNavPrimary.map((link) => (
                <NavItem
                  key={`${link.href}-${link.text}`}
                  href={link.href}
                  className={desktopNavLinkClass}
                  external={link.href.startsWith('http')}
                >
                  {link.text}
                </NavItem>
              ))}
              {desktopNavMore.length > 0 && (
                <MoreDropdown links={desktopNavMore} linkClass={desktopNavLinkClass} />
              )}
            </nav>
          </div>

          <div className="flex shrink-0 items-center gap-2 lg:justify-self-end">
            <Link
              href={HEADER_HELP_HREF}
              className="hidden min-h-[44px] items-center px-2 text-sm font-medium !text-white/80 no-underline transition-colors hover:!text-[var(--gold)] lg:inline-flex"
            >
              Help
            </Link>
            <Link
              href={HEADER_LOGIN_HREF}
              className="inline-flex min-h-[36px] items-center gap-1 rounded-lg bg-[var(--gold)] px-2.5 py-1 text-xs font-bold text-[var(--navy)] shadow-sm no-underline transition-colors hover:bg-[var(--gold-hover)] sm:min-h-[40px] sm:gap-1.5 sm:px-3.5 sm:py-2 sm:text-sm"
            >
              Log In
              <span aria-hidden className="text-sm leading-none sm:text-base">→</span>
            </Link>
          </div>
        </div>

        {/* Share strip */}
        <div className="border-t border-[var(--navy-light)] bg-white">
          <div className="mx-auto flex max-w-7xl items-center justify-center gap-2 px-4 py-px sm:px-6 sm:py-1 lg:px-8">
            <button
              type="button"
              onClick={handleShare}
              className="psr-share-mini inline-flex min-h-[28px] items-center gap-1 rounded-md px-1.5 py-0 text-[11px] font-medium leading-none text-[var(--navy)] transition-colors hover:bg-slate-100 sm:min-h-[36px] sm:gap-2 sm:rounded-lg sm:px-2 sm:py-0.5 sm:text-sm"
              aria-label={HEADER_SHARE_LABEL}
            >
              <svg
                width="11"
                height="11"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                aria-hidden
                className="sm:h-[14px] sm:w-[14px]"
              >
                <circle cx="18" cy="5" r="3" />
                <circle cx="6" cy="12" r="3" />
                <circle cx="18" cy="19" r="3" />
                <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
                <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
              </svg>
              <span className="sm:hidden">{shareOpen ? 'Copied!' : 'Share'}</span>
              <span className="hidden sm:inline">
                {shareOpen ? HEADER_SHARE_LABEL_COPIED : HEADER_SHARE_LABEL}
              </span>
            </button>
          </div>
        </div>

        {/* Mobile drawer */}
        {open && (
          <div className="max-h-[80vh] overflow-y-auto border-t border-[var(--navy-light)] bg-[var(--navy)] lg:hidden">
            <nav className="flex flex-col px-4 py-3 sm:px-5" aria-label="Mobile navigation">
              {PRIMARY_NAV.map((link) => (
            <NavItem
              key={`${link.href}-${link.text}`}
              href={link.href}
              external={link.href.startsWith('http')}
              onNavigate={() => setOpen(false)}
              className="flex min-h-[44px] items-center rounded-lg px-3 py-2.5 text-sm font-medium !text-[var(--header-link)] no-underline transition-colors hover:bg-[var(--navy-light)] hover:!text-[var(--header-link-hover)]"
            >
              {link.text}
            </NavItem>
              ))}
              <div className="mt-3 grid gap-2 border-t border-[var(--navy-light)] pt-3">
                <Link
                  href={HEADER_HELP_HREF}
                  onClick={() => setOpen(false)}
                  className="flex min-h-[44px] items-center rounded-lg px-3 py-2.5 text-sm font-medium !text-[var(--header-link)] no-underline transition-colors hover:bg-[var(--navy-light)] hover:!text-[var(--header-link-hover)]"
                >
                  Help
                </Link>
                <Link
                  href={HEADER_MOBILE_CTA_HREF}
                  onClick={() => setOpen(false)}
                  className="btn-gold block w-full text-center !text-sm"
                >
                  {HEADER_MOBILE_CTA_TEXT}
                </Link>
              </div>
            </nav>
          </div>
        )}
      </header>
    </>
  );
}
