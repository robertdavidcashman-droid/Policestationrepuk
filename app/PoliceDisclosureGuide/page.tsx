import Link from 'next/link';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { ContentReliabilityNotice } from '@/components/ContentReliabilityNotice';
import { ResolvedContentSources } from '@/components/ContentSourcesFooter';
import { CustodyNotePagePromo } from '@/components/CustodyNotePagePromo';
import { buildMetadata } from '@/lib/seo';
import {
  DISCLOSURE_FAQS,
  DISCLOSURE_IF_REFUSED,
  DISCLOSURE_ON_THIS_PAGE,
  DISCLOSURE_RELATED,
  DISCLOSURE_REP_USES,
  DISCLOSURE_TYPES,
} from '@/lib/guide-police-disclosure';

export const metadata = buildMetadata({
  title: 'Police Disclosure Guide | PoliceStationRepUK',
  description:
    'What is disclosure at the police station? PACE Code C paragraph 11.1A, basic vs fuller disclosure, how representatives use it, and what to do when disclosure is inadequate.',
  path: '/PoliceDisclosureGuide',
});

function SectionHeading({ id, children }: { id: string; children: React.ReactNode }) {
  return (
    <h2 id={id} className="text-h2 scroll-mt-24 text-[var(--navy)]">
      {children}
    </h2>
  );
}

export default function PoliceDisclosureGuidePage() {
  return (
    <>
      <section className="bg-[var(--navy)] py-12 sm:py-16">
        <div className="page-container !py-0">
          <Breadcrumbs
            light
            items={[
              { label: 'Home', href: '/' },
              { label: 'Resources', href: '/Resources' },
              { label: 'Police Disclosure Guide', href: '/PoliceDisclosureGuide' },
            ]}
          />
          <h1 className="mt-4 text-h1 text-white">Police Disclosure Explained</h1>
          <p className="mt-4 max-w-3xl text-lg leading-relaxed text-slate-300">
            What the police should tell your legal adviser before interview, how representatives
            use disclosure to advise you, and what happens when disclosure is inadequate — general
            information only, not legal advice.
          </p>
          <p className="mt-2 text-xs text-slate-400">
            Last updated: 1 June 2026 · Author: Robert Cashman, Duty Solicitor &amp; Higher Court Advocate
          </p>
        </div>
      </section>

      <div className="page-container">
        <div className="mx-auto max-w-4xl pb-12">
          <ContentReliabilityNotice className="mb-8" />

          <nav
            className="mb-12 rounded-[var(--radius-lg)] border border-[var(--card-border)] bg-[var(--card-bg)] p-5 shadow-[var(--card-shadow)] sm:p-6"
            aria-label="On this page"
          >
            <h2 className="text-sm font-bold uppercase tracking-wide text-[var(--muted)]">On this page</h2>
            <ul className="mt-3 columns-1 gap-x-8 text-sm sm:columns-2">
              {DISCLOSURE_ON_THIS_PAGE.map((item) => (
                <li key={item.id} className="mb-1.5 break-inside-avoid">
                  <a
                    href={`#${item.id}`}
                    className="font-medium text-[var(--navy)] underline decoration-[var(--gold)]/40 underline-offset-2 hover:decoration-[var(--gold)]"
                  >
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          <section className="mb-12">
            <SectionHeading id="who-for">Who this guide is for</SectionHeading>
            <p className="mt-3 text-sm leading-relaxed text-[var(--muted)]">
              Representatives and solicitors preparing for police station interviews; suspects and
              families wanting to understand why advisers ask for &quot;disclosure&quot; before interview.
              Pair with our{' '}
              <Link href="/InterviewUnderCaution" className="font-semibold text-[var(--navy)] underline">
                interview under caution guide
              </Link>
              .
            </p>
          </section>

          <section className="mb-12">
            <SectionHeading id="what">What is police disclosure?</SectionHeading>
            <p className="mt-3 text-sm leading-relaxed text-[var(--muted)]">
              Disclosure at the police station is the information the investigating officer gives
              your legal adviser about the allegation and the evidence the police rely on{' '}
              <em>before</em> interview. It is not the full CPIA prosecution disclosure package —
              it is enough (in theory) to allow meaningful advice on whether and how to answer
              questions.
            </p>
            <p className="mt-3 text-sm leading-relaxed text-[var(--muted)]">
              Without disclosure, it is difficult to advise on interview strategy, no comment,
              or a prepared statement. Representatives routinely ask the officer in the case for
              disclosure on arrival at custody; quality varies widely in practice.
            </p>
          </section>

          <section className="mb-12">
            <SectionHeading id="types">Basic vs fuller disclosure</SectionHeading>
            <p className="mt-3 text-sm leading-relaxed text-[var(--muted)]">
              There is no fixed statutory list of headings, but in practice disclosure often
              includes some or all of the following:
            </p>
            <div className="mt-6 grid gap-6 sm:grid-cols-2">
              {DISCLOSURE_TYPES.map((block) => (
                <div
                  key={block.title}
                  className="rounded-[var(--radius)] border border-[var(--card-border)] bg-[var(--card-bg)] p-5 shadow-[var(--card-shadow)]"
                >
                  <h3 className="font-bold text-[var(--navy)]">{block.title}</h3>
                  <ul className="mt-3 list-disc space-y-1.5 pl-5 text-sm leading-relaxed text-[var(--muted)]">
                    {block.items.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </section>

          <section className="mb-12">
            <SectionHeading id="rights">Your rights to disclosure</SectionHeading>
            <p className="mt-3 text-sm leading-relaxed text-[var(--muted)]">
              <a
                href="https://www.gov.uk/government/publications/pace-code-c-2023"
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold text-[var(--navy)] underline"
              >
                PACE Code C
              </a>{' '}
              (paragraph 11.1A) states that before interview the legal adviser should be given
              sufficient information to enable them to advise their client meaningfully.
            </p>
            <p className="mt-3 text-sm leading-relaxed text-[var(--muted)]">
              That does <strong className="text-[var(--navy)]">not</strong> require the police to
              disclose everything they hold. They may withhold material if disclosure would
              prejudice the investigation. The test is whether enough has been given for proper
              advice — a judgment your representative makes on the night.
            </p>
          </section>

          <section className="mb-12">
            <SectionHeading id="rep-use">How representatives use disclosure</SectionHeading>
            <ul className="mt-4 list-disc space-y-2 pl-6 text-sm leading-relaxed text-[var(--muted)]">
              {DISCLOSURE_REP_USES.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </section>

          <section className="mb-12">
            <SectionHeading id="refusal">If disclosure is inadequate</SectionHeading>
            <p className="mt-3 text-sm leading-relaxed text-[var(--muted)]">
              When the officer gives little or no meaningful disclosure, representatives may:
            </p>
            <ul className="mt-4 list-disc space-y-2 pl-6 text-sm leading-relaxed text-[var(--muted)]">
              {DISCLOSURE_IF_REFUSED.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
            <p className="mt-4 text-sm leading-relaxed text-[var(--muted)]">
              Inadequate disclosure can support a no-comment approach and may be relevant if the
              prosecution later seeks an adverse inference from silence — see our{' '}
              <Link href="/InterviewUnderCaution#adverse-inference" className="font-semibold text-[var(--navy)] underline">
                interview guide
              </Link>{' '}
              and the{' '}
              <a
                href="https://www.cps.gov.uk/legal-guidance/adverse-inferences"
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold text-[var(--navy)] underline"
              >
                CPS adverse inferences guidance
              </a>
              .
            </p>
          </section>

          <section className="mb-12">
            <SectionHeading id="limits">Limits and CPIA context</SectionHeading>
            <p className="mt-3 text-sm leading-relaxed text-[var(--muted)]">
              Police station disclosure supports immediate advice. Ongoing prosecution disclosure
              in criminal proceedings is governed by the{' '}
              <a
                href="https://www.legislation.gov.uk/ukpga/1996/25/contents"
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold text-[var(--navy)] underline"
              >
                Criminal Procedure and Investigations Act 1996
              </a>{' '}
              and the{' '}
              <a
                href="https://www.gov.uk/government/publications/attorney-generals-guidelines-on-disclosure"
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold text-[var(--navy)] underline"
              >
                Attorney General&apos;s Guidelines on Disclosure
              </a>
              . Material can emerge at different stages; representatives should not assume that
              everything known to the police has been disclosed before a first interview.
            </p>
          </section>

          <section className="mb-12">
            <SectionHeading id="faqs">Frequently asked questions</SectionHeading>
            <div className="mt-4 divide-y divide-[var(--border)] rounded-[var(--radius-lg)] border border-[var(--card-border)] bg-[var(--card-bg)]">
              {DISCLOSURE_FAQS.map((faq) => (
                <details key={faq.q} className="group px-5 py-4">
                  <summary className="cursor-pointer list-none font-semibold text-[var(--navy)] marker:content-none [&::-webkit-details-marker]:hidden">
                    <span className="flex items-start justify-between gap-3">
                      {faq.q}
                      <span className="shrink-0 text-[var(--gold)] transition-transform group-open:rotate-45">
                        +
                      </span>
                    </span>
                  </summary>
                  <p className="mt-3 text-sm leading-relaxed text-[var(--muted)]">{faq.a}</p>
                </details>
              ))}
            </div>
          </section>

          <section className="mb-12">
            <SectionHeading id="related">Related guides</SectionHeading>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              {DISCLOSURE_RELATED.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="block rounded-[var(--radius)] border border-[var(--card-border)] bg-[var(--card-bg)] p-4 no-underline shadow-[var(--card-shadow)] transition-all hover:border-[var(--gold)]/40 hover:shadow-[var(--card-shadow-hover)]"
                >
                  <p className="font-medium text-[var(--navy)]">{link.label}</p>
                  <p className="mt-1 text-sm text-[var(--muted)]">{link.desc}</p>
                </Link>
              ))}
            </div>
          </section>

          <ResolvedContentSources
            id="sources"
            className="mb-10"
            context={{ kind: 'page', path: '/PoliceDisclosureGuide' }}
          />

          <CustodyNotePagePromo variant="compact" className="mb-10" />

          <section className="rounded-[var(--radius-lg)] bg-[var(--navy)] p-8 text-center">
            <h2 className="text-xl font-bold text-white">Need help?</h2>
            <p className="mt-3 text-slate-300">Find an accredited police station representative or get in touch.</p>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
              <Link href="/directory" className="btn-gold no-underline">
                Find a Rep
              </Link>
              <Link
                href="/Contact"
                className="btn-outline !border-slate-500 !text-white hover:!border-[var(--gold)] hover:!text-[var(--gold)] no-underline"
              >
                Contact Us
              </Link>
            </div>
          </section>
        </div>
      </div>
    </>
  );
}
