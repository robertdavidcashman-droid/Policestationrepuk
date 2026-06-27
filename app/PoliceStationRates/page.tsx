import Link from 'next/link';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { CustodyNotePagePromo } from '@/components/CustodyNotePagePromo';
import { ContentReliabilityNotice } from '@/components/ContentReliabilityNotice';
import { ResolvedContentSources } from '@/components/ContentSourcesFooter';
import { GuideEmailCapture } from '@/components/GuideEmailCapture';
import { buildMetadata } from '@/lib/seo';

export const metadata = buildMetadata({
  title: 'Police Station Legal Aid Rates 2025/26',
  description:
    'Current police station legal aid rates for 2025/26 including the new harmonised fee of £320.00, escape threshold of £650.00, and guidance on claiming multiple fees.',
  path: '/PoliceStationRates',
});

const KEY_FIGURES = [
  { label: 'New Harmonised Fee', value: '£320.00', note: 'Fixed fee per attendance' },
  { label: 'Escape Threshold', value: '£650.00', note: 'Profit costs to claim hourly rates' },
  { label: 'Effective Date', value: '22 Dec 2025', note: 'Standard Crime Contract' },
];

export default function PoliceStationRatesPage() {
  return (
    <>
      {/* Navy header */}
      <section className="bg-[var(--navy)] py-10 sm:py-14">
        <div className="page-container !py-0">
          <Breadcrumbs
            light
            items={[
              { label: 'Home', href: '/' },
              { label: 'Police Station Rates', href: '/PoliceStationRates' },
            ]}
          />
          <h1 className="mt-3 text-h1 text-white">
            Police Station Legal Aid Rates 2025/26
          </h1>
          <p className="mt-3 max-w-2xl text-lg leading-relaxed text-white">
            The definitive guide to current police station legal aid rates, the harmonised fee
            structure, and escape fee calculations under the 2025 amendments.
          </p>
          <p className="mt-2 text-xs text-white">Updated: December 7, 2025</p>
        </div>
      </section>

      <div className="page-container">
      <ContentReliabilityNotice className="mb-8" />
      <CustodyNotePagePromo variant="compact" className="mb-10" />

      {/* Key Figures */}
      <div className="mb-14 grid grid-cols-1 gap-4 sm:grid-cols-3">
        {KEY_FIGURES.map((fig) => (
          <div
            key={fig.label}
            className="rounded-[var(--radius-lg)] border border-slate-600/50 bg-[var(--navy)] p-6 text-center"
          >
            <p className="text-sm font-medium text-white">{fig.label}</p>
            <p className="mt-1 text-3xl font-bold text-white">{fig.value}</p>
            <p className="mt-1 text-xs text-white">{fig.note}</p>
          </div>
        ))}
      </div>

      {/* Understanding the 2025 Amendments */}
      <section className="mb-14 rounded-[var(--radius-lg)] border border-[var(--card-border)] bg-[var(--card-bg)] p-8 shadow-[var(--card-shadow)]">
        <h2 className="text-h2 mb-4 text-[var(--navy)]">
          Understanding the 2025 Amendments
        </h2>
        <p className="mb-4 text-sm leading-relaxed text-[var(--muted)]">
          From <strong className="text-[var(--navy)]">22 December 2025</strong>, the Legal
          Aid Agency introduced a <strong className="text-[var(--navy)]">harmonised fixed fee</strong> of{' '}
          <strong className="text-[var(--navy)]">£320.00</strong> for all police station
          attendances. This replaces the previous split between higher and lower fee tiers, creating
          a single flat rate regardless of offence type or complexity.
        </p>
        <p className="text-sm leading-relaxed text-[var(--muted)]">
          The harmonisation aims to simplify billing, reduce disputes, and provide a fairer rate
          for routine attendances. However, the escape fee mechanism remains in place for cases
          that exceed the threshold in actual profit costs.
        </p>
      </section>

      {/* Impact Analysis */}
      <section className="mb-14">
        <h2 className="text-h2 mb-6 text-[var(--navy)]">Impact Analysis</h2>
        <div className="grid gap-5 sm:grid-cols-2">
          <div className="rounded-[var(--radius)] border border-[var(--card-border)] bg-[var(--card-bg)] p-6 shadow-[var(--card-shadow)]">
            <h3 className="font-semibold text-[var(--navy)]">For Representatives</h3>
            <ul className="mt-3 space-y-2 text-sm text-[var(--muted)]">
              <li className="flex gap-2">
                <span className="mt-0.5 shrink-0 text-emerald-600">✓</span>
                Single fee simplifies invoicing — one rate for every attendance
              </li>
              <li className="flex gap-2">
                <span className="mt-0.5 shrink-0 text-emerald-600">✓</span>
                Higher rate for cases previously in the lower tier
              </li>
              <li className="flex gap-2">
                <span className="mt-0.5 shrink-0 text-yellow-600">—</span>
                Lower rate for cases previously in the higher tier
              </li>
              <li className="flex gap-2">
                <span className="mt-0.5 shrink-0 text-emerald-600">✓</span>
                Escape mechanism still available for complex cases
              </li>
            </ul>
          </div>
          <div className="rounded-[var(--radius)] border border-[var(--card-border)] bg-[var(--card-bg)] p-6 shadow-[var(--card-shadow)]">
            <h3 className="font-semibold text-[var(--navy)]">For Solicitor Firms</h3>
            <ul className="mt-3 space-y-2 text-sm text-[var(--muted)]">
              <li className="flex gap-2">
                <span className="mt-0.5 shrink-0 text-emerald-600">✓</span>
                Predictable costs per police station attendance
              </li>
              <li className="flex gap-2">
                <span className="mt-0.5 shrink-0 text-emerald-600">✓</span>
                Simplified billing and reconciliation with LAA
              </li>
              <li className="flex gap-2">
                <span className="mt-0.5 shrink-0 text-emerald-600">✓</span>
                Clearer framework for instructing freelance reps
              </li>
              <li className="flex gap-2">
                <span className="mt-0.5 shrink-0 text-emerald-600">✓</span>
                Double fee provisions clarified for split attendances
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* Escape Fee Mechanism */}
      <section className="mb-14">
        <h2 className="text-h2 mb-6 text-[var(--navy)]">The New Escape Fee Mechanism</h2>
        <p className="mb-6 text-sm text-[var(--muted)]">
          If your profit costs exceed the escape threshold of{' '}
          <strong className="text-[var(--navy)]">£650.00</strong>, you can claim hourly rates
          instead of the fixed fee. Follow these two steps:
        </p>
        <div className="grid gap-5 sm:grid-cols-2">
          <div className="rounded-[var(--radius)] border border-[var(--card-border)] bg-[var(--card-bg)] p-6 shadow-[var(--card-shadow)]">
            <div className="mb-3 flex h-8 w-8 items-center justify-center rounded-full bg-[var(--gold)]/20 text-sm font-bold text-[var(--gold)]">
              1
            </div>
            <h3 className="font-semibold text-[var(--navy)]">Calculate Profit Costs</h3>
            <p className="mt-2 text-sm leading-relaxed text-[var(--muted)]">
              Total up all your time spent on the case at the applicable hourly rates (preparation,
              attendance, travel, waiting). Include all fee-earner time but exclude disbursements.
              If the total exceeds £650.00, you have &quot;escaped&quot; the fixed fee.
            </p>
          </div>
          <div className="rounded-[var(--radius)] border border-[var(--card-border)] bg-[var(--card-bg)] p-6 shadow-[var(--card-shadow)]">
            <div className="mb-3 flex h-8 w-8 items-center justify-center rounded-full bg-[var(--gold)]/20 text-sm font-bold text-[var(--gold)]">
              2
            </div>
            <h3 className="font-semibold text-[var(--navy)]">Compare to Threshold</h3>
            <p className="mt-2 text-sm leading-relaxed text-[var(--muted)]">
              If your profit costs exceed the £650.00 threshold, submit a claim for the actual
              hourly rate costs instead of the £320.00 fixed fee. You must retain detailed
              time-recording evidence to support the escape claim.
            </p>
          </div>
        </div>
      </section>

      {/* Claiming Multiple Fees */}
      <section className="mb-14 rounded-[var(--radius-lg)] border border-[var(--card-border)] bg-[var(--card-bg)] p-8 shadow-[var(--card-shadow)]">
        <h2 className="text-h2 mb-6 text-[var(--navy)]">Claiming Multiple Fees</h2>
        <div className="grid gap-6 sm:grid-cols-2">
          <div>
            <h3 className="mb-3 font-semibold text-emerald-700">Claim Two Fees If:</h3>
            <ul className="space-y-2 text-sm text-[var(--muted)]">
              <li className="flex gap-2">
                <span className="mt-0.5 shrink-0 text-emerald-600">✓</span>
                The client is released and then re-arrested on a separate matter
              </li>
              <li className="flex gap-2">
                <span className="mt-0.5 shrink-0 text-emerald-600">✓</span>
                There are two separate detention periods with a break between them
              </li>
              <li className="flex gap-2">
                <span className="mt-0.5 shrink-0 text-emerald-600">✓</span>
                You are instructed for two genuinely distinct matters in separate attendances
              </li>
            </ul>
          </div>
          <div>
            <h3 className="mb-3 font-semibold text-yellow-700">Single Fee Only If:</h3>
            <ul className="space-y-2 text-sm text-[var(--muted)]">
              <li className="flex gap-2">
                <span className="mt-0.5 shrink-0 text-yellow-600">—</span>
                Multiple offences arise from the same incident or detention period
              </li>
              <li className="flex gap-2">
                <span className="mt-0.5 shrink-0 text-yellow-600">—</span>
                Additional interviews take place during the same continuous detention
              </li>
              <li className="flex gap-2">
                <span className="mt-0.5 shrink-0 text-yellow-600">—</span>
                A single attendance covers multiple connected matters
              </li>
            </ul>
          </div>
        </div>
      </section>

      <GuideEmailCapture
        className="mb-14"
        title="Get the police station rates summary by email"
        description="A one-page PDF of the 2025/26 fees, escape threshold, and multiple-fee rules — handy for billing. No spam."
        source="rates-page"
        leadMagnet="Police station Legal Aid rates summary 2025/26"
        buttonLabel="Email me the summary"
      />

      {/* Resources */}
      <section>
        <h2 className="text-h2 mb-6 text-[var(--navy)]">Related Resources</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          <Link
            href="/FormsLibrary"
            className="block rounded-[var(--radius)] border border-[var(--card-border)] bg-[var(--card-bg)] p-5 no-underline shadow-[var(--card-shadow)] transition-all hover:border-[var(--gold)]/40 hover:shadow-[var(--card-shadow-hover)]"
          >
            <p className="font-medium text-[var(--navy)]">Forms Library</p>
            <p className="mt-1 text-sm text-[var(--muted)]">CRM1, CRM2 &amp; billing templates</p>
          </Link>
          <Link
            href="/GetWork"
            className="block rounded-[var(--radius)] border border-[var(--card-border)] bg-[var(--card-bg)] p-5 no-underline shadow-[var(--card-shadow)] transition-all hover:border-[var(--gold)]/40 hover:shadow-[var(--card-shadow-hover)]"
          >
            <p className="font-medium text-[var(--navy)]">Get Work Guide</p>
            <p className="mt-1 text-sm text-[var(--muted)]">Maximise your earning potential</p>
          </Link>
          <Link
            href="/Wiki"
            className="block rounded-[var(--radius)] border border-[var(--card-border)] bg-[var(--card-bg)] p-5 no-underline shadow-[var(--card-shadow)] transition-all hover:border-[var(--gold)]/40 hover:shadow-[var(--card-shadow-hover)]"
          >
            <p className="font-medium text-[var(--navy)]">Rep Knowledge Base</p>
            <p className="mt-1 text-sm text-[var(--muted)]">Training &amp; practice articles</p>
          </Link>
        </div>
      </section>

      <ResolvedContentSources className="mt-10" context={{ kind: 'page', path: '/PoliceStationRates' }} />
      </div>
    </>
  );
}
