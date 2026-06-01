import Link from 'next/link';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { ContentReliabilityNotice } from '@/components/ContentReliabilityNotice';
import { buildMetadata } from '@/lib/seo';

export const metadata = buildMetadata({
  title: 'Police Station Rep Pay Rates — Legal Aid Fees Explained',
  description:
    'Complete guide to Legal Aid fee rates for police station representatives in England and Wales. Rates updated 22nd December 2025 per SI 2025/1251.',
  path: '/PoliceStationRepPay',
});

const CONTENTS = [
  { id: 'how-pay-works', label: 'How police station pay works' },
  { id: 'fee-rates', label: 'Legal Aid fee rates (December 2025)' },
  { id: 'escape', label: 'Escape fee cases' },
  { id: 'earnings', label: 'Realistic earnings' },
  { id: 'faq', label: 'Frequently asked questions' },
  { id: 'references', label: 'References' },
];

export default function PoliceStationRepPayPage() {
  return (
    <>
      <section className="bg-[var(--navy)] py-10 sm:py-14">
        <div className="page-container !py-0">
          <Breadcrumbs
            light
            items={[
              { label: 'Home', href: '/' },
              { label: 'Police station rep pay' },
            ]}
          />
          <h1 className="mt-3 text-h1 text-white">Police station representative pay rates</h1>
          <p className="mt-3 max-w-2xl text-lg leading-relaxed text-slate-300">
            How Legal Aid fixed fees and firm arrangements typically translate into rep pay in England and Wales. Rates
            updated 22 December 2025 (SI 2025/1251) — always confirm with the LAA and your contract.
          </p>
        </div>
      </section>

      <div className="page-container">
        <div className="mx-auto max-w-4xl space-y-10 pb-12 pt-8">
          <ContentReliabilityNotice />
          <section>
            <h2 className="text-h2 text-[var(--navy)]">Contents</h2>
            <ul className="mt-3 list-decimal space-y-1 pl-5 text-[var(--muted)] marker:text-[var(--gold)]">
              {CONTENTS.map((c, i) => (
                <li key={c.id}>
                  <a href={`#${c.id}`} className="font-medium text-[var(--navy)] underline decoration-[var(--gold)]/50 underline-offset-2 hover:decoration-[var(--gold)]">
                    {i + 1}. {c.label}
                  </a>
                </li>
              ))}
            </ul>
          </section>

          <section id="important" className="space-y-3">
            <h2 className="text-h2 text-[var(--navy)]">Important: how reps get paid</h2>
            <p className="text-[var(--muted)] leading-relaxed">
              Police station representatives usually work as freelancers for criminal defence firms. The firm claims the
              Legal Aid fee and pays the representative under a separate agreement (often a share of the fixed fee or an
              hourly rate).
            </p>
            <p className="text-[var(--muted)] leading-relaxed">
              Rates vary by firm, experience, and hours offered. Nothing on this page overrides your contract or insurer.
            </p>
          </section>

          <section id="how-pay-works" className="space-y-3 scroll-mt-8">
            <h2 className="text-h2 text-[var(--navy)]">How police station pay works</h2>
            <p className="text-[var(--muted)] leading-relaxed">
              Police station work is primarily funded through legal aid. Fixed fees are paid to the solicitor&apos;s firm
              holding a Crime Contract. Representatives are paid by the firm — as employees or freelancers. Common models
              include a percentage of the fixed fee (often in the 50–70% range), an hourly rate (often roughly £20–£35
              depending on experience), or a flat fee per attendance.
            </p>
          </section>

          <section id="fee-rates" className="space-y-3 scroll-mt-8">
            <h2 className="text-h2 text-[var(--navy)]">Legal Aid fee rates (December 2025)</h2>
            <ul className="list-disc space-y-2 pl-5 text-[var(--muted)] leading-relaxed marker:text-[var(--gold)]">
              <li>
                <strong className="text-[var(--navy)]">Police station fixed fee (all areas):</strong> £320.00 (harmonised
                rate from 22 Dec 2025).
              </li>
              <li>
                <strong className="text-[var(--navy)]">Escape fee threshold:</strong> £650.00 (unified threshold for
                hourly billing where escape applies).
              </li>
              <li>
                <strong className="text-[var(--navy)]">Mileage:</strong> 45p/mile for the first 10,000 miles per annum,
                25p/mile thereafter (AMAP-style rates as used in criminal billing — confirm in your contract).
              </li>
            </ul>
            <p className="text-sm text-[var(--muted)]">
              Source: The Criminal Legal Aid (General and Remuneration) (Amendment) Regulations 2025 (SI 2025/1251).
              Verify current figures with the Legal Aid Agency before claiming.
            </p>
          </section>

          <section id="escape" className="space-y-3 scroll-mt-8">
            <h2 className="text-h2 text-[var(--navy)]">Escape fee cases</h2>
            <p className="text-[var(--muted)] leading-relaxed">
              If a case needs significantly more work than average, it may qualify for escape from the fixed fee so the firm
              can claim hourly rates instead. Whether work exceeds the threshold depends on time recording and the rules in
              force. Long interviews, multiple attendances, or unusual complexity are typical triggers to review with your
              fee earner.
            </p>
          </section>

          <section id="earnings" className="space-y-3 scroll-mt-8">
            <h2 className="text-h2 text-[var(--navy)]">Realistic earnings potential</h2>
            <p className="text-[var(--muted)] leading-relaxed">
              Earnings depend on location, how often you work unsocial hours, reputation, and how many firms instruct you. A
              busy full-time rep might handle many cases per week; part-time reps fewer. Many people combine police station
              work with other employment.
            </p>
          </section>

          <section id="faq" className="space-y-4 scroll-mt-8">
            <h2 className="text-h2 text-[var(--navy)]">Frequently asked questions</h2>
            <div className="space-y-4 text-[var(--muted)] leading-relaxed">
              <p>
                <strong className="text-[var(--navy)]">How much do police station representatives earn?</strong> The legal
                aid fixed fee is £320 per case (from Dec 2025), but reps typically receive a negotiated share (often roughly
                £100–£180 per case) or an hourly rate. Full-time volume can support mid-range salaries in line with your
                hours and region — there is no single figure.
              </p>
              <p>
                <strong className="text-[var(--navy)]">Do reps get paid for travel?</strong> Travel is usually reimbursed
                under firm policy and LAA rules. Mileage is often paid at AMAP-style rates; confirm with your instructing
                firm.
              </p>
              <p>
                <strong className="text-[var(--navy)]">Employed or self-employed?</strong> Most reps invoice firms as
                self-employed; some are employed. Your tax status follows your facts and contracts.
              </p>
              <p>
                <strong className="text-[var(--navy)]">More pay for nights and weekends?</strong> The fixed fee is the same
                whenever work is done, but firms often pay more or offer more work to reps who cover unsocial hours.
              </p>
              <p>
                <strong className="text-[var(--navy)]">When did rates last change?</strong> A major harmonisation took
                effect on 22 December 2025 under SI 2025/1251 (£320 fixed fee and £650 escape threshold across schemes).
              </p>
            </div>
          </section>

          <section className="space-y-3">
            <h2 className="text-h2 text-[var(--navy)]">Interested in police station work?</h2>
            <p className="text-[var(--muted)] leading-relaxed">
              Start with our guide to accreditation and building a practice, then browse firms and listings on the
              directory.
            </p>
            <p className="flex flex-wrap gap-4">
              <Link href="/HowToBecomePoliceStationRep" className="font-semibold text-[var(--navy)] underline decoration-[var(--gold)] underline-offset-2">
                How to become a rep →
              </Link>
              <Link href="/Blog/police-station-rep-fee-rates-2026" className="font-semibold text-[var(--navy)] underline decoration-[var(--gold)] underline-offset-2">
                Blog: fee rates context →
              </Link>
            </p>
          </section>

          <section id="references" className="space-y-3 scroll-mt-8">
            <h2 className="text-h2 text-[var(--navy)]">References</h2>
            <ul className="list-disc space-y-2 pl-5 text-[var(--muted)] marker:text-[var(--gold)]">
              <li>
                <a
                  href="https://www.legislation.gov.uk/uksi/2025/1251/contents/made"
                  className="font-medium text-[var(--navy)] underline decoration-[var(--gold)]/50 underline-offset-2 hover:decoration-[var(--gold)]"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  SI 2025/1251
                </a>{' '}
                — Criminal Legal Aid (General and Remuneration) (Amendment) Regulations 2025
              </li>
              <li>
                <a
                  href="https://www.gov.uk/government/organisations/legal-aid-agency"
                  className="font-medium text-[var(--navy)] underline decoration-[var(--gold)]/50 underline-offset-2 hover:decoration-[var(--gold)]"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Legal Aid Agency
                </a>{' '}
                — guidance and contract updates
              </li>
              <li>
                <a
                  href="https://www.gov.uk/guidance/criminal-legal-aid-manual"
                  className="font-medium text-[var(--navy)] underline decoration-[var(--gold)]/50 underline-offset-2 hover:decoration-[var(--gold)]"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Criminal Legal Aid Manual
                </a>
              </li>
            </ul>
          </section>

          <section className="rounded-[var(--radius-lg)] bg-[var(--navy)] p-8 text-center">
            <h2 className="text-xl font-bold text-white">Need help?</h2>
            <p className="mt-2 text-slate-300">
              Find an accredited police station representative or get in touch with our team.
            </p>
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
