import Link from 'next/link';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { CustodyNotePagePromo } from '@/components/CustodyNotePagePromo';
import { ContentReliabilityNotice } from '@/components/ContentReliabilityNotice';
import { ResolvedContentSources } from '@/components/ContentSourcesFooter';
import { buildMetadata } from '@/lib/seo';

export const metadata = buildMetadata({
  title: 'PACE Codes of Practice — Quick Reference Guide',
  description:
    'Quick reference guide to the Police and Criminal Evidence Act 1984 (PACE) Codes of Practice — detention times, review periods, caution wording, and key provisions for police station representatives.',
  path: '/PACE',
});

const QUICK_REF = [
  {
    label: 'Detention Clock',
    value: 'Max 24hrs / 36hrs / 96hrs',
    detail: '24 hours standard; up to 36 hours with superintendent authority; up to 96 hours with magistrates\' court warrant (indictable offences only)',
  },
  {
    label: 'Review Times',
    value: 'First at 6hrs, then every 9hrs',
    detail: 'First review no later than 6 hours after detention authorised; subsequent reviews at intervals of no more than 9 hours',
  },
  {
    label: 'Caution',
    value: '"You do not have to say anything…"',
    detail: '"You do not have to say anything. But it may harm your defence if you do not mention when questioned something which you later rely on in court. Anything you do say may be given in evidence."',
  },
  {
    label: 'Appropriate Adult',
    value: 'Required for juveniles & vulnerable adults',
    detail: 'Must be present during interviews with juveniles (under 18) and mentally vulnerable adults. Cannot be a police officer or someone employed by the police.',
  },
  {
    label: 'Significant Silence',
    value: 'Must be put to suspect at interview',
    detail: 'A significant silence or relevant statement made outside interview must be put to the suspect at the beginning of the next interview and they must be given the opportunity to confirm, deny, or add to it.',
  },
  {
    label: 'Special Warning',
    value: 'Sections 36 & 37 CJPOA 1994',
    detail: 'Officer may give special warning about failure to account for objects, substances, marks (s.36) or presence at a place (s.37). Must be given in interview and the suspect must be told the consequences of silence.',
  },
];

const CODES = [
  {
    code: 'A',
    title: 'Stop and Search',
    summary: 'Governs the exercise of statutory powers of stop and search.',
    points: [
      'Officers must have reasonable grounds for suspicion before searching',
      'Person must be told: officer\'s name, station, grounds for search, object of search, and entitlement to a copy of the search record',
      'Searches in public must be limited — removal of outer coat, jacket, and gloves only',
      'A written record must be made at the time or as soon as practicable afterwards',
    ],
  },
  {
    code: 'B',
    title: 'Search of Premises and Seizure of Property',
    summary: 'Powers to search premises and seize evidence.',
    points: [
      'Entry and search must be conducted at a reasonable hour unless this would frustrate the purpose',
      'Officers must identify themselves and produce a warrant if applicable',
      'Legally privileged material, excluded material, and special procedure material have additional protections',
      'A record of the search must be made including items seized',
    ],
  },
  {
    code: 'C',
    title: 'Detention, Treatment and Questioning',
    summary: 'The core code for police station representatives — covers all aspects of custody.',
    points: [
      'Right to have someone informed of arrest (s.56 PACE)',
      'Right to legal advice — free and independent (s.58 PACE)',
      'Detention must be reviewed by an inspector at prescribed intervals',
      'Conditions of detention: adequate food, drink, bedding, and medical attention',
      'Interviews must be conducted fairly with contemporaneous recording',
      'Vulnerable suspects must have an Appropriate Adult present',
    ],
  },
  {
    code: 'D',
    title: 'Identification',
    summary: 'Procedures for identifying suspects.',
    points: [
      'Video identification is the primary method (ID parade only if video not practicable)',
      'Witness must not be shown photos or media coverage before a procedure',
      'Suspect is entitled to legal advice before any identification procedure',
      'Record must be made of the suspect\'s appearance at the time of arrest',
    ],
  },
  {
    code: 'E',
    title: 'Audio Recording of Interviews',
    summary: 'Requirements for audio recording interviews with suspects.',
    points: [
      'All interviews at a police station must be audio recorded',
      'Recording must not be turned off during an interview',
      'Suspect must be given the opportunity to listen to and verify the recording',
      'Master recording must be sealed in the suspect\'s presence',
    ],
  },
  {
    code: 'F',
    title: 'Visual Recording of Interviews',
    summary: 'Visual (video) recording of interviews with suspects.',
    points: [
      'Visual recording is discretionary unless specifically required',
      'Same safeguards apply as for audio recording under Code E',
      'Increasingly used for serious offences and vulnerable suspects',
      'Body-worn video footage is a separate matter governed by local force policy',
    ],
  },
  {
    code: 'G',
    title: 'Arrest',
    summary: 'Powers of arrest and the necessity test.',
    points: [
      'Officer must have reasonable grounds to suspect an offence has been committed',
      'Arrest must be necessary — cannot arrest if a less intrusive means would suffice',
      'Necessity criteria include: ascertaining name/address, preventing harm, protecting a child or vulnerable person, allowing prompt investigation',
      'Person must be informed they are under arrest and given the reason',
    ],
  },
  {
    code: 'H',
    title: 'Terrorism',
    summary: 'Detention of terrorist suspects under the Terrorism Act 2000.',
    points: [
      'Extended detention periods apply — up to 14 days with judicial authority',
      'More restrictive conditions on access to legal advice (qualified right)',
      'Reviews conducted by a review officer of at least superintendent rank',
      'Special provisions for post-charge questioning',
    ],
  },
];

export default function PACEPage() {
  return (
    <>
      <section className="bg-[var(--navy)] py-10 sm:py-14">
        <div className="page-container !py-0">
          <Breadcrumbs
            light
            items={[
              { label: 'Home', href: '/' },
              { label: 'PACE Codes', href: '/PACE' },
            ]}
          />
          <h1 className="mt-3 text-h1 text-white">PACE Codes Reference</h1>
          <p className="mt-3 max-w-2xl text-lg leading-relaxed text-white">
            Quick reference guide to the Police and Criminal Evidence Act 1984 and the Codes of
            Practice — essential knowledge for every police station representative.
          </p>
        </div>
      </section>

      <div className="page-container">

      <ContentReliabilityNotice className="mb-10" />

      {/* Quick Reference Box */}
      <section className="mb-14 rounded-[var(--radius-lg)] border border-[var(--gold)]/30 bg-[var(--gold)]/5 p-6 sm:p-8">
        <h2 className="text-h2 mb-6 text-[var(--navy)]">Quick Reference</h2>
        <div className="space-y-5">
          {QUICK_REF.map((item) => (
            <div key={item.label} className="border-b border-[var(--border)] pb-5 last:border-0 last:pb-0">
              <div className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:gap-3">
                <span className="text-sm font-bold text-[var(--navy)]">{item.label}</span>
                <span className="text-sm font-semibold text-[var(--gold-link)]">{item.value}</span>
              </div>
              <p className="mt-1 text-sm leading-relaxed text-[var(--muted)]">{item.detail}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Codes */}
      <section className="mb-14">
        <h2 className="text-h2 mb-8 text-[var(--navy)]">Codes of Practice</h2>
        <div className="space-y-6">
          {CODES.map((code) => (
            <div
              key={code.code}
              className="rounded-[var(--radius-lg)] border border-[var(--card-border)] bg-[var(--card-bg)] p-6 shadow-[var(--card-shadow)] sm:p-8"
            >
              <div className="mb-3 flex items-baseline gap-3">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--gold)]/10 text-sm font-bold text-[var(--gold-link)]">
                  {code.code}
                </span>
                <h3 className="text-lg font-bold text-[var(--navy)]">
                  Code {code.code}: {code.title}
                </h3>
              </div>
              <p className="mb-4 text-sm text-[var(--muted)]">{code.summary}</p>
              <ul className="space-y-2">
                {code.points.map((point, i) => (
                  <li key={i} className="flex gap-2 text-sm leading-relaxed text-[var(--muted)]">
                    <span className="mt-0.5 shrink-0 text-emerald-600">✓</span>
                    {point}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* Official Link */}
      <div className="mb-14 rounded-[var(--radius)] border border-[var(--card-border)] bg-[var(--card-bg)] p-6 text-center shadow-[var(--card-shadow)]">
        <p className="text-sm text-[var(--muted)]">
          For the latest official versions of the PACE Codes of Practice, visit{' '}
          <a
            href="https://www.gov.uk/guidance/police-and-criminal-evidence-act-1984-pace-codes-of-practice"
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-[var(--gold-link)] hover:underline"
          >
            GOV.UK — PACE Codes of Practice
          </a>
          .
        </p>
      </div>

      <CustodyNotePagePromo variant="full" className="page-container mb-14" />

      {/* Resource links */}
      <section>
        <h2 className="text-h2 mb-6 text-[var(--navy)]">Related Resources</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          <Link
            href="/CommonOffencesGuide"
            className="block rounded-[var(--radius)] border border-[var(--card-border)] bg-[var(--card-bg)] p-5 no-underline shadow-[var(--card-shadow)] transition-all hover:border-[var(--gold)]/40 hover:shadow-[var(--card-shadow-hover)]"
          >
            <p className="font-medium text-[var(--navy)]">Common Offences Guide</p>
            <p className="mt-1 text-sm text-[var(--muted)]">Actus reus, mens rea, defences &amp; sentencing</p>
          </Link>
          <Link
            href="/Resources"
            className="block rounded-[var(--radius)] border border-[var(--card-border)] bg-[var(--card-bg)] p-5 no-underline shadow-[var(--card-shadow)] transition-all hover:border-[var(--gold)]/40 hover:shadow-[var(--card-shadow-hover)]"
          >
            <p className="font-medium text-[var(--navy)]">Training Resources</p>
            <p className="mt-1 text-sm text-[var(--muted)]">Guides and practice materials</p>
          </Link>
          <Link
            href="/FormsLibrary"
            className="block rounded-[var(--radius)] border border-[var(--card-border)] bg-[var(--card-bg)] p-5 no-underline shadow-[var(--card-shadow)] transition-all hover:border-[var(--gold)]/40 hover:shadow-[var(--card-shadow-hover)]"
          >
            <p className="font-medium text-[var(--navy)]">Forms Library</p>
            <p className="mt-1 text-sm text-[var(--muted)]">CRM1, CRM2 &amp; legal aid forms</p>
          </Link>
          <Link
            href="/CustodyNote"
            className="block rounded-[var(--radius)] border border-[var(--card-border)] bg-[var(--card-bg)] p-5 no-underline shadow-[var(--card-shadow)] transition-all hover:border-[var(--gold)]/40 hover:shadow-[var(--card-shadow-hover)]"
          >
            <p className="font-medium text-[var(--navy)]">Custody Note Builder</p>
            <p className="mt-1 text-sm text-[var(--muted)]">Generate attendance notes</p>
          </Link>
          <Link
            href="/Wiki"
            className="block rounded-[var(--radius)] border border-[var(--card-border)] bg-[var(--card-bg)] p-5 no-underline shadow-[var(--card-shadow)] transition-all hover:border-[var(--gold)]/40 hover:shadow-[var(--card-shadow-hover)]"
          >
            <p className="font-medium text-[var(--navy)]">Rep Knowledge Base</p>
            <p className="mt-1 text-sm text-[var(--muted)]">Free training articles &amp; guides</p>
          </Link>
        </div>
      </section>

      <section className="mt-10 rounded-[var(--radius-lg)] bg-[var(--navy)] p-8 text-center">
        <h2 className="text-xl font-bold text-white">Need Representation?</h2>
        <p className="mt-3 text-white">Find an accredited police station representative via our free directory.</p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <Link href="/directory" className="btn-gold no-underline">Find a Rep</Link>
          <Link href="/Contact" className="btn-outline !border-slate-500 !text-white hover:!border-[var(--gold)] hover:!text-[var(--gold)] no-underline">Contact Us</Link>
        </div>
        <p className="mt-5 text-sm text-slate-300">
          Need a solicitor at the police station?{' '}
          <a href="https://www.policestationagent.com" target="_blank" rel="noopener noreferrer" className="font-semibold text-[var(--gold)] underline">
            Visit policestationagent.com
          </a>
        </p>
      </section>

      <ResolvedContentSources className="mt-10" context={{ kind: 'page', path: '/PACE' }} />
    </div>
    </>
  );
}
