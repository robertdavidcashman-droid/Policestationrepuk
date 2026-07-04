import Link from 'next/link';
import {
  CUSTODYNOTE_APPS_LINE,
  CUSTODYNOTE_BRAND_NAME,
  CUSTODYNOTE_DISCOUNT_CODE,
  CUSTODYNOTE_DOWNLOAD_APPS_CTA,
  CUSTODYNOTE_MEMBER_PRICE_GBP,
  CUSTODYNOTE_PRICE_GBP,
  CUSTODYNOTE_TRIAL_HREF,
} from '@/lib/custodynote-promo';
import {
  PSRTRAIN_BULLETS,
  PSRTRAIN_CTA,
  PSRTRAIN_FREE_TESTING_NOTE,
  PSRTRAIN_NAME,
  PSRTRAIN_TRAINING_HREF,
} from '@/lib/psrtrain-promo';
import { FOOTER_TOOLS } from '@/lib/site-navigation';
import { LeadMagnetEmailCapture } from '@/components/LeadMagnetEmailCapture';

/**
 * “Tools for Police Station Reps” — CustodyNote + PSR Train partner cards; other tools from site nav.
 */
export function ToolsForRepsSection() {
  const rest = FOOTER_TOOLS.filter(
    (l) => !l.href.includes('custodynote') && !l.href.includes('psrtrain'),
  );

  return (
    <section className="border-b border-[var(--border)] bg-slate-50 py-12 sm:py-14" aria-labelledby="tools-for-reps-heading">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <h2 id="tools-for-reps-heading" className="text-2xl font-extrabold tracking-tight text-[var(--navy)] sm:text-3xl">
          Tools for Police Station Reps
        </h2>
        <p className="mt-2 max-w-2xl text-sm text-[var(--muted)]">
          Software for custody work and interactive exam prep — plus guides from the directory.
        </p>

        <div className="mt-8 grid gap-6 lg:grid-cols-12 lg:gap-8">
          <div className="grid gap-6 lg:col-span-5">
            <div className="flex h-full flex-col rounded-2xl border-2 border-[var(--gold)] bg-gradient-to-br from-[var(--navy)] to-[#152e6e] p-6 text-white shadow-xl sm:p-8">
              <span className="inline-flex w-fit rounded-full bg-[var(--gold)] px-3 py-1 text-xs font-bold text-[var(--navy)]">
                #1 for practising reps
              </span>
              <h3 className="mt-4 text-xl font-extrabold sm:text-2xl">{CUSTODYNOTE_BRAND_NAME}</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-200">
                {CUSTODYNOTE_APPS_LINE}. PACE-aligned custody and attendance notes — structured fields, works offline,
                AES-256 encryption, PDF export and LAA billing.
              </p>
              <ul className="mt-4 space-y-2 text-sm text-slate-200">
                <li className="flex gap-2">
                  <span className="text-[var(--gold)]">✓</span> Structured notes in 3 minutes
                </li>
                <li className="flex gap-2">
                  <span className="text-[var(--gold)]">✓</span> Offline at the custody desk
                </li>
                <li className="flex gap-2">
                  <span className="text-[var(--gold)]">✓</span> Instant PDF + LAA billing fields
                </li>
              </ul>
              <div className="mt-5 rounded-lg border border-[var(--gold)]/40 bg-black/25 px-4 py-3 text-sm">
                <p className="text-white">
                  <span className="font-bold">£{CUSTODYNOTE_PRICE_GBP}/mo</span> after a 30-day free trial
                </p>
                <p className="mt-1 text-[var(--gold)]">
                  PSR UK readers £{CUSTODYNOTE_MEMBER_PRICE_GBP}/mo with code{' '}
                  <span className="rounded bg-[var(--gold)] px-1.5 py-0.5 font-mono text-xs font-bold text-[var(--navy)]">
                    {CUSTODYNOTE_DISCOUNT_CODE}
                  </span>
                </p>
              </div>
              <div className="mt-5 flex flex-wrap gap-3">
                <a
                  href={CUSTODYNOTE_TRIAL_HREF}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex min-h-[44px] items-center justify-center rounded-xl bg-[var(--gold)] px-6 py-3 text-sm font-bold text-[var(--navy)] no-underline hover:bg-[var(--gold-hover)]"
                >
                  {CUSTODYNOTE_DOWNLOAD_APPS_CTA}
                </a>
                <Link
                  href="/CustodyNote"
                  className="inline-flex min-h-[44px] items-center justify-center rounded-xl border-2 border-white/30 px-5 py-3 text-sm font-semibold text-white no-underline hover:bg-white/10"
                >
                  About {CUSTODYNOTE_BRAND_NAME}
                </Link>
              </div>
              <p className="mt-4 text-xs text-slate-400">Advertisement — see our disclosure.</p>
            </div>

            <div className="flex h-full flex-col rounded-2xl border-2 border-[var(--navy)]/25 bg-white p-6 shadow-lg sm:p-8">
              <span className="inline-flex w-fit rounded-full border border-[var(--navy)]/20 bg-slate-100 px-3 py-1 text-xs font-bold text-[var(--navy)]">
                Partner — exam prep
              </span>
              <h3 className="mt-4 text-xl font-extrabold text-[var(--navy)] sm:text-2xl">{PSRTRAIN_NAME}</h3>
              <p className="mt-2 text-sm leading-relaxed text-[var(--muted)]">
                Interactive PSRAS preparation — timed MCQs, learning modules, and CIT-style scenarios on psrtrain.com.
              </p>
              <ul className="mt-4 space-y-2 text-sm text-[var(--muted)]">
                {PSRTRAIN_BULLETS.map((b) => (
                  <li key={b} className="flex gap-2">
                    <span className="font-bold text-[var(--navy)]">✓</span>
                    {b}
                  </li>
                ))}
              </ul>
              <p className="mt-3 text-xs font-medium text-emerald-700">{PSRTRAIN_FREE_TESTING_NOTE}</p>
              <div className="mt-5 flex flex-wrap gap-3">
                <a
                  href={PSRTRAIN_TRAINING_HREF}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex min-h-[44px] items-center justify-center rounded-xl bg-[var(--navy)] px-6 py-3 text-sm font-bold text-white no-underline hover:bg-[var(--navy-light)]"
                >
                  {PSRTRAIN_CTA}
                </a>
                <Link
                  href="/PrepareForCIT"
                  className="inline-flex min-h-[44px] items-center justify-center rounded-xl border-2 border-[var(--navy)]/20 px-5 py-3 text-sm font-semibold text-[var(--navy)] no-underline hover:border-[var(--gold)]"
                >
                  CIT guide
                </Link>
              </div>
              <p className="mt-4 text-xs text-[var(--muted)]">Advertisement — training guidance only; not accreditation.</p>
            </div>
          </div>

          <div className="lg:col-span-7">
            <h3 className="text-sm font-bold uppercase tracking-wide text-[var(--muted)]">More tools &amp; guides</h3>
            <Link
              href="/StationsDirectory"
              className="mt-4 flex min-h-[44px] items-center rounded-lg border-2 border-[var(--gold)]/40 bg-[var(--gold-pale)] px-4 py-3 text-sm font-bold text-[var(--navy)] shadow-sm no-underline transition-colors hover:border-[var(--gold)]"
            >
              Station phone numbers directory
              <span className="ml-auto text-xs text-[var(--muted)]">→</span>
            </Link>
            <ul className="mt-4 grid gap-2 sm:grid-cols-2">
              {rest.map((link) => (
                <li key={`${link.href}-${link.label}`}>
                  {link.external ? (
                    <a
                      href={link.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex min-h-[44px] items-center rounded-lg border border-[var(--card-border)] bg-white px-4 py-2 text-sm font-semibold text-[var(--navy)] shadow-sm no-underline transition-colors hover:border-[var(--gold)]/50 hover:bg-[var(--gold-pale)]"
                    >
                      {link.label}
                      <span className="ml-auto text-xs text-slate-400">↗</span>
                    </a>
                  ) : (
                    <Link
                      href={link.href}
                      className="flex min-h-[44px] items-center rounded-lg border border-[var(--card-border)] bg-white px-4 py-2 text-sm font-semibold text-[var(--navy)] shadow-sm no-underline transition-colors hover:border-[var(--gold)]/50 hover:bg-[var(--gold-pale)]"
                    >
                      {link.label}
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <LeadMagnetEmailCapture />
      </div>
    </section>
  );
}
