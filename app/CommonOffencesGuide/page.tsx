import Link from 'next/link';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { ContentReliabilityNotice } from '@/components/ContentReliabilityNotice';
import { ContentSourcesFooter } from '@/components/ContentSourcesFooter';
import {
  COMMON_OFFENCES,
  CRIMINAL_LAW_PRINCIPLES,
  GENERAL_DEFENCES,
  type CaseLawRef,
  type OffenceGuideEntry,
} from '@/lib/common-offences-guide';
import { getContentSources } from '@/lib/content-sources';
import { buildMetadata } from '@/lib/seo';

export const metadata = buildMetadata({
  title: 'Common Offences Guide — Actus Reus, Mens Rea, Defences & Sentencing',
  description:
    'Police station reference for common criminal offences in England and Wales: elements, verified case law, defences, and Sentencing Council guidelines. For accredited reps and criminal defence professionals.',
  path: '/CommonOffencesGuide',
});

const ON_THIS_PAGE = [
  { id: 'who-its-for', label: 'Who this guide is for' },
  { id: 'principles', label: 'Actus reus & mens rea' },
  { id: 'offences', label: 'Common offences' },
  { id: 'defences', label: 'General defences' },
  { id: 'sentencing', label: 'Sentencing guidelines' },
  { id: 'sources', label: 'Sources & case law' },
];

const RELATED = [
  { href: '/PACE', label: 'PACE Codes quick reference', desc: 'Detention times, caution, reviews' },
  { href: '/BeginnersGuide', label: "Beginner's guide", desc: 'Custody lifecycle and PACE rights' },
  { href: '/InterviewUnderCaution', label: 'Interview under caution', desc: 'Strategy and adverse inference' },
  { href: '/PoliceDisclosureGuide', label: 'Disclosure at the police station', desc: 'What to ask the OIC' },
  { href: '/Wiki', label: 'Knowledge base', desc: '49+ training articles for reps' },
  { href: '/Resources', label: 'Resources hub', desc: 'Legislation, CPS, Sentencing Council links' },
];

function SectionHeading({ id, children }: { id: string; children: React.ReactNode }) {
  return (
    <h2 id={id} className="text-h2 scroll-mt-24 text-[var(--navy)]">
      {children}
    </h2>
  );
}

function CaseLawList({ cases }: { cases: CaseLawRef[] }) {
  if (cases.length === 0) return null;
  return (
    <div className="mt-4">
      <h4 className="text-sm font-bold uppercase tracking-wide text-[var(--muted)]">Verified case law</h4>
      <ul className="mt-2 space-y-3">
        {cases.map((c) => (
          <li
            key={c.citation + c.name}
            className="rounded-[var(--radius)] border border-[var(--card-border)] bg-[var(--gold-pale)]/30 p-4"
          >
            <p className="font-semibold text-[var(--navy)]">
              {c.url ? (
                <a
                  href={c.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[var(--navy)] underline decoration-[var(--gold)]/40 underline-offset-2 hover:decoration-[var(--gold)]"
                >
                  {c.name}
                </a>
              ) : (
                c.name
              )}
              <span className="ml-2 font-normal text-[var(--muted)]">{c.citation}</span>
            </p>
            <p className="mt-1 text-sm leading-relaxed text-[var(--muted)]">{c.holding}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}

function ElementList({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="mt-4">
      <h4 className="text-sm font-bold uppercase tracking-wide text-[var(--muted)]">{title}</h4>
      <ul className="mt-2 list-inside list-disc space-y-1.5 text-sm leading-relaxed text-[var(--muted)]">
        {items.map((item, i) => (
          <li key={i}>{item}</li>
        ))}
      </ul>
    </div>
  );
}

function OffenceCard({ offence }: { offence: OffenceGuideEntry }) {
  return (
    <article
      id={offence.id}
      className="scroll-mt-24 rounded-[var(--radius-lg)] border border-[var(--card-border)] bg-[var(--card-bg)] p-6 shadow-[var(--card-shadow)] sm:p-8"
    >
      <h3 className="text-xl font-bold text-[var(--navy)]">{offence.title}</h3>
      <p className="mt-1 text-sm font-medium text-[var(--gold-link)]">
        <a
          href={offence.legislationUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="underline-offset-2 hover:underline"
        >
          {offence.statute}
        </a>
      </p>

      <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
        <div>
          <dt className="font-semibold text-[var(--navy)]">Triable</dt>
          <dd className="text-[var(--muted)]">{offence.triable}</dd>
        </div>
        <div>
          <dt className="font-semibold text-[var(--navy)]">Maximum penalty</dt>
          <dd className="text-[var(--muted)]">{offence.maxPenalty}</dd>
        </div>
      </dl>

      <ElementList title="Actus reus" items={offence.actusReus} />
      <ElementList title="Mens rea" items={offence.mensRea} />
      <CaseLawList cases={offence.keyCases} />

      <div className="mt-4">
        <h4 className="text-sm font-bold uppercase tracking-wide text-[var(--muted)]">Common defences</h4>
        <p className="mt-2 text-sm text-[var(--muted)]">{offence.commonDefences.join(' · ')}</p>
      </div>

      <div className="mt-4 rounded-[var(--radius)] border border-blue-200/80 bg-blue-50/80 p-4">
        <h4 className="text-sm font-bold text-blue-900">Sentencing Council</h4>
        <p className="mt-1 text-sm leading-relaxed text-blue-900/90">{offence.sentencingNote}</p>
        <p className="mt-2">
          <a
            href={offence.sentencingGuidelineUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-semibold text-blue-800 underline underline-offset-2 hover:text-blue-600"
          >
            View definitive guideline ↗
          </a>
        </p>
      </div>

      <div className="mt-4 rounded-[var(--radius)] border border-[var(--border)] bg-[var(--gold-pale)]/40 p-4">
        <h4 className="text-sm font-bold text-[var(--navy)]">At the police station</h4>
        <p className="mt-1 text-sm leading-relaxed text-[var(--muted)]">{offence.stationNotes}</p>
      </div>
    </article>
  );
}

export default function CommonOffencesGuidePage() {
  return (
    <>
      <section className="bg-[var(--navy)] py-10 sm:py-14">
        <div className="page-container !py-0">
          <Breadcrumbs
            light
            items={[
              { label: 'Home', href: '/' },
              { label: 'Resources', href: '/Resources' },
              { label: 'Common Offences Guide' },
            ]}
          />
          <h1 className="mt-4 text-h1 text-white">Common Offences Guide</h1>
          <p className="mt-4 max-w-3xl text-lg leading-relaxed text-slate-200">
            Actus reus, mens rea, defences, verified case law, and Sentencing Council guidelines for the offences
            police station representatives encounter most often in England and Wales.
          </p>
          <p className="mt-3 max-w-3xl text-sm text-slate-400">
            Case citations are limited to established authorities only — no invented or unverified references. Always
            check the current statute, guideline, and case law before advising.
          </p>
        </div>
      </section>

      <div className="page-container">
        <div className="mx-auto max-w-5xl lg:grid lg:grid-cols-[1fr_240px] lg:gap-10">
          <div className="min-w-0">
            <ContentReliabilityNotice className="mb-8" />

            <section className="mb-12">
              <SectionHeading id="who-its-for">Who this guide is for</SectionHeading>
              <p className="mt-4 leading-relaxed text-[var(--muted)]">
                This guide is written for accredited police station representatives, duty solicitors, and trainee reps
                preparing for the CIT. It is a structured reference for disclosure meetings and private consultations —
                not a substitute for up-to-date textbooks, the CPS Charging Standard, or firm-specific charging advice.
              </p>
              <p className="mt-3 leading-relaxed text-[var(--muted)]">
                Offences are listed with their statutory basis, elements, leading cases we have checked against primary
                sources, common defences, and links to the relevant{' '}
                <a
                  href="https://www.sentencingcouncil.org.uk/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium text-[var(--gold-link)] underline-offset-2 hover:underline"
                >
                  Sentencing Council
                </a>{' '}
                definitive guideline.
              </p>
            </section>

            <section className="mb-12">
              <SectionHeading id="principles">Actus reus and mens rea</SectionHeading>
              <p className="mt-4 leading-relaxed text-[var(--muted)]">
                Every offence has at least two components unless Parliament has created a strict-liability offence
                (rare, and usually flagged in the statute).
              </p>

              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                <div className="rounded-[var(--radius-lg)] border border-[var(--card-border)] bg-[var(--card-bg)] p-5 shadow-[var(--card-shadow)]">
                  <h3 className="font-bold text-[var(--navy)]">Actus reus</h3>
                  <p className="mt-2 text-sm leading-relaxed text-[var(--muted)]">
                    {CRIMINAL_LAW_PRINCIPLES.actusReus}
                  </p>
                </div>
                <div className="rounded-[var(--radius-lg)] border border-[var(--card-border)] bg-[var(--card-bg)] p-5 shadow-[var(--card-shadow)]">
                  <h3 className="font-bold text-[var(--navy)]">Mens rea</h3>
                  <p className="mt-2 text-sm leading-relaxed text-[var(--muted)]">{CRIMINAL_LAW_PRINCIPLES.mensRea}</p>
                </div>
              </div>

              <div className="mt-6 rounded-[var(--radius-lg)] border border-[var(--card-border)] bg-[var(--gold-pale)]/40 p-5">
                <h3 className="font-bold text-[var(--navy)]">Burden of proof</h3>
                <p className="mt-2 text-sm leading-relaxed text-[var(--muted)]">
                  {CRIMINAL_LAW_PRINCIPLES.burdenOfProof.text}
                </p>
                <CaseLawList cases={[CRIMINAL_LAW_PRINCIPLES.burdenOfProof.case]} />
              </div>
            </section>

            <section className="mb-12">
              <SectionHeading id="offences">Common offences</SectionHeading>
              <p className="mt-4 text-sm text-[var(--muted)]">
                Jump to:{' '}
                {COMMON_OFFENCES.map((o, i) => (
                  <span key={o.id}>
                    <a href={`#${o.id}`} className="font-medium text-[var(--gold-link)] hover:underline">
                      {o.title.split('(')[0].trim()}
                    </a>
                    {i < COMMON_OFFENCES.length - 1 ? ' · ' : ''}
                  </span>
                ))}
              </p>
              <div className="mt-8 space-y-8">
                {COMMON_OFFENCES.map((offence) => (
                  <OffenceCard key={offence.id} offence={offence} />
                ))}
              </div>
            </section>

            <section className="mb-12">
              <SectionHeading id="defences">General defences</SectionHeading>
              <p className="mt-4 leading-relaxed text-[var(--muted)]">
                These defences apply across multiple offence types. Whether they are available depends on the charge and
                the instructions — take full details at consultation.
              </p>
              <div className="mt-6 space-y-6">
                {GENERAL_DEFENCES.map((defence) => (
                  <article
                    key={defence.id}
                    id={defence.id}
                    className="scroll-mt-24 rounded-[var(--radius-lg)] border border-[var(--card-border)] bg-[var(--card-bg)] p-6 shadow-[var(--card-shadow)]"
                  >
                    <h3 className="text-lg font-bold text-[var(--navy)]">{defence.title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-[var(--muted)]">{defence.summary}</p>
                    <CaseLawList cases={defence.keyCases} />
                    <p className="mt-4 text-sm leading-relaxed text-[var(--muted)]">
                      <strong className="text-[var(--navy)]">Station note:</strong> {defence.stationNotes}
                    </p>
                  </article>
                ))}
              </div>
            </section>

            <section className="mb-12">
              <SectionHeading id="sentencing">Sentencing guidelines</SectionHeading>
              <p className="mt-4 leading-relaxed text-[var(--muted)]">
                Courts in England and Wales must follow Sentencing Council definitive guidelines unless it would be
                contrary to the interests of justice. Guidelines use a stepped approach: determine offence category
                (culpability and harm), identify the starting point and range, then adjust for aggravating and mitigating
                factors, guilty plea reduction, and totality.
              </p>
              <p className="mt-3 leading-relaxed text-[var(--muted)]">
                At the police station, sentencing guidelines help you explain likely outcomes if charged — they do not
                bind the police or CPS. Maximum penalties are set by Parliament; guidelines operate within those maxima.
              </p>
              <ul className="mt-6 space-y-2">
                {COMMON_OFFENCES.map((o) => (
                  <li key={o.id} className="text-sm">
                    <a
                      href={o.sentencingGuidelineUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-medium text-[var(--gold-link)] underline-offset-2 hover:underline"
                    >
                      {o.title} — Sentencing Council guideline ↗
                    </a>
                  </li>
                ))}
              </ul>
            </section>

            <section className="mb-12">
              <ContentSourcesFooter
                id="sources"
                sources={getContentSources(
                  { kind: 'page', path: '/CommonOffencesGuide' },
                  [
                    { label: 'Sentencing Council — definitive guidelines index', href: 'https://www.sentencingcouncil.org.uk/sentencing-guidelines/' },
                    { label: 'CPS — Offences against the person (charging standard)', href: 'https://www.cps.gov.uk/prosecution-guidance/offences-against-person-incorporating-charging-standard' },
                    { label: 'CPS — Theft Act offences legal guidance', href: 'https://www.cps.gov.uk/legal-guidance/theft-act-offences' },
                    { label: 'CPS — Public Order offences legal guidance', href: 'https://www.cps.gov.uk/legal-guidance/public-order-offences' },
                    { label: 'CPS — Fraud Act 2006 legal guidance', href: 'https://www.cps.gov.uk/legal-guidance/fraud-act-2006-offences' },
                    { label: 'CPS — Misuse of Drugs Act legal guidance', href: 'https://www.cps.gov.uk/legal-guidance/misuse-drugs-act-1971-0' },
                    { label: 'BAILII — free UK case law', href: 'https://www.bailii.org/' },
                  ],
                )}
              />
            </section>

            <section className="mb-12">
              <h2 className="text-h2 text-[var(--navy)]">Related guides</h2>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                {RELATED.map((link) => (
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
          </div>

          <aside className="mt-10 hidden lg:block">
            <nav
              className="sticky top-24 rounded-[var(--radius-lg)] border border-[var(--card-border)] bg-white p-5 shadow-[var(--card-shadow)]"
              aria-label="On this page"
            >
              <h2 className="text-sm font-bold uppercase tracking-wider text-[var(--muted)]">On this page</h2>
              <ul className="mt-3 space-y-2">
                {ON_THIS_PAGE.map((item) => (
                  <li key={item.id}>
                    <a
                      href={`#${item.id}`}
                      className="text-sm text-[var(--navy)] no-underline transition-colors hover:text-[var(--gold-hover)]"
                    >
                      {item.label}
                    </a>
                  </li>
                ))}
              </ul>
              <div className="mt-6 border-t border-[var(--border)] pt-4">
                <p className="text-xs font-bold uppercase tracking-wider text-[var(--muted)]">Offences</p>
                <ul className="mt-2 max-h-64 space-y-1 overflow-y-auto text-xs">
                  {COMMON_OFFENCES.map((o) => (
                    <li key={o.id}>
                      <a href={`#${o.id}`} className="text-[var(--navy)] hover:text-[var(--gold-hover)]">
                        {o.title.replace(/ \(.*\)/, '')}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            </nav>
          </aside>
        </div>
      </div>
    </>
  );
}
