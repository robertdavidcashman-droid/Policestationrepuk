import Link from 'next/link';
import { AdvertisementLabel } from '@/components/AdvertisementLabel';
import {
  PSRTRAIN_BULLETS,
  PSRTRAIN_CIT_HREF,
  PSRTRAIN_CTA,
  PSRTRAIN_CTA_START,
  PSRTRAIN_DISCLAIMER,
  PSRTRAIN_FREE_TESTING_NOTE,
  PSRTRAIN_HEADLINE,
  PSRTRAIN_NAME,
  PSRTRAIN_SUBHEAD,
  PSRTRAIN_TAGLINE,
  PSRTRAIN_TRAINING_HREF,
  psrTrainHref,
} from '@/lib/psrtrain-promo';

type Variant = 'compact' | 'card' | 'hero' | 'slim' | 'inline';

type PsrTrainPromoProps = {
  variant?: Variant;
  className?: string;
  /** Override default training href UTM campaign */
  campaign?: string;
  showFreeTesting?: boolean;
};

function ctaHref(campaign?: string) {
  return campaign ? psrTrainHref(campaign, '/training') : PSRTRAIN_TRAINING_HREF;
}

function Disclosure({ className = '' }: { className?: string }) {
  return (
    <p className={`text-xs ${className}`}>
      <span className="font-medium">Advertisement.</span> Partner exam-prep platform.{' '}
      <Link href="/Advertising" className="underline underline-offset-2 hover:text-[var(--gold)]">
        Disclosure
      </Link>
    </p>
  );
}

export function PsrTrainPromo({
  variant = 'card',
  className = '',
  campaign,
  showFreeTesting = true,
}: PsrTrainPromoProps) {
  const href = ctaHref(campaign);

  if (variant === 'slim') {
    return (
      <aside
        className={`flex flex-wrap items-center justify-between gap-4 rounded-xl border border-[var(--navy)]/20 bg-gradient-to-r from-slate-50 to-white px-5 py-3 shadow-sm ${className}`}
        aria-label={`${PSRTRAIN_NAME} partner promotion`}
      >
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <AdvertisementLabel variant="gold" label="Partner" className="shrink-0" />
          <div className="min-w-0">
            <p className="truncate text-sm font-bold text-[var(--navy)]">
              {PSRTRAIN_NAME} — practice MCQs and CIT-style scenarios
            </p>
            <p className="mt-0.5 text-xs text-[var(--muted)]">
              {showFreeTesting ? `${PSRTRAIN_FREE_TESTING_NOTE} · ` : ''}
              {PSRTRAIN_DISCLAIMER}
            </p>
          </div>
        </div>
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="btn-gold shrink-0 !px-4 !py-2 !text-xs no-underline"
        >
          {PSRTRAIN_CTA}
        </a>
      </aside>
    );
  }

  if (variant === 'compact') {
    return (
      <aside
        className={`rounded-xl border-2 border-[var(--navy)]/25 bg-gradient-to-br from-slate-50 to-white p-4 shadow-sm ${className}`}
        aria-label={`${PSRTRAIN_NAME} partner promotion`}
      >
        <AdvertisementLabel variant="gold" label="Partner — exam prep" />
        <p className="mt-2 text-sm font-bold text-[var(--navy)]">{PSRTRAIN_NAME}</p>
        <p className="mt-1 text-xs leading-relaxed text-[var(--muted)]">{PSRTRAIN_TAGLINE}</p>
        <ul className="mt-2 space-y-0.5 text-xs text-[var(--muted)]">
          {PSRTRAIN_BULLETS.map((b) => (
            <li key={b} className="flex gap-1.5">
              <span className="text-[var(--navy)]" aria-hidden>
                ✓
              </span>
              {b}
            </li>
          ))}
        </ul>
        {showFreeTesting && (
          <p className="mt-2 text-[11px] font-medium text-emerald-700">{PSRTRAIN_FREE_TESTING_NOTE}</p>
        )}
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-3 inline-flex min-h-[40px] w-full items-center justify-center rounded-lg bg-[var(--navy)] px-3 text-xs font-bold text-white no-underline hover:bg-[var(--navy-light)]"
        >
          {PSRTRAIN_CTA}
        </a>
        <Disclosure className="mt-2 text-[var(--muted)]" />
      </aside>
    );
  }

  if (variant === 'inline') {
    return (
      <aside
        className={`rounded-2xl border border-[var(--card-border)] bg-[var(--card-bg)] p-5 shadow-[var(--card-shadow)] ${className}`}
        aria-label={`${PSRTRAIN_NAME} partner promotion`}
      >
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <AdvertisementLabel variant="gold" label="Partner" />
            <h3 className="mt-2 text-lg font-bold text-[var(--navy)]">{PSRTRAIN_HEADLINE}</h3>
            <p className="mt-1 text-sm text-[var(--muted)]">{PSRTRAIN_SUBHEAD}</p>
          </div>
          <a href={href} target="_blank" rel="noopener noreferrer" className="btn-gold shrink-0 no-underline">
            {PSRTRAIN_CTA}
          </a>
        </div>
        <Disclosure className="mt-3 text-[var(--muted)]" />
      </aside>
    );
  }

  if (variant === 'hero') {
    return (
      <section
        className={`rounded-[var(--radius-lg)] bg-[var(--navy)] p-8 text-center sm:p-10 ${className}`}
        aria-label={`${PSRTRAIN_NAME} partner promotion`}
      >
        <div className="mx-auto max-w-2xl">
          <AdvertisementLabel variant="dark" label="Partner — exam prep" className="mb-4" />
          <h2 className="text-xl font-bold text-white sm:text-2xl">{PSRTRAIN_HEADLINE}</h2>
          <p className="mt-3 text-sm leading-relaxed text-slate-200 sm:text-base">{PSRTRAIN_SUBHEAD}</p>
          <ul className="mt-5 flex flex-col gap-2 text-left sm:mx-auto sm:max-w-md">
            {PSRTRAIN_BULLETS.map((b) => (
              <li key={b} className="flex gap-2 text-sm text-slate-200">
                <span className="text-[var(--gold)]" aria-hidden>
                  ✓
                </span>
                {b}
              </li>
            ))}
          </ul>
          {showFreeTesting && (
            <p className="mt-4 inline-flex rounded-full border border-emerald-400/40 bg-emerald-950/40 px-3 py-1 text-xs font-medium text-emerald-200">
              {PSRTRAIN_FREE_TESTING_NOTE}
            </p>
          )}
          <p className="mt-3 text-xs text-slate-400">{PSRTRAIN_DISCLAIMER}</p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <a
              href={campaign === 'prepare_for_cit' ? PSRTRAIN_CIT_HREF : href}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-gold no-underline"
            >
              {PSRTRAIN_CTA_START}
            </a>
            <Link
              href="/PrepareForCIT"
              className="btn-outline !border-slate-500 !text-white hover:!border-[var(--gold)] hover:!text-[var(--gold)] no-underline"
            >
              CIT guide on PSR UK
            </Link>
          </div>
          <Disclosure className="mt-4 text-slate-500" />
        </div>
      </section>
    );
  }

  /* card — default; homepage training row */
  return (
    <article
      className={`group flex h-full flex-col rounded-[var(--radius-lg)] border-2 border-[var(--navy)]/20 bg-gradient-to-br from-slate-50 to-white p-6 shadow-sm transition-shadow hover:border-[var(--gold)]/40 hover:shadow-md ${className}`}
      aria-label={`${PSRTRAIN_NAME} partner promotion`}
    >
      <AdvertisementLabel variant="gold" label="Partner — exam prep" />
      <h3 className="mt-3 text-lg font-extrabold text-[var(--navy)]">{PSRTRAIN_NAME}</h3>
      <p className="mt-1 text-sm font-medium text-[var(--muted)]">{PSRTRAIN_HEADLINE}</p>
      <p className="mt-2 flex-1 text-sm leading-relaxed text-[var(--muted)]">{PSRTRAIN_SUBHEAD}</p>
      <ul className="mt-4 space-y-2 text-sm text-[var(--muted)]">
        {PSRTRAIN_BULLETS.map((b) => (
          <li key={b} className="flex gap-2">
            <span className="text-[var(--navy)]" aria-hidden>
              ✓
            </span>
            {b}
          </li>
        ))}
      </ul>
      {showFreeTesting && (
        <p className="mt-3 text-xs font-medium text-emerald-700">{PSRTRAIN_FREE_TESTING_NOTE}</p>
      )}
      <p className="mt-2 text-[11px] text-[var(--muted)]">{PSRTRAIN_DISCLAIMER}</p>
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-5 inline-flex min-h-[44px] items-center justify-center rounded-xl bg-[var(--navy)] px-5 py-2.5 text-sm font-bold text-white no-underline hover:bg-[var(--navy-light)]"
      >
        {PSRTRAIN_CTA} ↗
      </a>
      <Disclosure className="mt-3 text-[var(--muted)]" />
    </article>
  );
}
