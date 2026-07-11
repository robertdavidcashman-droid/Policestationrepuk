'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';
import { useState, useRef, useEffect } from 'react';
import { SITE_URL } from '@/lib/seo-layer/config';
import { SCROLL_HIDE_PX, shouldCompactHeader } from '@/lib/promo-banner-scroll';
import {
  HEADER_NAV_BLOG_LINKS,
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
import { HeaderAskAiButton } from '@/components/assistant/HeaderAskAiButton';

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
  active,
  wide,
  labelHref,
}: {
  label: string;
  links: HeaderNavLink[];
  linkClass: string;
  active?: boolean;
  wide?: boolean;
  labelHref?: string;
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

  const activeClass =
    open || active ? '!bg-[var(--navy-light)] ring-1 ring-[var(--gold)]/40' : '';
  const activeText = active && !open ? '!text-[var(--gold)]' : '';

  return (
    <div ref={ref} className="relative shrink-0">
      {labelHref ? (
        <div className={`inline-flex items-stretch rounded-lg ${activeClass}`}>
          <Link
            href={labelHref}
            className={`${linkClass} rounded-r-none !ring-0 ${activeText}`}
            onClick={() => setOpen(false)}
          >
            {label}
          </Link>
          <button
            type="button"
            onMouseDown={(e) => {
              e.stopPropagation();
            }}
            onClick={(e) => {
              e.stopPropagation();
              setOpen((v) => !v);
            }}
            className={`${linkClass} rounded-l-none border-l border-white/15 px-1.5 !ring-0 ${activeText}`}
            aria-expanded={open}
            aria-haspopup="true"
            aria-label={`${label} topics`}
          >
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden>
              <path d="M2.5 4L5 6.5L7.5 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
        </div>
      ) : (
        <button
          type="button"
          onMouseDown={(e) => {
            e.stopPropagation();
          }}
          onClick={(e) => {
            e.stopPropagation();
            setOpen((v) => !v);
          }}
          className={`${linkClass} ${activeClass} ${activeText}`}
          aria-expanded={open}
          aria-haspopup="true"
        >
          {label}
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden className="ml-1">
            <path d="M2.5 4L5 6.5L7.5 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </button>
      )}
      {open && (
        <div
          className={`absolute left-0 top-full z-[200] mt-1 max-h-[min(70vh,28rem)] overflow-y-auto rounded-lg border border-[var(--navy-light)] bg-[var(--navy)] py-1 shadow-xl ${
            wide ? 'min-w-[18rem] sm:min-w-[20rem]' : 'min-w-[15rem] sm:min-w-[17rem]'
          }`}
        >
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
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [compact, setCompact] = useState(false);
  const mobileDropdowns = HEADER_NAV_DROPDOWNS.filter((group) => group.label !== 'Blog');

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
    'inline-flex shrink-0 min-h-[var(--header-touch-compact)] items-center whitespace-nowrap rounded-lg px-2 py-1 text-xs font-semibold leading-snug !text-white no-underline transition-colors hover:bg-[var(--navy-light)] hover:!text-[var(--gold)] xl:min-h-[2.25rem] xl:px-2.5 xl:py-1.5 xl:text-sm';

  const navLinkClass = (href: string, prefix = false) => {
    const active =
      href === '/'
        ? pathname === '/'
        : prefix
          ? pathname === href || pathname.startsWith(`${href}/`)
          : pathname === href;
    return active
      ? `${desktopNavLinkClass} !bg-[var(--navy-light)] ring-1 ring-[var(--gold)]/40 !text-[var(--gold)]`
      : desktopNavLinkClass;
  };

  const isBlogActive = pathname === '/Blog' || pathname.startsWith('/Blog/');

  const drawerLinkClass =
    'flex min-h-[var(--chrome-touch-drawer)] items-center rounded-lg px-3 py-2.5 text-sm font-medium !text-[var(--header-link)] no-underline transition-colors hover:bg-[var(--navy-light)] hover:!text-[var(--header-link-hover)]';

  const utilityButtons = (
    <>
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
      <HeaderAskAiButton className="hidden min-h-[var(--header-touch-compact)] shrink-0 items-center rounded-lg border border-white/40 bg-[var(--navy-light)] px-2.5 text-sm font-semibold !text-white no-underline transition-colors hover:border-[var(--gold)] hover:bg-[var(--navy-mid)] xl:inline-flex" />
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
        <span aria-hidden className="text-sm leading-none">
          →
        </span>
      </Link>
    </>
  );

  return (
    <header
      className={`site-header relative z-30 border-b border-[var(--navy-light)] bg-[var(--navy)] shadow-lg ${compact ? 'header-compact' : ''}`}
    >
      {/* Top bar: brand + utilities (desktop nav is on its own row below) */}
      <div className="header-row mx-auto flex max-w-7xl items-center justify-between gap-2 px-4 py-1.5 sm:px-6 sm:py-2 lg:px-8">
        <div className="flex min-w-0 items-center gap-2">
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-label={open ? 'Close menu' : 'Open menu'}
            aria-expanded={open}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[var(--navy-light)] text-white transition-colors hover:bg-[var(--navy)] hover:ring-1 hover:ring-[var(--gold)]/40 lg:hidden"
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
            <span className="header-site-name text-sm font-bold tracking-tight text-white sm:text-base">
              PoliceStationRep<span className="text-[var(--gold)]">UK</span>
            </span>
          </Link>
        </div>

        <div className="flex shrink-0 items-center gap-1 pl-0.5 lg:gap-1.5">{utilityButtons}</div>
      </div>

      {/* Desktop nav — full width second row so items can wrap without overlapping the logo */}
      <div className="hidden border-t border-[var(--navy-light)]/80 lg:block">
        <nav
          className="mx-auto flex max-w-7xl flex-wrap items-center justify-center gap-x-0.5 gap-y-1.5 px-4 py-2 sm:px-6 lg:px-8"
          aria-label="Main navigation"
        >
          {HEADER_NAV_PRIMARY.map((link) => (
            <NavItem
              key={`${link.href}-${link.text}`}
              href={link.href}
              className={navLinkClass(link.href, link.href === '/directory')}
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
              labelHref={group.labelHref}
              active={group.label === 'Blog' ? isBlogActive : undefined}
              wide={group.label === 'More' || group.label === 'For Reps' || group.label === 'Guides'}
            />
          ))}
        </nav>
      </div>

      {open && (
        <div className="max-h-[80vh] overflow-y-auto border-t border-[var(--navy-light)] bg-[var(--navy)] lg:hidden">
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

            <div className="mt-3 border-t border-[var(--navy-light)] pt-3">
              <p className="mb-1 px-3 text-[10px] font-bold uppercase tracking-wider text-white/50">Blog</p>
              {HEADER_NAV_BLOG_LINKS.map((link) => (
                <NavItem
                  key={`mobile-blog-${link.href}`}
                  href={link.href}
                  external={link.external ?? link.href.startsWith('http')}
                  onNavigate={() => setOpen(false)}
                  className={drawerLinkClass}
                >
                  {link.text}
                </NavItem>
              ))}
            </div>

            {mobileDropdowns.map((group) => (
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
              <HeaderAskAiButton
                onNavigate={() => setOpen(false)}
                className="btn-gold block w-full text-center !text-sm"
              />
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
