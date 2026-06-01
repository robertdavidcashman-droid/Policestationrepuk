import Link from 'next/link';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { ContentReliabilityNotice } from '@/components/ContentReliabilityNotice';
import { ResolvedContentSources } from '@/components/ContentSourcesFooter';
import { CustodyNotePagePromo } from '@/components/CustodyNotePagePromo';
import { buildMetadata } from '@/lib/seo';
import {
  INTERVIEW_FAQS,
  INTERVIEW_ON_THIS_PAGE,
  INTERVIEW_OPTIONS,
  INTERVIEW_RELATED,
  INTERVIEW_RIGHTS,
  INTERVIEW_STEPS,
  STANDARD_CAUTION,
} from '@/lib/guide-interview-under-caution';

export const metadata = buildMetadata({
  title: 'Interview Under Caution Guide | PoliceStationRepUK',
  description:
    'Plain-English guide to police interviews under caution in England and Wales: the caution, PACE Code C rights, adverse inference, what your rep does, and answer vs silence vs prepared statement.',
  path: '/InterviewUnderCaution',
});

function SectionHeading({ id, children }: { id: string; children: React.ReactNode }) {
  return (
    <h2 id={id} className="text-h2 scroll-mt-24 text-[var(--navy)]">
      {children}
    </h2>
  );
}

export default function InterviewUnderCautionPage() {
  return (
    <>
      <section className="bg-[var(--navy)] py-12 sm:py-16">
        <div className="page-container !py-0">
          <Breadcrumbs
            light
            items={[
              { label: 'Home', href: '/' },
              { label: 'Resources', href: '/Resources' },
              { label: 'Interview Under Caution', href: '/InterviewUnderCaution' },
            ]}
          />
          <h1 className="mt-4 text-h1 text-white">What Happens in a Police Interview Under Caution?</h1>
          <p className="mt-4 max-w-3xl text-lg leading-relaxed text-white">
            A structured guide to recorded police interviews in England and Wales: the caution,
            your PACE rights, the interview process, the role of your representative, and the
            main strategic options — general information only, not legal advice.
          </p>
          <p className="mt-2 text-xs text-slate-300">
            Last updated: 1 June 2026 · Author: Robert Cashman, Duty Solicitor &amp; Higher Court Advocate
          </p>
        </div>
      </section>

      <div className="page-container">
        <div className="mx-auto max-w-4xl pb-12">
          <ContentReliabilityNotice className="mb-8" />

          <div className="mb-10 rounded-[var(--radius-lg)] border border-amber-300 bg-amber-50 p-6">
            <h2 className="text-base font-bold text-amber-900">If someone is in custody now</h2>
            <p className="mt-2 text-sm leading-relaxed text-amber-900">
              Ask the custody officer for the duty solicitor immediately. Legal advice at the
              police station is free in most cases and confidential. Do not rely on this page for
              live tactical decisions.
            </p>
          </div>

          <nav
            className="mb-12 rounded-[var(--radius-lg)] border border-[var(--card-border)] bg-[var(--card-bg)] p-5 shadow-[var(--card-shadow)] sm:p-6"
            aria-label="On this page"
          >
            <h2 className="text-sm font-bold uppercase tracking-wide text-[var(--muted)]">On this page</h2>
            <ul className="mt-3 columns-1 gap-x-8 text-sm sm:columns-2">
              {INTERVIEW_ON_THIS_PAGE.map((item) => (
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
              Suspects and family members wanting to understand the process; trainee and accredited
              police station representatives; criminal defence solicitors and paralegals. It
              complements our{' '}
              <Link href="/BeginnersGuide" className="font-semibold text-[var(--navy)] underline">
                beginner&apos;s guide
              </Link>{' '}
              and{' '}
              <Link href="/PoliceDisclosureGuide" className="font-semibold text-[var(--navy)] underline">
                disclosure guide
              </Link>
              .
            </p>
          </section>

          <section className="mb-12">
            <SectionHeading id="when">When interviews under caution happen</SectionHeading>
            <p className="mt-3 text-sm leading-relaxed text-[var(--muted)]">
              A person is interviewed &quot;under caution&quot; when they are suspected of an offence and
              police intend to ask questions about it. This usually happens after arrest and
              detention in a custody suite, or at a voluntary attendance where the same caution
              applies. The interview must comply with{' '}
              <a
                href="https://www.gov.uk/government/publications/pace-code-c-2023"
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold text-[var(--navy)] underline"
              >
                PACE Code C
              </a>{' '}
              (detention, treatment, and questioning).
            </p>
            <p className="mt-3 text-sm leading-relaxed text-[var(--muted)]">
              If you have requested legal advice, interview should not normally begin until you
              have had a reasonable opportunity to consult your solicitor or representative in
              private — and, in practice, after your adviser has taken disclosure from the
              investigating officer.
            </p>
          </section>

          <section className="mb-12">
            <SectionHeading id="caution">The police caution</SectionHeading>
            <blockquote className="mt-4 rounded-[var(--radius-lg)] border-l-4 border-[var(--gold)] bg-slate-50 p-5 text-sm italic leading-relaxed text-[var(--navy)]">
              &ldquo;{STANDARD_CAUTION}&rdquo;
            </blockquote>
            <p className="mt-4 text-sm leading-relaxed text-[var(--muted)]">
              The caution is given before questioning. In plain terms it has three parts:
            </p>
            <ul className="mt-4 list-disc space-y-2 pl-6 text-sm leading-relaxed text-[var(--muted)]">
              <li>
                <strong className="text-[var(--navy)]">You do not have to say anything</strong> —
                silence is a legal choice; you cannot be forced to answer.
              </li>
              <li>
                <strong className="text-[var(--navy)]">But it may harm your defence…</strong> — if
                you later rely in court on a fact you did not mention when questioned, a court may
                draw an adverse inference in certain circumstances (see below).
              </li>
              <li>
                <strong className="text-[var(--navy)]">Anything you do say may be given in evidence</strong>{' '}
                — answers are recorded and may be played to a court whether they help or hurt your
                case.
              </li>
            </ul>
          </section>

          <section className="mb-12">
            <SectionHeading id="adverse-inference">Silence and adverse inference</SectionHeading>
            <p className="mt-3 text-sm leading-relaxed text-[var(--muted)]">
              Silence is not an admission of guilt. However,{' '}
              <a
                href="https://www.legislation.gov.uk/ukpga/1994/33/section/34"
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold text-[var(--navy)] underline"
              >
                section 34 of the Criminal Justice and Public Order Act 1994
              </a>{' '}
              allows a court in certain circumstances to draw an inference when a defendant fails
              to mention a fact when questioned under caution that they later rely on at trial.
              The conditions are technical; the{' '}
              <a
                href="https://www.cps.gov.uk/legal-guidance/adverse-inferences"
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold text-[var(--navy)] underline"
              >
                CPS adverse inferences guidance
              </a>{' '}
              summarises the prosecution approach.
            </p>
            <p className="mt-3 text-sm leading-relaxed text-[var(--muted)]">
              That is why representatives weigh disclosure, strength of evidence, and your
              instructions before advising answer, no comment, or a prepared statement. Poor
              disclosure can support a no-comment strategy — see our{' '}
              <Link href="/PoliceDisclosureGuide" className="font-semibold text-[var(--navy)] underline">
                police disclosure guide
              </Link>
              .
            </p>
          </section>

          <section className="mb-12">
            <SectionHeading id="process">What happens step by step</SectionHeading>
            <ol className="mt-6 space-y-4">
              {INTERVIEW_STEPS.map((step) => (
                <li
                  key={step.n}
                  className="flex gap-4 rounded-[var(--radius)] border border-[var(--card-border)] bg-[var(--card-bg)] p-5 shadow-[var(--card-shadow)]"
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--navy)] text-sm font-bold text-white">
                    {step.n}
                  </span>
                  <div>
                    <h3 className="font-bold text-[var(--navy)]">{step.title}</h3>
                    <p
                      className="mt-1 text-sm leading-relaxed text-[var(--muted)]"
                      dangerouslySetInnerHTML={{ __html: step.body }}
                    />
                  </div>
                </li>
              ))}
            </ol>
          </section>

          <section className="mb-12">
            <SectionHeading id="rights">Your rights in interview</SectionHeading>
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              {INTERVIEW_RIGHTS.map((r) => (
                <div
                  key={r.title}
                  className="rounded-[var(--radius)] border border-[var(--card-border)] bg-[var(--card-bg)] p-5 shadow-[var(--card-shadow)]"
                >
                  <h3 className="font-bold text-[var(--navy)]">{r.title}</h3>
                  <p
                    className="mt-2 text-sm leading-relaxed text-[var(--muted)]"
                    dangerouslySetInnerHTML={{ __html: r.body }}
                  />
                </div>
              ))}
            </div>
          </section>

          <section className="mb-12">
            <SectionHeading id="rep-role">What your representative does in interview</SectionHeading>
            <ul className="mt-4 list-disc space-y-2 pl-6 text-sm leading-relaxed text-[var(--muted)]">
              <li>Sits with you throughout the recorded interview</li>
              <li>Takes a note of questions and your answers</li>
              <li>Intervenes if questions are improper, oppressive, or outside fair disclosure</li>
              <li>Requests breaks so you can consult in private</li>
              <li>Raises PACE and welfare issues (interpreter, appropriate adult, fitness)</li>
              <li>Can read a prepared statement on your behalf if that is the agreed strategy</li>
            </ul>
            <p className="mt-4 text-sm leading-relaxed text-[var(--muted)]">
              The representative does not answer questions for you. Their job is to protect your
              rights and support the strategy agreed in private consultation.
            </p>
          </section>

          <section className="mb-12">
            <SectionHeading id="options">Answer, silence, or prepared statement</SectionHeading>
            <p className="mt-3 text-sm leading-relaxed text-[var(--muted)]">
              There is no single correct approach for every case. Your representative&apos;s advice
              depends on disclosure, evidence, and your instructions.
            </p>
            <div className="mt-6 space-y-4">
              {INTERVIEW_OPTIONS.map((opt) => (
                <div
                  key={opt.title}
                  className="rounded-[var(--radius)] border border-[var(--card-border)] bg-[var(--card-bg)] p-5 shadow-[var(--card-shadow)]"
                >
                  <h3 className="font-bold text-[var(--navy)]">{opt.title}</h3>
                  <p
                    className="mt-2 text-sm leading-relaxed text-[var(--muted)]"
                    dangerouslySetInnerHTML={{ __html: opt.body }}
                  />
                  <p className="mt-2 text-sm text-[var(--muted)]">
                    <strong className="text-[var(--navy)]">Often considered when:</strong>{' '}
                    <span dangerouslySetInnerHTML={{ __html: opt.when }} />
                  </p>
                </div>
              ))}
            </div>
          </section>

          <section className="mb-12">
            <SectionHeading id="after">After the interview</SectionHeading>
            <p className="mt-3 text-sm leading-relaxed text-[var(--muted)]">
              The police decide next steps: release without charge, bail (with or without
              conditions), or charge. Further interviews may follow if new evidence emerges. Your
              representative&apos;s attendance note and the sealed recording form part of the case
              file. If you are charged, the matter moves to the magistrates&apos; or Crown Court and
              CPIA disclosure obligations continue through your defence firm.
            </p>
          </section>

          <section className="mb-12">
            <SectionHeading id="faqs">Frequently asked questions</SectionHeading>
            <div className="mt-4 divide-y divide-[var(--border)] rounded-[var(--radius-lg)] border border-[var(--card-border)] bg-[var(--card-bg)]">
              {INTERVIEW_FAQS.map((faq) => (
                <details key={faq.q} className="group px-5 py-4">
                  <summary className="cursor-pointer list-none font-semibold text-[var(--navy)] marker:content-none [&::-webkit-details-marker]:hidden">
                    <span className="flex items-start justify-between gap-3">
                      {faq.q}
                      <span className="shrink-0 text-[var(--gold)] transition-transform group-open:rotate-45">
                        +
                      </span>
                    </span>
                  </summary>
                  <p
                    className="mt-3 text-sm leading-relaxed text-[var(--muted)]"
                    dangerouslySetInnerHTML={{ __html: faq.a }}
                  />
                </details>
              ))}
            </div>
          </section>

          <section className="mb-12">
            <SectionHeading id="related">Related guides</SectionHeading>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              {INTERVIEW_RELATED.map((link) => (
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
            context={{ kind: 'page', path: '/InterviewUnderCaution' }}
          />

          <CustodyNotePagePromo variant="compact" className="mb-10" />

          <section className="rounded-[var(--radius-lg)] bg-[var(--navy)] p-8 text-center">
            <h2 className="text-xl font-bold text-white">Need help at the police station?</h2>
            <p className="mt-3 text-slate-300">
              Find an accredited representative or contact us — general information only, not legal advice.
            </p>
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
