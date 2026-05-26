'use client';

import Link from 'next/link';
import {
  CUSTODYNOTE_BRAND_NAME,
  CUSTODYNOTE_DISCOUNT_CODE,
  CUSTODYNOTE_MEMBER_PRICE_GBP,
  CUSTODYNOTE_PRICE_GBP,
  CUSTODYNOTE_TRIAL_HREF,
  INLINE_CTA_BULLETS,
  INLINE_CTA_HEADLINE,
} from '@/lib/custodynote-promo';

type Variant = 'full' | 'compact';

export function CustodyNoteInlineCTA({ variant = 'full' }: { variant?: Variant }) {
  if (variant === 'compact') {
    return (
      <aside className="rounded-xl border-2 border-[var(--gold)]/40 bg-gradient-to-br from-[var(--navy)] to-[#152e6e] p-4 text-white shadow-lg">
        <p className="text-xs font-bold uppercase tracking-wide text-[var(--gold)]">{CUSTODYNOTE_BRAND_NAME}</p>
        <p className="mt-1 text-sm font-semibold leading-snug">{INLINE_CTA_HEADLINE}</p>
        <ul className="mt-2 space-y-0.5 text-xs text-slate-200">
          {INLINE_CTA_BULLETS.map((b) => (
            <li key={b} className="flex items-center gap-1.5">
              <span className="text-[var(--gold)]" aria-hidden>
                ✓
              </span>
              {b}
            </li>
          ))}
        </ul>
        <p className="mt-3 text-[11px] text-white/85">
          30-day free trial · then £{CUSTODYNOTE_PRICE_GBP}/mo · PSR UK readers £
          {CUSTODYNOTE_MEMBER_PRICE_GBP} with code{' '}
          <span className="rounded bg-[var(--gold)]/20 px-1 font-mono text-[var(--gold)]">
            {CUSTODYNOTE_DISCOUNT_CODE}
          </span>
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <a
            href={CUSTODYNOTE_TRIAL_HREF}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex flex-1 min-w-[8rem] items-center justify-center rounded-lg bg-[var(--gold)] px-3 py-2 text-center text-xs font-bold text-[var(--navy)] no-underline transition-colors hover:bg-[var(--gold-hover)]"
          >
            Start Free Trial
          </a>
          <Link
            href="/CustodyNote"
            className="inline-flex items-center justify-center rounded-lg border border-white/30 px-3 py-2 text-xs font-semibold text-white no-underline hover:bg-white/10"
          >
            About {CUSTODYNOTE_BRAND_NAME}
          </Link>
        </div>
      </aside>
    );
  }

  return (
    <aside
      className="relative overflow-hidden rounded-2xl border-2 border-[var(--gold)]/50 bg-gradient-to-br from-[#0f1d45] via-[var(--navy)] to-[#0a1633] p-6 shadow-[0_20px_50px_-12px_rgba(30,58,138,0.45)] sm:p-8"
      aria-labelledby="cn-inline-cta-heading"
    >
      <div className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-[var(--gold)]/10 blur-2xl" />
      <div className="relative">
        <p className="text-xs font-bold uppercase tracking-widest text-[var(--gold)]">Recommended for reps</p>
        <h2 id="cn-inline-cta-heading" className="mt-2 text-xl font-extrabold tracking-tight text-white sm:text-2xl">
          {INLINE_CTA_HEADLINE}
        </h2>
        <ul className="mt-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:gap-x-8 sm:gap-y-2">
          {INLINE_CTA_BULLETS.map((b) => (
            <li key={b} className="flex items-center gap-2 text-sm font-medium text-slate-200">
              <span
                className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--gold)]/20 text-[var(--gold)]"
                aria-hidden
              >
                ✓
              </span>
              {b}
            </li>
          ))}
        </ul>
        <div className="mt-5 inline-flex flex-wrap items-center gap-2 rounded-lg border border-[var(--gold)]/30 bg-black/20 px-3 py-2 text-xs text-white sm:text-sm">
          <span className="font-bold">£{CUSTODYNOTE_PRICE_GBP}/mo</span>
          <span className="text-white/40">·</span>
          <span className="font-bold text-[var(--gold)]">PSR UK readers £{CUSTODYNOTE_MEMBER_PRICE_GBP}/mo</span>
          <span className="text-slate-300">with code</span>
          <span className="rounded bg-[var(--gold)] px-1.5 py-0.5 font-mono text-xs font-bold text-[var(--navy)]">
            {CUSTODYNOTE_DISCOUNT_CODE}
          </span>
        </div>
        <div className="mt-6 flex flex-wrap items-center gap-3">
          <a
            href={CUSTODYNOTE_TRIAL_HREF}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-[48px] items-center justify-center rounded-xl bg-[var(--gold)] px-8 py-3 text-base font-bold text-[var(--navy)] no-underline shadow-md transition-colors hover:bg-[var(--gold-hover)]"
          >
            Start Free Trial
          </a>
          <Link
            href="/CustodyNote"
            className="inline-flex min-h-[48px] items-center justify-center rounded-xl border-2 border-white/25 bg-white/5 px-6 py-3 text-sm font-semibold text-white no-underline backdrop-blur-sm transition-colors hover:border-[var(--gold)]/50 hover:bg-white/10"
          >
            See how it works
          </Link>
        </div>
        <p className="mt-4 text-xs text-slate-400">
          Advertisement — {CUSTODYNOTE_BRAND_NAME} is attendance note software by Defence Legal Services Ltd.{' '}
          <Link href="/Advertising" className="text-[var(--gold)] underline underline-offset-2 hover:text-white">
            Disclosure
          </Link>
        </p>
      </div>
    </aside>
  );
}
