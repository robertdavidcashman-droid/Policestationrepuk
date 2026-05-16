import Link from 'next/link';
import {
  CUSTODYNOTE_TRIAL_HREF,
  CUSTODYNOTE_MEMBER_PRICE_GBP,
  INLINE_CTA_HEADLINE,
} from '@/lib/custodynote-promo';
import { PSRTRAIN_CTA, PSRTRAIN_NAME, PSRTRAIN_TRAINING_HREF } from '@/lib/psrtrain-promo';
import { AdvertisementLabel } from '@/components/AdvertisementLabel';

/**
 * Combined partner strip — one row, two products, avoids stacked full-width promos.
 */
export function BlogPartnerToolsPromo({ className = '' }: { className?: string }) {
  return (
    <aside
      className={`mt-10 rounded-2xl border border-[var(--card-border)] bg-slate-50 p-5 sm:p-6 ${className}`}
      aria-label="Partner tools for police station representatives"
    >
      <AdvertisementLabel variant="gold" label="Partner tools" className="mb-4" />
      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-xl border border-[var(--gold)]/35 bg-gradient-to-br from-[var(--navy)] to-[#152e6e] p-4 text-white">
          <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--gold)]">At the station</p>
          <h3 className="mt-1 text-base font-bold">CustodyNote</h3>
          <p className="mt-2 text-xs leading-relaxed text-slate-200">{INLINE_CTA_HEADLINE}</p>
          <p className="mt-2 text-[11px] text-white/80">
            30-day free trial · PSR UK readers £{CUSTODYNOTE_MEMBER_PRICE_GBP}/mo
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <a
              href={CUSTODYNOTE_TRIAL_HREF}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-[36px] items-center rounded-lg bg-[var(--gold)] px-3 text-xs font-bold text-[var(--navy)] no-underline"
            >
              Start free trial
            </a>
            <Link href="/CustodyNote" className="text-xs font-semibold text-white underline">
              Learn more
            </Link>
          </div>
        </div>
        <div className="rounded-xl border border-[var(--navy)]/20 bg-white p-4">
          <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--muted)]">Before accreditation</p>
          <h3 className="mt-1 text-base font-bold text-[var(--navy)]">{PSRTRAIN_NAME}</h3>
          <p className="mt-2 text-xs leading-relaxed text-[var(--muted)]">
            Timed MCQs, PACE modules, and CIT-style scenarios on a partner platform.
          </p>
          <a
            href={PSRTRAIN_TRAINING_HREF}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 inline-flex min-h-[36px] items-center rounded-lg bg-[var(--navy)] px-3 text-xs font-bold text-white no-underline hover:bg-[var(--navy-light)]"
          >
            {PSRTRAIN_CTA} ↗
          </a>
        </div>
      </div>
      <p className="mt-3 text-xs text-[var(--muted)]">
        Advertisement. Partner products — not legal advice.{' '}
        <Link href="/Advertising" className="font-semibold text-[var(--navy)] underline">
          Disclosure
        </Link>
      </p>
    </aside>
  );
}
