import Link from 'next/link';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { ContentReliabilityNotice } from '@/components/ContentReliabilityNotice';
import { ResolvedContentSources } from '@/components/ContentSourcesFooter';
import { buildMetadata } from '@/lib/seo';

export const metadata = buildMetadata({
  title: "Magistrates' Court Legal Aid Fee Rates",
  description:
    "Magistrates' court legal aid standard fees for criminal defence: payment bands, higher and lower fees, Criminal Legal Aid Regulations.",
  path: '/MagistratesCourtFees',
});

const tableWrap = 'overflow-x-auto rounded-lg border border-slate-200';
const tableClass = 'w-full min-w-[520px] border-collapse text-left text-sm text-[var(--muted)]';
const th = 'border border-slate-200 bg-slate-50 px-3 py-2 font-semibold text-[var(--navy)]';
const td = 'border border-slate-200 px-3 py-2';

export default function MagistratesCourtFeesPage() {
  return (
    <>
      <section className="bg-[var(--navy)] py-10 sm:py-14">
        <div className="page-container !py-0">
          <Breadcrumbs
            light
            items={[
              { label: 'Home', href: '/' },
              { label: "Magistrates' court legal aid fee rates" },
            ]}
          />
          <h1 className="mt-3 text-h1 text-white">Magistrates&apos; court standard fees</h1>
          <p className="mt-3 max-w-2xl text-lg leading-relaxed text-slate-300">
            Legal aid payment rates for representation in the magistrates&apos; court under the Standard Fee scheme.
            Source: SI 2013/435 Schedule 4, paragraph 5, as amended (including SI 2025/1251 for amounts from 22 December 2025). Verify against
            current LAA guidance before claiming.
          </p>
        </div>
      </section>

      <div className="page-container">
        <div className="mx-auto max-w-4xl space-y-10 pb-12 pt-8">
          <ContentReliabilityNotice />
          <section className="space-y-4">
            <h2 className="text-h2 text-[var(--navy)]">How the standard fee scheme works</h2>
            <p className="text-[var(--muted)] leading-relaxed">
              Each case falls into a category (1A, 1B, or 2) and either a designated or undesignated court area. For each
              combination there is a lower standard fee, a higher standard fee, and matching fee limits.
            </p>
            <ol className="list-decimal space-y-2 pl-5 text-[var(--muted)] marker:text-[var(--gold)]">
              <li>Record all time at the hourly rates in the table below.</li>
              <li>Calculate total profit costs from that time recording.</li>
              <li>
                Compare total costs to the fee limits for your category and area:
                <ul className="mt-2 list-disc space-y-1 pl-5">
                  <li>At or below the lower limit → claim the lower standard fee.</li>
                  <li>Above the lower limit but at or below the higher limit → claim the higher standard fee.</li>
                  <li>Above the higher limit → you may escape the standard fee and claim assessed profit costs (subject to the rules).</li>
                </ul>
              </li>
            </ol>
          </section>

          <section className="space-y-4">
            <h2 className="text-h2 text-[var(--navy)]">Hourly rates for time recording</h2>
            <p className="text-[var(--muted)] leading-relaxed">These rates apply in all areas for recording time and for non-standard fee cases.</p>
            <div className={tableWrap}>
              <table className={tableClass}>
                <thead>
                  <tr>
                    <th className={th}>Work type</th>
                    <th className={th}>Rate (all areas)</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className={td}>Routine letters and telephone calls</td>
                    <td className={td}>£4.50 per item</td>
                  </tr>
                  <tr>
                    <td className={td}>Preparation</td>
                    <td className={td}>£57.37 per hour</td>
                  </tr>
                  <tr>
                    <td className={td}>Advocacy (including bail and applications)</td>
                    <td className={td}>£71.96 per hour</td>
                  </tr>
                  <tr>
                    <td className={td}>Attendance where counsel assigned (incl. conferences at court)</td>
                    <td className={td}>£39.25 per hour</td>
                  </tr>
                  <tr>
                    <td className={td}>Travelling and waiting</td>
                    <td className={td}>Only where undesignated area fees apply — £30.36 per hour</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p className="text-xs text-[var(--muted)]">Source: Schedule 4, paragraph 5(1), table.</p>
          </section>

          <section className="space-y-4">
            <h2 className="text-h2 text-[var(--navy)]">Standard fees — designated areas</h2>
            <div className={tableWrap}>
              <table className={tableClass}>
                <thead>
                  <tr>
                    <th className={th}>Category</th>
                    <th className={th}>Lower fee</th>
                    <th className={th}>Lower limit</th>
                    <th className={th}>Higher fee</th>
                    <th className={th}>Higher limit</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className={td}>1A</td>
                    <td className={td}>£314.62</td>
                    <td className={td}>£344.51</td>
                    <td className={td}>£596.84</td>
                    <td className={td}>£596.89</td>
                  </tr>
                  <tr>
                    <td className={td}>1B</td>
                    <td className={td}>£255.78</td>
                    <td className={td}>£344.51</td>
                    <td className={td}>£551.09</td>
                    <td className={td}>£596.89</td>
                  </tr>
                  <tr>
                    <td className={td}>2</td>
                    <td className={td}>£436.85</td>
                    <td className={td}>£591.82</td>
                    <td className={td}>£915.04</td>
                    <td className={td}>£986.25</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-h2 text-[var(--navy)]">Standard fees — undesignated areas</h2>
            <div className={tableWrap}>
              <table className={tableClass}>
                <thead>
                  <tr>
                    <th className={th}>Category</th>
                    <th className={th}>Lower fee</th>
                    <th className={th}>Lower limit</th>
                    <th className={th}>Higher fee</th>
                    <th className={th}>Higher limit</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className={td}>1A</td>
                    <td className={td}>£246.27</td>
                    <td className={td}>£344.51</td>
                    <td className={td}>£521.57</td>
                    <td className={td}>£596.89</td>
                  </tr>
                  <tr>
                    <td className={td}>1B</td>
                    <td className={td}>£200.21</td>
                    <td className={td}>£344.51</td>
                    <td className={td}>£481.59</td>
                    <td className={td}>£596.89</td>
                  </tr>
                  <tr>
                    <td className={td}>2</td>
                    <td className={td}>£353.51</td>
                    <td className={td}>£591.82</td>
                    <td className={td}>£810.79</td>
                    <td className={td}>£986.25</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p className="text-sm text-[var(--muted)]">
              Additional fee (paragraph 5(6)): for cases outside the standard fee payment scheme, an additional fee of
              £229.47 may be claimable where the rules allow.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-h2 text-[var(--navy)]">Category definitions (summary)</h2>
            <p className="text-[var(--muted)] leading-relaxed">
              Which category applies depends on the nature of the proceedings (paragraph 5(3)). This is a summary only —
              always read the regulations and current LAA guidance.
            </p>
            <div className="space-y-4 text-sm text-[var(--muted)] leading-relaxed">
              <div>
                <h3 className="font-bold text-[var(--navy)]">Category 1A</h3>
                <p className="mt-1">Either-way non-trial work — e.g. guilty pleas, offers of no evidence, bind overs, and related patterns listed in the rules.</p>
              </div>
              <div>
                <h3 className="font-bold text-[var(--navy)]">Category 1B</h3>
                <p className="mt-1">Summary non-trial work — e.g. summary-only guilty pleas, uncontested breaches, discontinued summary matters, and similar.</p>
              </div>
              <div>
                <h3 className="font-bold text-[var(--navy)]">Category 2</h3>
                <p className="mt-1">Contested hearings and trials — higher fee band reflects additional preparation and advocacy.</p>
              </div>
            </div>
          </section>

          <section className="space-y-3">
            <h2 className="text-h2 text-[var(--navy)]">Designated vs undesignated areas</h2>
            <p className="text-[var(--muted)] leading-relaxed">
              Designated areas generally reflect higher operating-cost courts under the Standard Crime Contract. Undesignated
              areas use lower standard fee figures but may allow travel and waiting at £30.36/hour where the rules permit.
              Confirm classification in your contract documentation or with your contract manager.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-h2 text-[var(--navy)]">Escaping the standard fee</h2>
            <p className="text-[var(--muted)] leading-relaxed">
              If assessed profit costs exceed the higher standard fee limit for your category, you may escape the standard
              fee and claim assessed costs at the hourly rates — subject to evidence and LAA rules.
            </p>
            <ul className="list-disc space-y-1 pl-5 text-[var(--muted)] marker:text-[var(--gold)]">
              <li>Categories 1A and 1B: higher limit £596.89</li>
              <li>Category 2: higher limit £986.25</li>
            </ul>
            <p className="text-[var(--muted)] leading-relaxed">Maintain time records on every file — not only when you expect to escape.</p>
          </section>

          <section className="space-y-3">
            <h2 className="text-h2 text-[var(--navy)]">Youth court, VAT, disbursements</h2>
            <ul className="list-disc space-y-2 pl-5 text-[var(--muted)] marker:text-[var(--gold)]">
              <li>Youth court has its own fee scheme under Schedule 4 — see the regulations for detail.</li>
              <li>Figures are usually exclusive of VAT where VAT applies.</li>
              <li>Reasonable disbursements are claimed separately; prior authority may be needed.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-h2 text-[var(--navy)]">Official resources</h2>
            <ul className="list-disc space-y-2 pl-5 text-[var(--muted)] marker:text-[var(--gold)]">
              <li>
                <a
                  href="https://www.legislation.gov.uk/uksi/2013/435/contents"
                  className="font-semibold text-[var(--navy)] underline"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  SI 2013/435
                </a>{' '}
                — primary regulations
              </li>
              <li>
                <a
                  href="https://www.legislation.gov.uk/uksi/2025/1251/contents/made"
                  className="font-semibold text-[var(--navy)] underline"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  SI 2025/1251
                </a>{' '}
                — recent fee updates
              </li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-h2 text-[var(--navy)]">Related on this site</h2>
            <ul className="space-y-2 text-[var(--muted)]">
              <li>
                <Link href="/PoliceStationRepPay" className="font-semibold text-[var(--navy)] underline">
                  Police station rates and fixed fees
                </Link>
              </li>
              <li>
                <Link href="/CrownCourtFees" className="font-semibold text-[var(--navy)] underline">
                  Crown Court fees overview
                </Link>
              </li>
              <li>
                <Link href="/EscapeFeeCalculator" className="font-semibold text-[var(--navy)] underline">
                  Escape fee calculator
                </Link>
              </li>
            </ul>
            <p className="text-sm text-[var(--muted)]">
              Disclaimer: information only — not legal or financial advice. Verify all figures before billing.
            </p>
          </section>

          <ResolvedContentSources className="mb-10" context={{ kind: 'page', path: '/MagistratesCourtFees' }} />

          <section className="rounded-[var(--radius-lg)] bg-[var(--navy)] p-8 text-center">
            <h2 className="text-xl font-bold text-white">Need help?</h2>
            <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
              <Link href="/directory" className="btn-gold no-underline">
                Find a rep
              </Link>
              <Link href="/Contact" className="btn-outline no-underline">
                Contact us
              </Link>
            </div>
          </section>
        </div>
      </div>
    </>
  );
}
