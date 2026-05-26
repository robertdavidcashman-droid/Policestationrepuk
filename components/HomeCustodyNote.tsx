import Image from 'next/image';
import Link from 'next/link';
import {
  CUSTODYNOTE_BRAND_NAME,
  CUSTODYNOTE_DISCOUNT_CODE,
  CUSTODYNOTE_DISCOUNT_PCT,
  CUSTODYNOTE_MEMBER_PRICE_GBP,
  CUSTODYNOTE_PLATFORM_LINE,
  CUSTODYNOTE_PRICE_GBP,
  CUSTODYNOTE_PRICING_HREF,
  CUSTODYNOTE_TAGLINE,
  CUSTODYNOTE_TRIAL_CTA,
  CUSTODYNOTE_TRIAL_HREF,
} from '@/lib/custodynote-promo';
import { AdvertisementLabel } from './AdvertisementLabel';

export function HomeCustodyNote() {
  return (
    <section
      className="relative overflow-hidden bg-gradient-to-br from-[var(--navy)] via-[#152e6e] to-[var(--navy)]"
      aria-label={`${CUSTODYNOTE_BRAND_NAME} — promoted product`}
    >
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(250,204,21,0.08),transparent_60%)]" />
      <div className="section-pad relative">
        <div className="page-container !py-0">
          <div className="mx-auto max-w-3xl text-center">
            <AdvertisementLabel variant="dark" label="Featured product" />

            <h2 className="text-h2 mt-4 text-white">{CUSTODYNOTE_BRAND_NAME}</h2>
            <p className="mt-1 text-base font-medium text-[var(--gold)]">
              {CUSTODYNOTE_TAGLINE}
            </p>
            <p className="mx-auto mt-4 max-w-2xl text-sm leading-relaxed text-white/90">
              Disclosure → advice → interview → outcome in one structured record. Built for
              accredited reps and defence solicitors. Offline at the custody desk, PDF for the
              firm file, LAA-oriented billing fields — native desktop app for {CUSTODYNOTE_PLATFORM_LINE.toLowerCase()}.
            </p>

            <div className="mx-auto mt-8 grid max-w-xl gap-3 sm:grid-cols-3">
              {[
                { icon: '🔒', label: 'AES-256 encrypted' },
                { icon: '📴', label: 'Works offline' },
                { icon: '📄', label: 'Instant PDF + LAA fields' },
              ].map((f) => (
                <div key={f.label} className="rounded-lg border border-white/15 bg-white/5 px-4 py-3">
                  <span className="text-lg" aria-hidden>{f.icon}</span>
                  <p className="mt-1 text-xs font-semibold text-white">{f.label}</p>
                </div>
              ))}
            </div>

            <div className="mt-8 rounded-xl border-2 border-[var(--gold)]/40 bg-[var(--gold)]/10 px-6 py-5">
              <p className="text-xs font-bold uppercase tracking-wider text-[var(--gold)]">
                30-day free trial · no credit card
              </p>
              <p className="mt-2 text-2xl font-extrabold leading-tight text-white sm:text-3xl">
                £{CUSTODYNOTE_PRICE_GBP}
                <span className="text-base font-medium text-white/80">/month</span>
                <span className="mx-2 text-white/40">·</span>
                <span className="text-[var(--gold)]">
                  £{CUSTODYNOTE_MEMBER_PRICE_GBP}/mo for PSR UK readers
                </span>
              </p>
              <p className="mt-1 text-sm text-white/80">
                Cancel anytime. Save more with 6-month or annual billing at checkout.
              </p>
            </div>

            <div className="mt-5 inline-flex max-w-full flex-wrap items-center justify-center gap-2 rounded-full border-2 border-[var(--gold)]/60 bg-black/30 px-5 py-2.5 text-sm font-semibold text-white">
              <span aria-hidden>🎁</span>
              {CUSTODYNOTE_DISCOUNT_PCT}% off for PSR UK readers — use code{' '}
              <span className="rounded bg-[var(--gold)] px-2 py-0.5 font-mono font-bold text-[var(--navy)]">
                {CUSTODYNOTE_DISCOUNT_CODE}
              </span>{' '}
              at checkout on custodynote.com
            </div>

            <div className="mt-6 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
              <Link
                href={CUSTODYNOTE_TRIAL_HREF}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-gold w-full sm:w-auto"
              >
                {CUSTODYNOTE_TRIAL_CTA} →
              </Link>
              <Link
                href="/CustodyNote"
                className="btn-outline w-full !border-white/40 !text-white hover:!border-[var(--gold)] hover:!text-[var(--gold)] sm:w-auto"
              >
                See how it works
              </Link>
              <Link
                href={CUSTODYNOTE_PRICING_HREF}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-outline w-full !border-white/40 !text-white hover:!border-[var(--gold)] hover:!text-[var(--gold)] sm:w-auto"
              >
                View pricing →
              </Link>
            </div>

            <div className="mt-8 overflow-hidden rounded-xl border border-white/10 shadow-2xl">
              <Image
                src="/images/custodynote/custodynote-app-dashboard.png"
                alt="Custody Note desktop app dashboard — Custody Attendance, Voluntary Attendance, Telephone Advice and Quick Capture workflows"
                width={1536}
                height={960}
                className="h-auto w-full"
              />
            </div>

            <p className="mt-5 text-xs text-white/60">
              {CUSTODYNOTE_BRAND_NAME} is developed by Defence Legal Services Ltd. This is a promoted product —
              not part of the directory service.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
