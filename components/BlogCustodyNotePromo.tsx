import Link from 'next/link';
import {
  CUSTODYNOTE_BRAND_NAME,
  CUSTODYNOTE_DISCOUNT_CODE,
  CUSTODYNOTE_MEMBER_PRICE_GBP,
  CUSTODYNOTE_PRICE_GBP,
  CUSTODYNOTE_TRIAL_HREF,
} from '@/lib/custodynote-promo';

/** Internal + trial links for every blog article (conversion funnel). */
export function BlogCustodyNotePromo({ className }: { className?: string }) {
  return (
    <aside
      className={`rounded-[var(--radius-lg)] border-2 border-[var(--gold)]/35 bg-gradient-to-br from-[var(--navy)] to-[#152e6e] p-6 text-white shadow-lg sm:p-8 ${className ?? 'mt-10'}`}
    >
      <p className="text-xs font-bold uppercase tracking-widest text-[var(--gold)]">Tool for reps</p>
      <h2 className="mt-2 text-lg font-bold leading-snug sm:text-xl">
        Stop rewriting custody notes at 2am —{' '}
        <Link href="/CustodyNote" className="text-[var(--gold)] underline-offset-2 hover:underline">
          {CUSTODYNOTE_BRAND_NAME}
        </Link>
      </h2>
      <p className="mt-3 text-sm leading-relaxed text-slate-200">
        PACE-aligned structured sections, offline-first at the custody desk, instant PDF export and
        LAA billing fields in one record. See our{' '}
        <Link href="/CustodyNote" className="font-semibold text-white underline hover:text-[var(--gold)]">
          {CUSTODYNOTE_BRAND_NAME} overview
        </Link>{' '}
        or start a{' '}
        <a
          href={CUSTODYNOTE_TRIAL_HREF}
          target="_blank"
          rel="noopener noreferrer"
          className="font-semibold text-[var(--gold)] underline hover:text-white"
        >
          30-day free trial on custodynote.com
        </a>
        . Built for accredited UK police station representatives and defence solicitors.
      </p>

      <div className="mt-4 rounded-lg border border-[var(--gold)]/40 bg-black/20 px-4 py-3 text-sm text-white">
        <span className="font-bold text-white">£{CUSTODYNOTE_PRICE_GBP}/mo</span>
        <span className="mx-2 text-white/40">·</span>
        <span className="font-bold text-[var(--gold)]">PSR UK readers £{CUSTODYNOTE_MEMBER_PRICE_GBP}/mo</span>{' '}
        <span className="text-slate-200">with code</span>{' '}
        <span className="rounded bg-[var(--gold)] px-1.5 py-0.5 font-mono text-xs font-bold text-[var(--navy)]">
          {CUSTODYNOTE_DISCOUNT_CODE}
        </span>
      </div>

      <div className="mt-5 flex flex-wrap gap-3">
        <a
          href={CUSTODYNOTE_TRIAL_HREF}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex min-h-[44px] items-center justify-center rounded-lg bg-[var(--gold)] px-5 py-2.5 text-sm font-bold text-[var(--navy)] no-underline hover:bg-[var(--gold-hover)]"
        >
          Start free trial →
        </a>
        <Link
          href="/CustodyNote"
          className="inline-flex min-h-[44px] items-center justify-center rounded-lg border-2 border-white/30 px-5 py-2.5 text-sm font-semibold text-white no-underline hover:bg-white/10"
        >
          See how it works
        </Link>
      </div>
      <p className="mt-4 text-xs text-slate-400">
        <span className="font-medium text-slate-300">Advertisement.</span> {CUSTODYNOTE_BRAND_NAME} is a product of Defence Legal
        Services Ltd.{' '}
        <Link href="/Advertising" className="text-[var(--gold)] underline hover:text-white">
          Advertising disclosure
        </Link>
      </p>
    </aside>
  );
}
