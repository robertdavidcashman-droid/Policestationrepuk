'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  CUSTODYNOTE_DISCOUNT_CODE,
  CUSTODYNOTE_MEMBER_PRICE_GBP,
  CUSTODYNOTE_PRICE_GBP,
  CUSTODYNOTE_TRIAL_HREF,
} from '@/lib/custodynote-promo';
import {
  CONTACT_PHONE_TEL,
  CONTACT_PHONE_DISPLAY,
  CONTACT_WHATSAPP_HREF,
} from '@/lib/contact-constants';
import { WHATSAPP_JOIN_URL, WHATSAPP_JOIN_PHONE } from '@/lib/site-navigation';
import {
  PSRTRAIN_CTA,
  PSRTRAIN_FREE_TESTING_NOTE,
  PSRTRAIN_NAME,
  PSRTRAIN_TRAINING_HREF,
} from '@/lib/psrtrain-promo';

/**
 * Global promos: CustodyNote, Kent police station agent cover, WhatsApp community.
 * Hidden on `/` — the homepage already has full-width versions of these.
 */
export function SiteWidePromoStrip() {
  const pathname = usePathname();
  if (pathname === '/') return null;

  return (
    <aside
      className="border-t border-[var(--border)] bg-gradient-to-b from-slate-50 to-white"
      aria-label="Featured services and community"
    >
      <div className="page-container py-6 sm:py-8 lg:py-10">
        <p className="mb-4 text-center text-[10px] font-bold uppercase tracking-[0.25em] text-[var(--muted)]">
          Advertisements &amp; community
        </p>
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          {/* CustodyNote */}
          <div className="flex flex-col rounded-[var(--radius-lg)] border-2 border-[var(--gold)]/40 bg-white p-5 shadow-sm">
            <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--gold)]">Featured product</p>
            <h2 className="mt-1 text-base font-extrabold text-[var(--navy)]">CustodyNote</h2>
            <p className="mt-2 flex-1 text-xs leading-relaxed text-[var(--muted)]">
              PACE-aligned attendance notes — disclosure → advice → interview → outcome in one
              structured record. Offline at the custody desk, PDF for the file, LAA billing fields
              built in.
            </p>
            <p className="mt-3 text-xs font-semibold text-[var(--navy)]">
              £{CUSTODYNOTE_PRICE_GBP}/mo after a 30-day free trial · PSR UK readers £
              {CUSTODYNOTE_MEMBER_PRICE_GBP}/mo with code{' '}
              <span className="rounded bg-[var(--gold)]/15 px-1.5 py-0.5 font-mono font-bold text-[var(--navy)]">
                {CUSTODYNOTE_DISCOUNT_CODE}
              </span>
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <a
                href={CUSTODYNOTE_TRIAL_HREF}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-[40px] flex-1 items-center justify-center rounded-lg bg-[var(--gold)] px-3 text-xs font-bold text-[var(--navy)] no-underline hover:bg-[var(--gold-hover)]"
              >
                Start free trial
              </a>
              <Link
                href="/CustodyNote"
                className="inline-flex min-h-[40px] flex-1 items-center justify-center rounded-lg border border-slate-200 px-3 text-xs font-semibold text-[var(--navy)] no-underline hover:border-[var(--gold)]"
              >
                See how it works
              </Link>
            </div>
          </div>

          {/* PSR Train */}
          <div className="flex flex-col rounded-[var(--radius-lg)] border-2 border-[var(--navy)]/20 bg-white p-5 shadow-sm">
            <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--navy)]">Partner — exam prep</p>
            <h2 className="mt-1 text-base font-extrabold text-[var(--navy)]">{PSRTRAIN_NAME}</h2>
            <p className="mt-2 flex-1 text-xs leading-relaxed text-[var(--muted)]">
              Timed MCQs, PACE modules, and CIT-style scenarios for PSRAS candidates.
            </p>
            <p className="mt-2 text-[11px] font-medium text-emerald-700">{PSRTRAIN_FREE_TESTING_NOTE}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              <a
                href={PSRTRAIN_TRAINING_HREF}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-[40px] flex-1 items-center justify-center rounded-lg bg-[var(--navy)] px-3 text-xs font-bold text-white no-underline hover:bg-[var(--navy-light)]"
              >
                {PSRTRAIN_CTA}
              </a>
              <Link
                href="/PrepareForCIT"
                className="inline-flex min-h-[40px] flex-1 items-center justify-center rounded-lg border border-slate-200 px-3 text-xs font-semibold text-[var(--navy)] no-underline hover:border-[var(--gold)]"
              >
                CIT guide
              </Link>
            </div>
          </div>

          {/* Kent police station agent */}
          <div className="flex flex-col rounded-[var(--radius-lg)] border-2 border-[var(--gold)]/35 bg-[var(--gold-pale)]/60 p-5 shadow-sm">
            <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--navy)]">Promoted service</p>
            <h2 className="mt-1 text-base font-extrabold text-[var(--navy)]">Kent police station agent</h2>
            <p className="mt-2 flex-1 text-xs leading-relaxed text-[var(--navy)]/85">
              Solicitor-led cover for Kent firms — daytime &amp; evening, all Kent custody suites. Separate from the
              directory.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <a
                href="https://www.policestationagent.com"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-[40px] flex-1 items-center justify-center rounded-lg bg-[var(--navy)] px-3 text-xs font-bold text-white no-underline hover:bg-[var(--navy-light)]"
              >
                policestationagent.com
              </a>
              <a
                href={CONTACT_PHONE_TEL}
                className="inline-flex min-h-[40px] items-center justify-center rounded-lg border border-[var(--navy)]/25 bg-white px-3 text-xs font-semibold text-[var(--navy)] no-underline"
              >
                {CONTACT_PHONE_DISPLAY}
              </a>
              <a
                href={CONTACT_WHATSAPP_HREF}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-[40px] items-center justify-center rounded-lg border border-[var(--navy)]/25 bg-white px-3 text-xs font-semibold text-[var(--navy)] no-underline"
              >
                WhatsApp
              </a>
            </div>
          </div>

          {/* WhatsApp */}
          <div className="flex flex-col rounded-[var(--radius-lg)] border border-emerald-800/25 bg-gradient-to-b from-emerald-950 to-[#0a1f1a] p-5 text-white shadow-sm">
            <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-300">Community</p>
            <h2 className="mt-1 text-base font-extrabold">WhatsApp group</h2>
            <p className="mt-2 flex-1 text-xs leading-relaxed text-emerald-100/90">
              One group for accredited reps &amp; criminal defence firms. Text{' '}
              <span className="font-semibold text-white">{WHATSAPP_JOIN_PHONE}</span> to request access — verified
              before you join.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <a
                href={WHATSAPP_JOIN_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-[40px] flex-1 items-center justify-center rounded-lg bg-[var(--gold)] px-3 text-xs font-bold text-[var(--navy)] no-underline hover:bg-[var(--gold-hover)]"
              >
                Text to join
              </a>
              <Link
                href="/WhatsApp"
                className="inline-flex min-h-[40px] flex-1 items-center justify-center rounded-lg border border-white/20 px-3 text-xs font-semibold text-white no-underline hover:bg-white/10"
              >
                How to join
              </Link>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
