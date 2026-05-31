'use client';

import Link from 'next/link';
import type { ReactNode } from 'react';
import { useState, useRef, useEffect } from 'react';
import { SITE_URL } from '@/lib/seo-layer/config';
import { SCROLL_HIDE_PX, shouldCompactHeader } from '@/lib/promo-banner-scroll';
import {
  HEADER_NAV_DROPDOWNS,
  HEADER_NAV_PRIMARY,
  HEADER_SHARE_LABEL,
  HEADER_SHARE_LABEL_COPIED,
  HEADER_MOBILE_CTA_HREF,
  HEADER_MOBILE_CTA_TEXT,
  HEADER_HELP_HREF,
  HEADER_LOGIN_HREF,
  type HeaderNavLink,
} from '@/lib/site-navigation';

function ShareIcon({ className }: { className?: string }) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden
      className={className}
    >
      <circle cx="18" cy="5" r="3" />
      <circle cx="6" cy="12" r="3" />
      <circle cx="18" cy="19" r="3" />
      <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
      <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
    </svg>
  );
}

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

function NavDropdown({
  label,
  links,
  linkClass,
}: {
  label: string;
  links: HeaderNavLink[];
  linkClass: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    if (open) document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false);
    }
    if (open) document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open]);

  return (
    <div ref={ref} className="relative shrink-0">
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setOpen((v) => !v);
        }}
        className={`${linkClass} ${open ? '!bg-[var(--navy-light)] ring-1 ring-[var(--gold)]/40' : ''}`}
        aria-expanded={open}
        aria-haspopup="true"
      >
        {label}
        <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden className="ml-1">
          <path d="M2.5 4L5 6.5L7.5 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      </button>
      {open && (
        <div className="absolute left-0 top-full z-[100] mt-1 max-h-[min(70vh,24rem)] min-w-[15rem] overflow-y-auto rounded-lg border border-[var(--navy-light)] bg-[var(--navy)] py-1 shadow-xl sm:min-w-[17rem]">
          <p className="px-4 py-1.5 text-[10px] font-bold uppercase tracking-wider text-white/50">{label}</p>
          {links.map((link) => (
            <NavItem
              key={`${link.href}-${link.text}`}
              href={link.href}
              external={link.external ?? link.href.startsWith('http')}
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
  const [compact, setCompact] = useState(false);

  useEffect(() => {
    const onScroll = () => setCompact(shouldCompactHeader(window.scrollY, SCROLL_HIDE_PX));
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

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
    'inline-flex shrink-0 min-h-[var(--header-touch-compact)] items-center whitespace-nowrap rounded-lg px-2 py-1 text-xs font-semibold leading-snug !text-white no-underline transition-colors hover:bg-[var(--navy-light)] hover:!text-[var(--gold)] lg:text-[13px] xl:min-h-[2.25rem] xl:px-2.5 xl:py-1.5 xl:text-sm';

  const drawerLinkClass =
    'flex min-h-[var(--chrome-touch-drawer)] items-center rounded-lg px-3 py-2.5 text-sm font-medium !text-[var(--header-link)] no-underline transition-colors hover:bg-[var(--navy-light)] hover:!text-[var(--header-link-hover)]';

  return (
    <header
      className={`site-header relative z-30 overflow-x-clip border-b border-[var(--navy-light)] bg-[var(--navy)] shadow-lg ${compact ? 'header-compact' : ''}`}
    >
      <div className="header-row mx-auto flex max-w-7xl items-center justify-between gap-1.5 px-4 py-1 sm:gap-2 sm:px-6 sm:py-1.5 md:grid md:grid-cols-[auto_minmax(0,1fr)_auto] md:items-center md:gap-x-3 lg:px-8">
        <div className="flex min-w-0 items-center gap-2 lg:min-w-0 lg:gap-3">
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-label={open ? 'Close menu' : 'Open menu'}
            aria-expanded={open}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[var(--navy-light)] text-white transition-colors hover:bg-[var(--navy)] hover:ring-1 hover:ring-[var(--gold)]/40 md:hidden"
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
          </button>

          <Link
            href="/"
            aria-label="PoliceStationRepUK home"
            className="flex min-w-0 shrink-0 items-center gap-2 no-underline"
          >
            <span
              className="header-logo-mark flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[var(--gold)] text-sm font-bold lg:h-8 lg:w-8"
              aria-hidden
            >
              ⚖️
            </span>
            <span className="header-site-name hidden text-sm font-bold tracking-tight text-white sm:inline lg:text-base">
              PoliceStationRep<span className="text-[var(--gold)]">UK</span>
            </span>
          </Link>
        </div>

        <div className="hidden min-w-0 flex-1 justify-center px-1 md:flex">
          <nav
            className="flex flex-wrap items-center justify-center gap-0.5 xl:gap-1"
            aria-label="Main navigation"
          >
            {HEADER_NAV_PRIMARY.map((link) => (
              <NavItem
                key={`${link.href}-${link.text}`}
                href={link.href}
                className={desktopNavLinkClass}
                external={link.external ?? link.href.startsWith('http')}
              >
                {link.text}
              </NavItem>
            ))}
            {HEADER_NAV_DROPDOWNS.map((group) => (
              <NavDropdown
                key={group.label}
                label={group.label}
                links={group.links}
                linkClass={desktopNavLinkClass}
              />
            ))}
          </nav>
        </div>

        <div className="flex shrink-0 items-center gap-1 pl-0.5 md:justify-self-end md:gap-1.5 md:pl-2">
          <button
            type="button"
            onClick={handleShare}
            className="psr-share-mini inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-white/90 transition-colors hover:bg-[var(--navy-light)] hover:text-[var(--gold)] xl:h-auto xl:w-auto xl:gap-1.5 xl:px-2 xl:py-1"
            aria-label={shareOpen ? HEADER_SHARE_LABEL_COPIED : HEADER_SHARE_LABEL}
            title={shareOpen ? HEADER_SHARE_LABEL_COPIED : HEADER_SHARE_LABEL}
          >
            <ShareIcon />
            <span className="hidden text-xs font-medium xl:inline">
              {shareOpen ? 'Copied!' : 'Share'}
            </span>
          </button>
          <Link
            href={HEADER_HELP_HREF}
            className="hidden min-h-[var(--header-touch-compact)] shrink-0 items-center px-2 text-xs font-medium !text-white/80 no-underline transition-colors hover:!text-[var(--gold)] xl:inline-flex xl:text-sm"
          >
            Help
          </Link>
          <Link
            href={HEADER_LOGIN_HREF}
            className="inline-flex h-8 min-h-[2rem] shrink-0 items-center gap-1 rounded-lg bg-[var(--gold)] px-2 py-0.5 text-xs font-bold text-[var(--navy)] shadow-sm no-underline transition-colors hover:bg-[var(--gold-hover)] sm:px-2.5 lg:h-9 lg:px-3 lg:text-sm"
          >
            Log In
            <span aria-hidden className="text-sm leading-none">→</span>
          </Link>
        </div>
      </div>

      {open && (
        <div className="max-h-[80vh] overflow-y-auto border-t border-[var(--navy-light)] bg-[var(--navy)] md:hidden">
          <nav className="flex flex-col px-4 py-3 sm:px-5" aria-label="Mobile navigation">
            <p className="mb-1 px-3 text-[10px] font-bold uppercase tracking-wider text-white/50">Main</p>
            {HEADER_NAV_PRIMARY.map((link) => (
              <NavItem
                key={`${link.href}-${link.text}`}
                href={link.href}
                external={link.external ?? link.href.startsWith('http')}
                onNavigate={() => setOpen(false)}
                className={drawerLinkClass}
              >
                {link.text}
              </NavItem>
            ))}

            {HEADER_NAV_DROPDOWNS.map((group) => (
              <div key={group.label} className="mt-3 border-t border-[var(--navy-light)] pt-3">
                <p className="mb-1 px-3 text-[10px] font-bold uppercase tracking-wider text-white/50">
                  {group.label}
                </p>
                {group.links.map((link) => (
                  <NavItem
                    key={`${group.label}-${link.href}`}
                    href={link.href}
                    external={link.external ?? link.href.startsWith('http')}
                    onNavigate={() => setOpen(false)}
                    className={drawerLinkClass}
                  >
                    {link.text}
                  </NavItem>
                ))}
              </div>
            ))}

            <div className="mt-3 grid gap-2 border-t border-[var(--navy-light)] pt-3">
              <Link href={HEADER_HELP_HREF} onClick={() => setOpen(false)} className={drawerLinkClass}>
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
  );
}
