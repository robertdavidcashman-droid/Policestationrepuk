import Link from 'next/link';
import {
  WHATSAPP_PAGE_FIRMS,
  WHATSAPP_PAGE_REPS,
  WHATSAPP_PAGE_SOLICITORS,
} from '@/lib/site-navigation';

const AUDIENCE_LINKS = [
  { href: WHATSAPP_PAGE_REPS, label: 'Reps', title: 'Police station representatives — join guide' },
  { href: WHATSAPP_PAGE_SOLICITORS, label: 'Solicitors', title: 'Criminal defence solicitors — join guide' },
  { href: WHATSAPP_PAGE_FIRMS, label: 'Firms', title: 'Criminal defence firms — join guide' },
] as const;

/**
 * Site-wide top strip — encourages reps, solicitors, and firms to join the WhatsApp group.
 * Each audience has a dedicated landing page with one-tap join steps.
 */
export function WhatsAppCommunityBanner() {
  return (
    <div className="relative z-[90] border-b border-emerald-800/30 bg-gradient-to-r from-emerald-950 via-[#0c221c] to-emerald-950">
      <div className="mx-auto w-full max-w-[var(--container-max)] px-[var(--container-gutter)] py-1 sm:px-6 sm:py-1.5 lg:px-8">
        <div className="flex flex-col items-center gap-1.5 sm:flex-row sm:flex-wrap sm:items-center sm:justify-center sm:gap-x-3 sm:gap-y-1">
          <p className="m-0 max-w-[44rem] text-center text-[10px] font-semibold leading-snug text-white sm:text-left sm:text-[11px]">
            <span className="text-emerald-300/90" aria-hidden>
              💬{' '}
            </span>
            Join the PoliceStationRepUK WhatsApp group — cover, networking &amp; peer support.{' '}
            <span className="font-normal text-emerald-100/85">Free · verified members</span>
          </p>

          <nav
            className="flex w-full max-w-md shrink-0 flex-wrap items-center justify-center gap-1.5 sm:w-auto sm:max-w-none"
            aria-label="Join WhatsApp by role"
          >
            {AUDIENCE_LINKS.map(({ href, label, title }) => (
              <Link
                key={href}
                href={href}
                title={title}
                className="inline-flex min-h-[28px] min-w-[4.5rem] items-center justify-center rounded-full bg-[var(--gold)] px-3 py-1 text-[10px] font-bold text-[var(--navy)] no-underline transition-colors hover:bg-[var(--gold-hover)] sm:min-h-[30px] sm:px-3.5 sm:text-[11px]"
              >
                {label}
              </Link>
            ))}
            <Link
              href="/WhatsApp"
              className="inline-flex min-h-[28px] items-center justify-center rounded-full border border-emerald-600/50 bg-emerald-900/40 px-3 py-1 text-[10px] font-semibold text-emerald-100 no-underline hover:border-emerald-400/60 hover:text-white sm:text-[11px]"
            >
              How it works
            </Link>
          </nav>
        </div>
      </div>
    </div>
  );
}
