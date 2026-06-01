import Link from 'next/link';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { ContentReliabilityNotice } from '@/components/ContentReliabilityNotice';
import { ResolvedContentSources } from '@/components/ContentSourcesFooter';
import { buildMetadata } from '@/lib/seo';

export const metadata = buildMetadata({
  title: 'DSCC Registration Guide — How the Duty Call Flow Works (2026)',
  description:
    'In-depth guide to the Defence Solicitor Call Centre (DSCC): how the duty call flow works, how solicitors get on the duty rota, ADMIN 2 and ADMIN 3 paperwork for reps, PIN allocation, CDS Direct, and the LAA arrangements that govern it.',
  path: '/DSCCRegistrationGuide',
});

const ON_THIS_PAGE = [
  { id: 'what-is-dscc', label: 'What the DSCC actually is' },
  { id: 'call-flow', label: 'The call flow — step by step' },
  { id: 'duty-rota', label: 'The duty solicitor rota' },
  { id: 'admin-forms', label: 'ADMIN 2, ADMIN 3, and the Register' },
  { id: 'reps', label: 'What reps need to know' },
  { id: 'pin', label: 'PINs and identification' },
  { id: 'cds-direct', label: 'CDS Direct — telephone-only matters' },
  { id: 'engaged', label: '"Engaged" requirements for duty solicitors' },
  { id: 'common-problems', label: 'Common problems and how to handle them' },
  { id: 'faqs', label: 'Frequently asked questions' },
  { id: 'sources', label: 'Official sources' },
];

const CALL_FLOW = [
  {
    n: 1,
    title: 'Suspect requests legal advice',
    body: 'On arrival in custody, the custody sergeant reads the suspect their PACE rights. If the suspect says yes to legal advice, the sergeant asks: own solicitor or duty solicitor? The choice (and whether they identified a named firm) is recorded on the custody record.',
  },
  {
    n: 2,
    title: 'Custody officer calls the DSCC',
    body: 'The custody officer telephones the DSCC. They give the suspect&apos;s details, the offence under investigation, the custody suite, the suspect&apos;s preference (own/duty), and any urgency flags (e.g. vulnerable suspect, interview imminent, fitness-for-interview concerns).',
  },
  {
    n: 3,
    title: 'DSCC allocation',
    body: 'If the suspect named a firm, the DSCC routes the call to that firm&apos;s 24/7 number. If the firm cannot attend (no answer, out-of-area, declined), the DSCC falls back to the duty rota. If the suspect requested duty, the DSCC contacts the next solicitor on the local rota for the current slot.',
  },
  {
    n: 4,
    title: 'CDS Direct triage',
    body: 'For specified low-level matters — drunk and disorderly, breach of bail conditions, warrants of arrest, certain non-imprisonable summary offences — the DSCC routes the call to the CDS Direct telephone advice service rather than to a solicitor. The solicitor or accredited rep advises by phone and does not attend unless an exception applies.',
  },
  {
    n: 5,
    title: 'Initial telephone advice',
    body: 'The instructed solicitor or rep telephones the custody suite to take initial instructions, give immediate advice (e.g. confirm the suspect is well, request to delay interview until attendance, check fitness flags), and decide whether physical attendance is needed under the LAA Sufficient Benefit Test.',
  },
  {
    n: 6,
    title: 'Attendance',
    body: 'If attendance is required, the firm dispatches a solicitor or accredited rep. There is no fixed statutory deadline, but advice must be provided without undue delay — in practice the timing is driven by when the police intend to interview and by PACE Code C. The custody officer is told who is coming and when. The rep introduces themselves at custody, takes formal disclosure, and proceeds to consultation and interview.',
  },
  {
    n: 7,
    title: 'Billing and reporting',
    body: 'After the attendance, the firm reports the work to the LAA each month through the Submit a Bulk Claim (SaBC) service — which replaced Contracted Work and Administration (CWA) — using fee code INVC, and SaBC pays the fixed fee for the scheme the police station sits in. If the actual profit, travel and waiting costs cross the &quot;escape&quot; threshold (around £650), the firm completes an Escape Fee Claim Form (CRM18) for individual costs assessment instead. The DSCC record of the call is the audit trail.',
  },
];

const ADMIN_FORMS = [
  {
    code: 'ADMIN 1',
    title: 'Initial duty solicitor application',
    body: 'Used by a qualified solicitor to apply to join a local duty solicitor scheme. The applicant must have passed the Police Station Qualification (PSQ) and meet the SCC supervisor or duty solicitor standards. Approved applications add the solicitor to the rota for the named scheme(s).',
  },
  {
    code: 'ADMIN 2',
    title: 'Add a Police Station Representative to the Register',
    body: 'Filed by the rep&apos;s Supervising Solicitor. Adds the named rep to the Police Station Register — initially as a Probationary Representative, then upgraded to Accredited on CIT pass. ADMIN 2 issues the rep&apos;s DSCC PIN. Without ADMIN 2, no attendance can be billed in that rep&apos;s name.',
  },
  {
    code: 'ADMIN 3',
    title: 'Annual data cleanse',
    body: 'Completed yearly for each Police Station Representative at the DSCC&apos;s annual data cleanse. Confirms the rep is still active, still meets the supervision requirements, and is still working at the firm (the Certificate of Fitness is incorporated into the ADMIN 3). Failure to return a properly completed ADMIN 3 removes the named individual from the Register.',
  },
  {
    code: 'ADMIN 4',
    title: 'Notification of changes',
    body: 'Used out-of-cycle to tell the DSCC that something has changed — a duty solicitor leaves the firm, a rep moves to another SCC firm, a supervisor changes, a contract is varied, or a scheme membership is to be ended. Must be filed promptly; gaps create rota and billing problems.',
  },
];

const REP_KEY_POINTS = [
  'You do not register with the DSCC personally — your firm and supervisor do, on your behalf, via ADMIN 2.',
  'You cannot be on the duty solicitor rota — only PSQ-qualified solicitors can. You can, however, attend duty calls as the rep sent by a duty solicitor&apos;s firm.',
  'Most duty calls are handed by the DSCC to the firm&apos;s on-call number, not to a named individual. The firm then decides who attends — solicitor or accredited rep.',
  'The DSCC PIN identifies you to custody officers and to the firm&apos;s billing system. Keep it confidential; never share it on social media or in emails outside the firm.',
  'Each duty call has a DSCC reference number — record it in your attendance note. Without it, the firm cannot claim the LAA fee.',
  'If you go freelance after accreditation, your PIN moves with you — but each firm you work for must still file ADMIN 4 to add you to their staffing record.',
];

const COMMON_PROBLEMS = [
  {
    title: 'The duty solicitor cannot attend',
    body: 'If the named duty solicitor is busy, ill, or already in another suite, the firm should send a fellow duty solicitor or accredited rep. If no one is available, the DSCC may pass the call to a back-up duty slot or, in exceptional cases, to a neighbouring scheme. The suspect should not be left without advice — and the firm risks losing its duty slots if it routinely fails to attend.',
  },
  {
    title: '"Own client" but the firm has no out-of-hours cover',
    body: 'Many firms — particularly civil or family practices that only occasionally take crime — cannot answer the DSCC out-of-hours call. The DSCC waits a defined period, then converts the request to duty. The suspect can switch firms at any time during the case if they prefer.',
  },
  {
    title: 'PIN issues at custody',
    body: 'If the custody officer cannot find you on the Register when you arrive — for example because ADMIN 2 has not yet processed, or your firm changed name — you may be refused signature on the custody record as legal adviser. Always carry an in-date PSRAS / SRA practising certificate and a copy of the firm&apos;s SCC schedule.',
  },
  {
    title: 'Interview imminent — you are not yet on scene',
    body: 'PACE Code C entitles you to be present at interview. You can ask the custody officer (and the DSCC, if needed) to delay interview until you arrive. The officer in the case may resist, citing PACE Code C 6.6 grounds — but in practice, an interview without legal advice when one has been requested is grounds for the evidence to be challenged under PACE s.78.',
  },
  {
    title: 'Suspect changes mind mid-detention',
    body: 'A suspect can switch from no advice to advice (and vice versa) at any time. If the suspect later asks for a solicitor, the custody officer must call the DSCC again. Equally, if the suspect asks for a different firm or solicitor, the DSCC should be asked to allocate accordingly.',
  },
];

const DUTY_SOLICITOR_STANDING = [
  'Hold a current Criminal Litigation Accreditation Scheme (CLAS) qualification, or have been a member of a duty scheme under an earlier Contract (Standard Terms, clause 1.1).',
  'Have passed the Police Station Qualification (PSQ) and be registered on the Duty Solicitor Register with the DSCC (scheme membership is typically applied for via ADMIN 1).',
];

/** Rolling “engaged” requirements — Specification paras 6.21–6.23 (SCC 2025). */
const ENGAGED_REQUIREMENTS = [
  'Meet any professional development requirements of their relevant professional body on issues relevant to police station and magistrates\u2019 court work (para 6.21(a)).',
  'Undertake a minimum of 6 Police Station Advice and Assistance cases per rolling 12-month period (no more than two of which can be telephone-only advice with no subsequent attendance) (para 6.21(b)).',
  'In each rolling 12-month period, undertake either 20 magistrates\u2019 court representations, or 10 magistrates\u2019 court plus 5 Crown Court representations (para 6.21(c)).',
  'Undertake at least one Police Station Duty attendance (excluding telephone advice) or Duty Slot in their name in each rolling 3-month period (para 6.21(d)).',
  'Work a minimum of 50 hours per calendar month on Criminal Defence Work for the Provider from the office for which the duty slots were obtained (paras 6.22\u20136.23; the LAA may assess this on a rolling three-month basis).',
];

const FAQS = [
  {
    q: 'What is the Defence Solicitor Call Centre?',
    a: 'The DSCC is the national 24/7 call centre operated under contract with the Legal Aid Agency. It handles every request for legal advice at a police station in England and Wales — matching the request to the suspect&apos;s own solicitor, the duty solicitor rota, or the CDS Direct telephone service depending on the circumstances.',
  },
  {
    q: 'How do I register with the DSCC as an individual?',
    a: 'Individual representatives do not register with the DSCC directly. Your Supervising Solicitor adds you to the Police Station Register via ADMIN 2 — initially as a Probationary Representative, then as Accredited on CIT pass. Your firm&apos;s 24/7 number is what the DSCC calls; your PIN is what identifies you to the custody officer and the LAA billing system.',
  },
  {
    q: 'Can I be on the duty rota as a representative?',
    a: 'No. Only solicitors who have passed the Police Station Qualification (PSQ) and meet the duty solicitor standards in the Standard Crime Contract can be on the duty rota. Accredited reps attend duty calls on behalf of duty solicitors and firms — that is the lawful mechanism. Probationary reps cannot attend duty calls alone at all.',
  },
  {
    q: 'What is a DSCC PIN number?',
    a: 'A DSCC PIN is a unique identifier — issued on first ADMIN 2 — that links every police-station attendance to the named individual. It travels with you between firms, but each firm must still notify the DSCC (via ADMIN 4) that you are now working with them. Treat it as confidential — it is your professional licence number for police-station work.',
  },
  {
    q: 'What is CDS Direct?',
    a: 'CDS Direct is the LAA-funded telephone advice service for specified non-imprisonable offences (drunk and disorderly, breach of bail, warrants of arrest, low-level summary matters). The DSCC routes those calls to CDS Direct rather than to a solicitor or rep. Attendance is not normally funded for CDS Direct matters unless an exception applies (e.g. vulnerable suspect, interview to follow, complex disclosure).',
  },
  {
    q: 'What happens if the duty solicitor is busy?',
    a: 'The firm should send another duty solicitor or accredited rep from the same firm. If no one is available, the DSCC may allocate to a back-up duty solicitor or, in exceptional cases, to the next scheme&apos;s solicitor. Firms with repeated failures to attend risk losing duty slots and may be referred to the LAA contract management team.',
  },
  {
    q: 'How is the DSCC funded?',
    a: 'The DSCC is funded by the LAA under a procurement contract. It is operated by a third-party provider on the LAA&apos;s behalf. Firms and reps do not pay to use it — its costs are part of the Criminal Legal Aid budget.',
  },
  {
    q: 'What if I lose my PIN or it is compromised?',
    a: 'Contact your Supervising Solicitor immediately. The firm will notify the DSCC via ADMIN 4 to suspend the existing PIN and issue a replacement. Do not continue attending custody under a suspended PIN — billing claims tied to a suspended PIN will be rejected and the attendance can be challenged.',
  },
];

const SOURCES = [
  { label: 'LAA — Standard Crime Contract 2025 (incl. Police Station Register Arrangements 2025 & Duty Solicitor Guidance)', href: 'https://www.gov.uk/government/publications/standard-crime-contract-2025' },
  { label: 'LAA — Submit a Bulk Claim (SaBC): reporting crime lower work and fee codes', href: 'https://www.gov.uk/guidance/submit-a-bulk-claim-sabc' },
  { label: 'LAA — Criminal Legal Aid Manual', href: 'https://www.gov.uk/guidance/criminal-legal-aid-manual' },
  { label: 'PACE Code C — Detention, Treatment and Questioning', href: 'https://www.gov.uk/guidance/police-and-criminal-evidence-act-1984-pace-codes-of-practice' },
];

const RELATED = [
  { href: '/HowToBecomePoliceStationRep', label: 'How to become a rep', desc: 'Full PSRAS pathway from enrolment to CIT' },
  { href: '/FindSupervisingSolicitor', label: 'Find a supervising solicitor', desc: 'The single hardest stage — playbook and email template' },
  { href: '/BuildPortfolioGuide', label: 'Build your portfolio', desc: 'Part A / Part B attendances assessors actually accept' },
  { href: '/PrepareForCIT', label: 'Prepare for the CIT', desc: 'Scenario rehearsal and ethical traps' },
  { href: '/PoliceStationRates', label: 'Police station fees', desc: 'Fixed fees, escape thresholds, and CDS Direct rates' },
  { href: '/GetWork', label: 'Get work as a rep', desc: 'Six-phase action plan for after accreditation' },
];

function SectionHeading({ id, children }: { id: string; children: React.ReactNode }) {
  return (
    <h2 id={id} className="text-h2 scroll-mt-24 text-[var(--navy)]">
      {children}
    </h2>
  );
}

export default function DSCCRegistrationGuidePage() {
  return (
    <>
      <section className="bg-[var(--navy)] py-12 sm:py-16">
        <div className="page-container !py-0">
          <Breadcrumbs
            light
            items={[
              { label: 'Home', href: '/' },
              { label: 'Resources', href: '/Resources' },
              { label: 'DSCC Registration Guide', href: '/DSCCRegistrationGuide' },
            ]}
          />
          <h1 className="mt-4 text-h1 text-white">DSCC Registration Guide</h1>
          <p className="mt-4 max-w-3xl text-lg leading-relaxed text-white">
            The complete guide to the Defence Solicitor Call Centre — how the duty call flow works,
            how solicitors get onto the duty rota, ADMIN 2 and ADMIN 3 paperwork for reps, PIN
            allocation, CDS Direct, and the LAA Arrangements that govern it all.
          </p>
          <p className="mt-2 text-xs text-slate-300">
            Last updated: 20 May 2026 · Author: Robert Cashman, Duty Solicitor &amp; Higher Court Advocate
          </p>
        </div>
      </section>

      <div className="page-container">
        <div className="mx-auto max-w-4xl">
          <ContentReliabilityNotice className="mb-8" />
          {/* Read this first */}
          <div className="mb-10 rounded-[var(--radius-lg)] border border-amber-300 bg-amber-50 p-6">
            <h2 className="text-base font-bold text-amber-900">Read this first</h2>
            <p className="mt-2 text-sm leading-relaxed text-amber-900">
              This page is <strong>general professional information only</strong> — not legal
              advice and not a substitute for the LAA&apos;s published Duty Solicitor and Police
              Station Representative Arrangements 2025. Rules change at every annual data cleanse;
              always check GOV.UK for the current text before filing forms.
            </p>
          </div>

          {/* On this page */}
          <nav
            className="mb-12 rounded-[var(--radius-lg)] border border-[var(--card-border)] bg-[var(--card-bg)] p-5 shadow-[var(--card-shadow)] sm:p-6"
            aria-label="On this page"
          >
            <h2 className="text-sm font-semibold uppercase tracking-wide text-[var(--navy)]">
              On this page
            </h2>
            <ol className="mt-3 grid list-decimal gap-x-6 gap-y-1 pl-5 text-sm text-[var(--muted)] sm:grid-cols-2">
              {ON_THIS_PAGE.map((item) => (
                <li key={item.id}>
                  <a
                    href={`#${item.id}`}
                    className="text-[var(--navy)] underline decoration-[var(--gold)]/40 underline-offset-2 hover:decoration-[var(--gold)]"
                  >
                    {item.label}
                  </a>
                </li>
              ))}
            </ol>
          </nav>

          {/* What is DSCC */}
          <section className="mb-12">
            <SectionHeading id="what-is-dscc">What the DSCC actually is</SectionHeading>
            <p className="mt-3 text-sm leading-relaxed text-[var(--muted)]">
              The Defence Solicitor Call Centre (DSCC) is the national 24/7 call-handling service
              that manages every request for legal advice at a police station in England and Wales.
              It is run under contract with the Legal Aid Agency by a commercial provider, on
              behalf of HM Government, and operates around the clock every day of the year.
            </p>
            <p className="mt-3 text-sm leading-relaxed text-[var(--muted)]">
              The DSCC sits between three groups of users:
            </p>
            <ul className="mt-3 list-disc space-y-2 pl-6 text-sm leading-relaxed text-[var(--muted)]">
              <li><strong>Police custody officers</strong>, who call to log a suspect&apos;s request for advice.</li>
              <li><strong>Criminal defence firms</strong> holding a Standard Crime Contract, who receive duty allocations and own-client calls.</li>
              <li><strong>CDS Direct advisers</strong>, who handle the telephone-only matters the LAA has carved out from the attendance-funded scheme.</li>
            </ul>
            <p className="mt-3 text-sm leading-relaxed text-[var(--muted)]">
              Every request that flows through the DSCC creates an electronic record that becomes
              the audit trail for the LAA fixed-fee claim. Without a DSCC reference number, the
              firm cannot bill the work as a legal-aid attendance.
            </p>
          </section>

          {/* Call flow */}
          <section className="mb-12">
            <SectionHeading id="call-flow">The call flow — step by step</SectionHeading>
            <div className="mt-6 space-y-4">
              {CALL_FLOW.map((step) => (
                <div
                  key={step.n}
                  className="rounded-[var(--radius-lg)] border border-[var(--card-border)] bg-[var(--card-bg)] p-6 shadow-[var(--card-shadow)]"
                >
                  <div className="flex items-start gap-4">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 border-[var(--gold)] text-sm font-bold text-[var(--gold)]">
                      {step.n}
                    </span>
                    <div>
                      <h3 className="text-base font-bold text-[var(--navy)]">{step.title}</h3>
                      <p
                        className="mt-2 text-sm leading-relaxed text-[var(--muted)]"
                        dangerouslySetInnerHTML={{ __html: step.body }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Duty rota */}
          <section className="mb-12">
            <SectionHeading id="duty-rota">The duty solicitor rota</SectionHeading>
            <p className="mt-3 text-sm leading-relaxed text-[var(--muted)]">
              Every police station scheme in England and Wales has its own duty solicitor rota —
              a published list of named solicitors with assigned slots. A &quot;slot&quot; is usually a
              24-hour period during which the named solicitor (or their firm) is first in line to
              receive duty calls for that scheme.
            </p>
            <p className="mt-3 text-sm leading-relaxed text-[var(--muted)]">
              To get onto the rota a solicitor must:
            </p>
            <ul className="mt-3 list-disc space-y-2 pl-6 text-sm leading-relaxed text-[var(--muted)]">
              <li>be employed by a firm holding a Standard Crime Contract with a police station schedule;</li>
              <li>have passed the Police Station Qualification (PSQ);</li>
              <li>meet the &quot;engaged&quot; requirements in the SCC (see below);</li>
              <li>have been added to the scheme by filing ADMIN 1 with the DSCC;</li>
              <li>
                continue to meet the rolling &quot;engaged&quot; requirements in Specification paras
                6.21&ndash;6.23 (see below) — monitored by the LAA under the duty solicitor
                provisions, not via ADMIN 3.
              </li>
            </ul>
            <p className="mt-3 text-sm leading-relaxed text-[var(--muted)]">
              Schemes are local — a duty solicitor on the Maidstone scheme cannot pick up duty
              calls in Liverpool, even if their firm has a Standard Crime Contract there. To
              cover additional areas, the firm or solicitor must apply to each local scheme.
            </p>
          </section>

          {/* ADMIN forms */}
          <section className="mb-12">
            <SectionHeading id="admin-forms">ADMIN 2, ADMIN 3, and the Register</SectionHeading>
            <p className="mt-3 text-sm leading-relaxed text-[var(--muted)]">
              The DSCC maintains two registers: the Duty Solicitor Register and the Police Station
              Representative Register. The representative forms (ADMIN 2 and ADMIN 3) are defined in
              the LAA&apos;s Police Station Register Arrangements 2025; duty-solicitor scheme
              administration uses further DSCC forms. The forms reps and firms most often encounter are:
            </p>
            <div className="mt-6 space-y-4">
              {ADMIN_FORMS.map((form) => (
                <div
                  key={form.code}
                  className="rounded-[var(--radius)] border-l-4 border-[var(--gold)] bg-slate-50 p-5"
                >
                  <p className="text-xs font-semibold uppercase tracking-wide text-[var(--gold)]">
                    {form.code}
                  </p>
                  <h3 className="mt-1 text-base font-bold text-[var(--navy)]">{form.title}</h3>
                  <p
                    className="mt-2 text-sm leading-relaxed text-[var(--muted)]"
                    dangerouslySetInnerHTML={{ __html: form.body }}
                  />
                </div>
              ))}
            </div>
          </section>

          {/* Reps */}
          <section className="mb-12">
            <SectionHeading id="reps">What reps need to know</SectionHeading>
            <ul className="mt-4 list-disc space-y-2 pl-6 text-sm leading-relaxed text-[var(--muted)]">
              {REP_KEY_POINTS.map((point) => (
                <li key={point} dangerouslySetInnerHTML={{ __html: point }} />
              ))}
            </ul>
            <div className="mt-6 rounded-[var(--radius)] border-l-4 border-emerald-500 bg-emerald-50/60 p-5 text-sm leading-relaxed text-[var(--muted)]">
              <strong className="text-[var(--navy)]">Best practice:</strong> always log the DSCC
              reference, the time the call came in, the time of initial telephone advice, and the
              time you arrived at custody in your attendance note. The LAA expects these times to
              reconcile with the firm&apos;s billing claim — discrepancies trigger contract-management
              audits.
            </div>
          </section>

          {/* PIN */}
          <section className="mb-12">
            <SectionHeading id="pin">PINs and identification</SectionHeading>
            <p className="mt-3 text-sm leading-relaxed text-[var(--muted)]">
              The DSCC PIN is the legal-aid system&apos;s equivalent of a practising-certificate
              number. Every accredited representative, probationary representative, and duty
              solicitor has one. It is issued on first ADMIN 2 (rep) or ADMIN 1 (solicitor),
              travels with the individual between firms, and is suspended when the individual is
              no longer entitled to attend (e.g. accreditation lapsed, character issue, struck off).
            </p>
            <ul className="mt-4 list-disc space-y-2 pl-6 text-sm leading-relaxed text-[var(--muted)]">
              <li>Custody officers can ask to see the PIN before allowing you to sign the custody record as legal adviser.</li>
              <li>Each attendance is recorded against your PIN in the firm&apos;s monthly LAA claim (via SaBC) — every attendance is tied to a specific PIN.</li>
              <li>Never share your PIN. A PIN compromise can be misused by another person to attend custody in your name — and any complaint or regulatory action will land on you.</li>
              <li>If you change firms, your PIN moves with you but the new firm must file ADMIN 4 to notify the DSCC. Do not attend in the new firm&apos;s name until that has been acknowledged.</li>
            </ul>
          </section>

          {/* CDS Direct */}
          <section className="mb-12">
            <SectionHeading id="cds-direct">CDS Direct — telephone-only matters</SectionHeading>
            <p className="mt-3 text-sm leading-relaxed text-[var(--muted)]">
              CDS Direct is the LAA&apos;s telephone-only advice service for specified non-imprisonable
              offences. The DSCC routes those calls to CDS Direct rather than to an attendance
              firm. The list of qualifying matters is set out in the Standard Crime Contract
              Specification and includes:
            </p>
            <ul className="mt-3 list-disc space-y-2 pl-6 text-sm leading-relaxed text-[var(--muted)]">
              <li>Non-imprisonable offences (drunk and disorderly, drunk in a public place, low-level public order).</li>
              <li>Breach of police bail conditions (subject to exceptions).</li>
              <li>Warrants of arrest where the underlying matter is not imprisonable.</li>
              <li>Certain non-imprisonable road traffic offences.</li>
            </ul>
            <p className="mt-3 text-sm leading-relaxed text-[var(--muted)]">
              CDS Direct work pays at a lower rate and does not normally include attendance. There
              are specified exceptions where attendance is funded even on a CDS Direct matter — for
              example, vulnerable suspects under PACE Code C, an interview that will be conducted
              in any event, or a case that subsequently escalates to an imprisonable offence.
            </p>
          </section>

          {/* Engaged requirements */}
          <section className="mb-12">
            <SectionHeading id="engaged">&quot;Engaged&quot; requirements for duty solicitors</SectionHeading>
            <p className="mt-3 text-sm leading-relaxed text-[var(--muted)]">
              Under the SCC, every duty solicitor must remain &quot;engaged&quot; — actively doing crime
              work — to retain duty slots and stay deployable on the rota. The 2025 Specification
              (paras 6.21&ndash;6.23) and Duty Solicitor Guidance set this out in two layers:
            </p>
            <h3 className="mt-6 text-lg font-bold text-[var(--navy)]">Standing eligibility</h3>
            <ul className="mt-3 list-disc space-y-2 pl-6 text-sm leading-relaxed text-[var(--muted)]">
              {DUTY_SOLICITOR_STANDING.map((req) => (
                <li key={req}>{req}</li>
              ))}
            </ul>
            <h3 className="mt-6 text-lg font-bold text-[var(--navy)]">
              Ongoing engaged requirements (rolling periods)
            </h3>
            <ul className="mt-3 list-disc space-y-2 pl-6 text-sm leading-relaxed text-[var(--muted)]">
              {ENGAGED_REQUIREMENTS.map((req) => (
                <li key={req}>{req}</li>
              ))}
            </ul>
            <p className="mt-3 text-sm leading-relaxed text-[var(--muted)]">
              Failure to meet the engaged requirements can lead the LAA to suspend or exclude a duty
              solicitor, remove duty slots, or apply contract sanctions (Specification paras 6.25,
              6.42&ndash;6.44). That process is separate from{' '}
              <strong className="text-[var(--navy)]">ADMIN 3</strong>, which is the annual Police
              Station Register cleanse for <em>representatives</em> only.
            </p>
            <p className="mt-3 text-sm leading-relaxed text-[var(--muted)]">
              Accredited reps do not have an equivalent set of engaged requirements, but they must
              remain at an SCC firm with active supervision — a gap in supervision can see them
              removed from the Register when the supervising solicitor fails to return a completed
              ADMIN 3 at the annual cleanse.
            </p>
          </section>

          {/* Common problems */}
          <section className="mb-12">
            <SectionHeading id="common-problems">Common problems and how to handle them</SectionHeading>
            <div className="mt-6 space-y-4">
              {COMMON_PROBLEMS.map((p) => (
                <div
                  key={p.title}
                  className="rounded-[var(--radius)] border border-[var(--card-border)] bg-[var(--card-bg)] p-5 shadow-[var(--card-shadow)]"
                >
                  <h3 className="text-base font-bold text-[var(--navy)]">{p.title}</h3>
                  <p
                    className="mt-2 text-sm leading-relaxed text-[var(--muted)]"
                    dangerouslySetInnerHTML={{ __html: p.body }}
                  />
                </div>
              ))}
            </div>
          </section>

          {/* FAQs */}
          <section className="mb-12">
            <SectionHeading id="faqs">Frequently asked questions</SectionHeading>
            <div className="mt-4 divide-y divide-[var(--border)] rounded-[var(--radius-lg)] border border-[var(--card-border)] bg-[var(--card-bg)]">
              {FAQS.map((faq) => (
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

          {/* Related */}
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

          <ResolvedContentSources
            id="sources"
            title="Official sources"
            className="mb-12"
            context={{ kind: 'page', path: '/DSCCRegistrationGuide' }}
            extra={SOURCES}
          />

          <section className="rounded-[var(--radius-lg)] bg-[var(--navy)] p-8 text-center">
            <h2 className="text-xl font-bold text-white">Want to work in criminal defence?</h2>
            <p className="mt-3 text-sm text-slate-300">
              Read our complete PSRAS pathway, then plan how you will build a freelance practice
              once you are on the Register.
            </p>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
              <Link href="/HowToBecomePoliceStationRep" className="btn-gold no-underline">
                How to become a rep
              </Link>
              <Link
                href="/GetWork"
                className="btn-outline !border-slate-500 !text-white hover:!border-[var(--gold)] hover:!text-[var(--gold)] no-underline"
              >
                Get Work guide
              </Link>
            </div>
          </section>
        </div>
      </div>
    </>
  );
}
