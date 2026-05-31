'use client';

import { usePathname } from 'next/navigation';
import { SITE_URL } from '@/lib/seo-layer/config';
import { FOOTER_UTILITY_SHARE, FOOTER_UTILITY_TOP } from '@/lib/site-navigation';

const DIRECTORY_ROUTES = ['/directory', '/search', '/StationsDirectory'] as const;

function isDirectoryContext(pathname: string | null): boolean {
  if (!pathname) return false;
  if (pathname.startsWith('/rep/')) return true;
  return DIRECTORY_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`),
  );
}

/**
 * Floating share / back-to-top — directory pages only, md+ (mobile uses header share strip).
 */
export function FloatingDirectoryActions() {
  const pathname = usePathname();

  if (!isDirectoryContext(pathname)) return null;

  const handleShare = async () => {
    const url = typeof window !== 'undefined' ? window.location.href : SITE_URL;
    if (navigator.share) {
      try {
        await navigator.share({ title: 'PoliceStationRepUK', url });
      } catch {
        /* dismissed */
      }
    } else {
      await navigator.clipboard.writeText(url);
    }
  };

  const scrollToTop = () => window.scrollTo({ top: 0, behavior: 'smooth' });

  return (
    <nav
      data-parity-mask
      aria-label="Share and back to top"
      className="pointer-events-none fixed-ui-bottom-raised fixed-ui-left z-30 hidden flex-col gap-2 md:flex"
    >
      <button
        type="button"
        onClick={handleShare}
        className="pointer-events-auto min-h-[44px] min-w-[44px] rounded-lg border border-[var(--navy-light)] bg-white px-3 py-2 text-left text-xs font-semibold leading-snug text-[var(--navy)] shadow-md transition-colors hover:bg-[var(--gold-pale)]"
      >
        {FOOTER_UTILITY_SHARE}
      </button>
      <button
        type="button"
        onClick={scrollToTop}
        className="pointer-events-auto min-h-[44px] min-w-[44px] rounded-lg border border-[var(--navy-light)] bg-[var(--navy)] px-3 py-2 text-left text-xs font-semibold leading-snug text-white shadow-md transition-colors hover:bg-[var(--navy-light)]"
      >
        {FOOTER_UTILITY_TOP}
      </button>
    </nav>
  );
}
