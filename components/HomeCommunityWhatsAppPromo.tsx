import Link from 'next/link';
import { CommunityEligibilityCallout } from '@/components/CommunityEligibilityCallout';
import {
  WHATSAPP_FIRM_JOIN_URL,
  WHATSAPP_JOIN_URL,
  WHATSAPP_JOIN_PHONE,
  WHATSAPP_PAGE_FIRMS,
  WHATSAPP_PAGE_REPS,
  WHATSAPP_PAGE_SOLICITORS,
  COMMUNITY_EMAIL,
} from '@/lib/site-navigation';

const FIRM_BENEFITS = [
  'Post out-of-hours and weekend police station cover requests',
  'Hear back from accredited reps who cover your stations and areas',
  'No agency fees — you instruct the rep directly once cover is agreed',
] as const;

/**
 * Homepage promo — criminal defence firms first; accredited reps join the same verified group.
 * Full procedure: /WhatsApp
 */
export function HomeCommunityWhatsAppPromo() {
  return (
    <section
      className="border-y border-emerald-700/20 bg-gradient-to-b from-emerald-950 via-[#0a1f1a] to-emerald-950 py-8 sm:py-10"
      aria-labelledby="home-whatsapp-promo-heading"
    >
      <div className="page-container !py-0">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-400/90">
            For criminal defence firms
          </p>
          <h2
            id="home-whatsapp-promo-heading"
            className="mt-2 text-xl font-extrabold tracking-tight text-white sm:text-2xl"
          >
            Need police station cover out of hours?
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-emerald-100/85 sm:text-base">
            Join the PoliceStationRepUK WhatsApp group to post urgent custody attendance requests to{' '}
            <strong className="text-white">accredited police station reps</strong> across England &amp; Wales.
            Verified firms only — free to join, no middleman.
          </p>
        </div>

        <div className="mx-auto mt-8 grid max-w-4xl gap-6 lg:grid-cols-2 lg:gap-8">
          <article className="rounded-[var(--radius-lg)] border border-white/10 bg-white/[0.06] p-5 shadow-lg backdrop-blur-sm sm:p-7">
            <h3 className="text-base font-bold text-white sm:text-lg">Why firms join</h3>
            <ul className="mt-4 space-y-3 text-sm leading-relaxed text-emerald-50/95">
              {FIRM_BENEFITS.map((item) => (
                <li key={item} className="flex gap-2.5">
                  <span className="mt-0.5 shrink-0 text-[var(--gold)]" aria-hidden>
                    ✓
                  </span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
            <div className="mt-6 flex flex-col items-stretch gap-3 sm:flex-row sm:flex-wrap sm:items-center">
              <a
                href={WHATSAPP_FIRM_JOIN_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-gold inline-flex justify-center px-6 text-center text-sm no-underline"
              >
                Join as a firm on WhatsApp
              </a>
              <Link
                href={WHATSAPP_PAGE_FIRMS}
                className="text-center text-sm font-semibold text-emerald-300 underline decoration-emerald-500/50 underline-offset-2 hover:text-white sm:text-left"
              >
                Firm join guide &rarr;
              </Link>
            </div>
            <p className="mt-5 text-xs leading-relaxed text-emerald-200/75">
              Text <strong className="text-white">{WHATSAPP_JOIN_PHONE}</strong> with your name, firm name, and firm
              email. We verify firm details, then send your WhatsApp invite.
            </p>
          </article>

          <article className="flex flex-col rounded-[var(--radius-lg)] border border-emerald-800/40 bg-emerald-950/40 p-5 sm:p-7">
            <h3 className="text-base font-bold text-white sm:text-lg">Accredited reps</h3>
            <p className="mt-3 flex-1 text-sm leading-relaxed text-emerald-100/80">
              The same group includes reps who respond to firm requests and share peer support. You must be{' '}
              <strong className="text-white">fully accredited</strong> (PSRAS, LCCSA, CLSA or equivalent — not in
              training) before we add you. Proof is required; unverified requests are declined.
            </p>
            <div className="mt-4">
              <CommunityEligibilityCallout variant="compact" />
            </div>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <a
                href={WHATSAPP_JOIN_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex justify-center rounded-lg border border-white/25 bg-white/10 px-5 py-2.5 text-sm font-semibold text-white no-underline transition-colors hover:bg-white/20"
              >
                Join as a rep
              </a>
              <Link
                href={WHATSAPP_PAGE_REPS}
                className="inline-flex justify-center text-sm font-semibold text-emerald-300 underline decoration-emerald-500/50 underline-offset-2 hover:text-white"
              >
                Rep join guide &rarr;
              </Link>
              <Link
                href="/register"
                className="inline-flex justify-center text-sm font-semibold text-emerald-300 underline decoration-emerald-500/50 underline-offset-2 hover:text-white"
              >
                List in the directory &rarr;
              </Link>
            </div>
          </article>
        </div>

        <p className="mx-auto mt-6 max-w-xl text-center text-sm text-emerald-200/80">
          <Link href={WHATSAPP_PAGE_SOLICITORS} className="font-semibold text-emerald-200 underline hover:text-white">
            Criminal defence solicitors
          </Link>
          {' '}can join the same group to post cover requests — see the{' '}
          <Link href={WHATSAPP_PAGE_SOLICITORS} className="font-semibold text-emerald-200 underline hover:text-white">
            solicitor join guide
          </Link>
          .
        </p>

        <p className="mx-auto mt-6 max-w-2xl text-center text-xs text-emerald-200/70">
          Prefer email?{' '}
          <a
            href={`mailto:${COMMUNITY_EMAIL}?subject=WhatsApp%20group%20%E2%80%94%20firm%20request`}
            className="font-semibold text-emerald-200 underline hover:text-white"
          >
            {COMMUNITY_EMAIL}
          </a>
        </p>
      </div>
    </section>
  );
}
