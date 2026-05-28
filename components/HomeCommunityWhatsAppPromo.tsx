import Link from 'next/link';
import {
  WHATSAPP_FIRM_JOIN_URL,
  WHATSAPP_JOIN_URL,
  WHATSAPP_JOIN_PHONE,
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
                href="/WhatsApp"
                className="text-center text-sm font-semibold text-emerald-300 underline decoration-emerald-500/50 underline-offset-2 hover:text-white sm:text-left"
              >
                How firms join &rarr;
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
              The same group includes reps who respond to firm requests and share peer support. You must hold
              PSRAS accreditation (or equivalent) before we add you.
            </p>
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
                href="/register"
                className="inline-flex justify-center text-sm font-semibold text-emerald-300 underline decoration-emerald-500/50 underline-offset-2 hover:text-white"
              >
                List your profile in the directory &rarr;
              </Link>
            </div>
          </article>
        </div>

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
