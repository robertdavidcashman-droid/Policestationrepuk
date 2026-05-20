import Link from 'next/link';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { buildMetadata } from '@/lib/seo';

export const metadata = buildMetadata({
  title: "Beginner's Guide to Police Station Representation — UK 2026",
  description:
    'A complete plain-English introduction to how police station representation works in England and Wales: PACE rights, the case lifecycle, the caution and adverse inference, legal privilege, the key players, and how legal aid pays for it all.',
  path: '/BeginnersGuide',
});

const ON_THIS_PAGE = [
  { id: 'who-its-for', label: 'Who this guide is for' },
  { id: 'rights', label: 'Your three core PACE rights' },
  { id: 'lifecycle', label: 'The lifecycle of a custody case' },
  { id: 'caution', label: 'The caution and adverse inference' },
  { id: 'privilege', label: 'Legal privilege and conflicts' },
  { id: 'players', label: 'The key players' },
  { id: 'funding', label: 'How legal aid funding works' },
  { id: 'outcomes', label: 'Possible custody outcomes' },
  { id: 'vulnerable', label: 'Vulnerable suspects and appropriate adults' },
  { id: 'myths', label: 'Common misconceptions' },
  { id: 'faqs', label: 'Frequently asked questions' },
  { id: 'sources', label: 'Official sources' },
];

const RIGHTS = [
  {
    n: 'Section 56',
    title: 'Right to have someone informed of your arrest',
    body: 'You can ask the custody officer to tell a friend, relative, or other person reasonably likely to take an interest in your welfare that you have been arrested. The right can only be delayed in very limited circumstances (serious offences and a superintendent&apos;s written authority).',
  },
  {
    n: 'Section 58',
    title: 'Right to consult a solicitor — free of charge',
    body: 'You can speak to a solicitor or accredited representative in private, at any time, free of charge regardless of your income. This is the most powerful right in custody. It can only be delayed in very narrow circumstances and the delay must be authorised in writing by a senior officer.',
  },
  {
    n: 'Section 60',
    title: 'Right to consult the PACE Codes of Practice',
    body: 'You are entitled to read the PACE Codes — the rulebook the police themselves operate under. In practice the custody officer must offer a printed copy. The right is rarely exercised but it underpins every challenge to the way the custody process has been handled.',
  },
];

const LIFECYCLE = [
  {
    step: 1,
    title: 'Arrest and arrival in custody',
    body: 'The suspect is brought into the custody suite. The custody sergeant authorises detention under PACE s.37, opens a custody record, asks why the suspect has been arrested, and runs through the rights — including the right to free legal advice. If the suspect wants advice, the sergeant calls the Defence Solicitor Call Centre (DSCC).',
  },
  {
    step: 2,
    title: 'DSCC allocation',
    body: 'The DSCC matches the request to the suspect&apos;s own solicitor (if named) or to a duty solicitor on the local rota. The firm receiving the call decides whether to send a duty solicitor, an accredited representative, or — for low-level matters — to give telephone-only advice (CDS Direct).',
  },
  {
    step: 3,
    title: 'Disclosure with the officer in the case',
    body: 'The legal adviser arrives at the custody suite and asks the investigating officer for &quot;disclosure&quot;: the legal basis for arrest, the offence(s) under investigation, and the evidence the police hold. PACE Code C requires &quot;sufficient information&quot; to allow proper advice — but the police are not obliged to share everything. Extracting what is actually known is the first skill of the role.',
  },
  {
    step: 4,
    title: 'Private consultation with the suspect',
    body: 'The adviser then speaks to the suspect in a private consultation room. This conversation is legally privileged — the police cannot listen, record, or ask the suspect what was said. The adviser takes instructions, explains the law, explains the right to silence and how adverse inference works, and agrees an interview strategy.',
  },
  {
    step: 5,
    title: 'Recorded interview under caution',
    body: 'The adviser sits next to the suspect in the interview room while officers question them. The interview is audio (and often video) recorded. The adviser&apos;s role is not to answer for the suspect, but to protect their rights — intervening on improper questioning, requesting breaks, raising welfare or vulnerability issues, and supporting the interview strategy agreed in consultation.',
  },
  {
    step: 6,
    title: 'Further enquiries, identification, samples',
    body: 'Between interviews the police may conduct identification procedures (Code D — VIPER, video, group, or street identification), take fingerprints and DNA, search the suspect&apos;s phone, or interview again as new disclosure emerges. The adviser remains the client&apos;s point of contact throughout.',
  },
  {
    step: 7,
    title: 'Charge or release decision',
    body: 'After interviews and enquiries, the officer in the case consults a custody sergeant (and often the Crown Prosecution Service via CPS Direct) on the charging decision. The four possible outcomes are: charged (sent to court — sometimes with police bail conditions), bailed under investigation (released with conditions and a date to return), released under investigation (no conditions, no return date), or no further action.',
  },
];

const PLAYERS = [
  {
    title: 'Duty Solicitor',
    body: 'A fully qualified solicitor who has passed the Police Station Qualification (PSQ) and is on the local duty rota administered through the DSCC. Can advise at the police station and represent the client in the magistrates&apos; and Crown Court. Must be employed by an SCC firm and meet ongoing duty solicitor &quot;engaged&quot; requirements.',
  },
  {
    title: 'Accredited Representative',
    body: 'A non-solicitor who has passed the Police Station Representatives Accreditation Scheme (PSRAS). Works under a Supervising Solicitor at an SCC firm. Can advise at the police station — including alone — but cannot conduct court advocacy. Many firms rely on accredited reps to provide 24/7 cover.',
  },
  {
    title: 'Probationary Representative',
    body: 'A trainee on the PSRAS route who has enrolled with Cardiff or Datalaw and been added to the Register by their Supervising Solicitor (via ADMIN 2). Can attend custody but only under supervision — usually with the supervisor in the building or on the phone in real time.',
  },
  {
    title: 'Criminal Defence Firm',
    body: 'A firm holding a Standard Crime Contract with the Legal Aid Agency. Receives duty allocations from the DSCC, own-client requests, and back-up cover. The contract is with the firm, not the individual solicitor or rep. The firm is paid by the LAA on a fixed-fee basis per attendance.',
  },
  {
    title: 'Defence Solicitor Call Centre (DSCC)',
    body: 'A national 24/7 call centre operated under LAA contract. Receives every police-station request for legal advice in England and Wales, matches it to a solicitor or firm, and routes it accordingly. Also operates CDS Direct — the telephone-only advice line for the lowest-level offences (drunk and disorderly, breach of bail, etc).',
  },
  {
    title: 'Custody Sergeant',
    body: 'The police officer in charge of the custody suite. Independent of the investigating officer. Authorises detention, ensures the suspect&apos;s rights are upheld, manages the custody record, and signs off on charge and bail decisions. The custody sergeant is the legal adviser&apos;s most important counterpart in the building.',
  },
];

const FUNDING_POINTS = [
  'Police station advice is free for every suspect — regardless of income, savings, or wealth. There is no means test for advice in custody. This is a deliberate policy choice: justice cannot be allowed to depend on a suspect&apos;s ability to pay during a custodial interview.',
  'The Legal Aid Agency pays the firm a fixed fee per attendance, set by police-station area and reviewed periodically. Most areas in England and Wales now operate under a £320 harmonised fixed fee (December 2025 onwards). If the work done significantly exceeds the fixed fee threshold (the &quot;escape&quot; case), the firm can claim hourly rates instead.',
  'The fee covers all work on the case at the police station — disclosure, consultation, interview(s), bail representations, and the attendance note. It does not cover court representation, which is funded separately under the magistrates&apos; or Crown Court legal aid certificate.',
  'The firm pays the attending adviser from the LAA fee. Employed solicitors and reps are paid a salary; self-employed reps are paid either a fixed attendance fee or a percentage of the LAA fee. Travel and out-of-hours allowances are usually agreed firm by firm.',
  'CDS Direct — the telephone-only service for non-imprisonable offences — is paid at a lower fee. The DSCC routes the lowest-level matters there to keep more legal aid budget available for the cases where physical attendance is essential.',
];

const OUTCOMES = [
  {
    label: 'Charged',
    body: 'Formal charge — the suspect is given a charge sheet, may be granted police bail (with or without conditions) to attend the magistrates&apos; court, or held in custody overnight for the next available court. Court legal aid kicks in at this point.',
  },
  {
    label: 'Bailed under investigation',
    body: 'Released on police bail with conditions and a date to return to the police station. Increasingly common where the police need more time (digital forensics, third-party material, CPS advice). Conditions can include curfews, residence requirements, and no-contact orders.',
  },
  {
    label: 'Released under investigation (RUI)',
    body: 'Released without bail and without a fixed return date. The case stays open and the suspect may be re-interviewed weeks or months later. Often used where the investigation is ongoing but no statutory bail conditions are needed.',
  },
  {
    label: 'No further action (NFA)',
    body: 'The investigation is closed. The arrest record may remain on the Police National Computer for several years (and can be disclosed in enhanced DBS checks for some roles) but no charge or caution is brought.',
  },
  {
    label: 'Out-of-court disposal',
    body: 'A formal caution, conditional caution, or community resolution. These avoid court but carry consequences — a simple caution stays on the PNC for life and is disclosed in many DBS checks. Suspects should never accept an out-of-court disposal without legal advice.',
  },
];

const MYTHS = [
  {
    myth: '&quot;Asking for a solicitor makes you look guilty.&quot;',
    truth: 'It does not. Refusing legal advice is the single biggest reason suspects make damaging admissions or fail to mention something on which they later rely in court. The police themselves take legal advice as standard before interview.',
  },
  {
    myth: '&quot;Only solicitors can advise — reps don\'t count.&quot;',
    truth: 'Accredited reps are regulated by the Legal Aid Agency and the SRA-regulated firm that supervises them. They take the same custody calls, conduct the same consultations, and sit in the same interviews as duty solicitors. The advice is no less privileged or competent.',
  },
  {
    myth: '&quot;The duty solicitor is on the police side.&quot;',
    truth: 'Duty solicitors and accredited reps are independent of the police. They are paid by Legal Aid, not by the force. Their professional duty is to the suspect alone. Suspects who name a specific solicitor often receive worse service — because they may be at a firm with no out-of-hours cover.',
  },
  {
    myth: '&quot;Going no comment automatically gets the case dropped.&quot;',
    truth: 'No comment is a tactical choice, not a magic bullet. In some cases it is the right advice. In others — particularly where the police already hold strong evidence — silence can trigger adverse inference at trial under CJPOA 1994 s.34. A trained adviser weighs the disclosure and the law before recommending it.',
  },
  {
    myth: '&quot;You can be held for as long as the police want.&quot;',
    truth: 'PACE imposes strict detention clocks: 24 hours initially, extendable by superintendent authority to 36 hours, and by a magistrates&apos; court warrant to a maximum of 96 hours (longer for terrorism offences under the Terrorism Act 2000). The custody clock and review times are recorded in the custody record.',
  },
];

const FAQS = [
  {
    q: 'Do I have to answer police questions?',
    a: 'No. You have a right to silence under common law and PACE. However, under CJPOA 1994 sections 34–37, a court can draw an &quot;adverse inference&quot; from your silence in interview if you later rely on something at trial that you could reasonably have mentioned earlier. Whether to answer, give a prepared statement, or go no comment is a tactical decision best taken with legal advice on the disclosure.',
  },
  {
    q: 'Is the police station legal advice really free?',
    a: 'Yes. Advice at the police station is free for everyone regardless of income or wealth. The Legal Aid Agency funds it through a fixed fee paid to the firm. You do not pay, and your solicitor or representative does not pass any cost on to you.',
  },
  {
    q: 'How long can the police hold me without charge?',
    a: 'The standard PACE limit is 24 hours from your arrival at the custody suite. A superintendent can extend that to 36 hours for indictable offences. Beyond that, the police must apply to a magistrates&apos; court for a warrant of further detention — to a maximum of 96 hours total. Terrorism Act detentions can be much longer.',
  },
  {
    q: 'What happens if I am released under investigation?',
    a: 'You are free to leave but the investigation is still open. The police can call you back to be interviewed again, particularly after forensic results, phone downloads, or third-party material come in. You should keep your solicitor informed and respond promptly to any re-interview request — your earlier advice and the original disclosure will still be relevant.',
  },
  {
    q: 'Can my solicitor stop the interview?',
    a: 'They cannot end the interview themselves, but they can — and should — intervene to protect your rights. They can request a break for further consultation, challenge improper questioning, raise welfare concerns, and refuse to allow the interview to continue if you become unfit. In serious cases the adviser may advise you to terminate by going no comment.',
  },
  {
    q: 'Is the consultation with my solicitor really private?',
    a: 'Yes — it is protected by legal professional privilege. The police cannot listen, record, or ask either of you to disclose what was said. You can speak completely freely with your adviser. The only exception is if your conversation discloses an ongoing risk to life — extremely rare in practice.',
  },
  {
    q: 'Can I have a solicitor at a voluntary interview?',
    a: 'Yes. Even if you have not been arrested, any interview under caution (including a &quot;voluntary&quot; one at the police station or at home) triggers the right to free legal advice. Never accept a voluntary interview without legal advice first — the consequences of a caution-warned admission are the same whether you were arrested or not.',
  },
];

const SOURCES = [
  { label: 'Police and Criminal Evidence Act 1984', href: 'https://www.legislation.gov.uk/ukpga/1984/60/contents' },
  { label: 'PACE Codes of Practice (A–H)', href: 'https://www.gov.uk/guidance/police-and-criminal-evidence-act-1984-pace-codes-of-practice' },
  { label: 'Criminal Justice and Public Order Act 1994 (adverse inference)', href: 'https://www.legislation.gov.uk/ukpga/1994/33/contents' },
  { label: 'Standard Crime Contract 2022', href: 'https://www.gov.uk/government/publications/standard-crime-contract-2022' },
  { label: 'Legal Aid Agency', href: 'https://www.gov.uk/government/organisations/legal-aid-agency' },
  { label: 'Police Station Register Arrangements 2025', href: 'https://www.gov.uk/guidance/police-station-representatives-and-duty-solicitors' },
];

const RELATED = [
  { href: '/WhatDoesRepDo', label: 'What does a police station rep do?', desc: 'Day-in-the-life breakdown of the role' },
  { href: '/HowToBecomePoliceStationRep', label: 'How to become a rep', desc: 'Full PSRAS roadmap from enrolment to CIT' },
  { href: '/DutySolicitorVsRep', label: 'Duty solicitor vs rep', desc: 'The differences in qualification, scope, and pay' },
  { href: '/PoliceStationRepPay', label: 'Rep pay rates', desc: 'What employed and freelance reps actually earn' },
  { href: '/PACE', label: 'PACE Codes', desc: 'Reference summaries of Codes A–H' },
  { href: '/DSCCRegistrationGuide', label: 'DSCC Registration Guide', desc: 'How the duty call flow really works' },
];

function SectionHeading({ id, children }: { id: string; children: React.ReactNode }) {
  return (
    <h2 id={id} className="text-h2 scroll-mt-24 text-[var(--navy)]">
      {children}
    </h2>
  );
}

export default function BeginnersGuidePage() {
  return (
    <>
      <section className="bg-[var(--navy)] py-12 sm:py-16">
        <div className="page-container !py-0">
          <Breadcrumbs
            light
            items={[
              { label: 'Home', href: '/' },
              { label: 'Resources', href: '/Resources' },
              { label: "Beginner's Guide", href: '/BeginnersGuide' },
            ]}
          />
          <h1 className="mt-4 text-h1 text-white">
            How Police Station Representation Works
          </h1>
          <p className="mt-4 max-w-3xl text-lg leading-relaxed text-white">
            A complete plain-English introduction to police station advice in England and Wales —
            for trainee reps, criminal defence newcomers, suspects, and anyone who wants to
            understand the system. Covers PACE rights, the full custody lifecycle, the caution,
            legal privilege, the key players, and how legal aid pays for it all.
          </p>
          <p className="mt-2 text-xs text-slate-300">
            Last updated: 20 May 2026 · Author: Robert Cashman, Duty Solicitor &amp; Higher Court Advocate
          </p>
        </div>
      </section>

      <div className="page-container">
        <div className="mx-auto max-w-4xl">
          {/* Read this first */}
          <div className="mb-10 rounded-[var(--radius-lg)] border border-amber-300 bg-amber-50 p-6">
            <h2 className="text-base font-bold text-amber-900">Read this first</h2>
            <p className="mt-2 text-sm leading-relaxed text-amber-900">
              This guide is <strong>general information only</strong> — not legal advice. If you or
              someone you know is in custody right now, ask the custody officer for the duty
              solicitor immediately. Advice is free, confidential, and available 24 hours a day.
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

          {/* Who its for */}
          <section className="mb-12">
            <SectionHeading id="who-its-for">Who this guide is for</SectionHeading>
            <p className="mt-3 text-sm leading-relaxed text-[var(--muted)]">
              The police station is one of the most consequential environments in the criminal
              justice system. What is said in a tape-recorded interview can decide whether a case
              ends in no further action or a Crown Court trial — yet most suspects (and many
              trainee advisers) walk into it without understanding the rules.
            </p>
            <p className="mt-3 text-sm leading-relaxed text-[var(--muted)]">
              This guide is written for four audiences:
            </p>
            <ul className="mt-3 list-disc space-y-2 pl-6 text-sm leading-relaxed text-[var(--muted)]">
              <li><strong>Trainee reps and paralegals</strong> who need a clean conceptual map before their first observed attendance.</li>
              <li><strong>Career-changers</strong> considering criminal defence and wanting to know what the day-to-day actually looks like.</li>
              <li><strong>Suspects and their families</strong> who have been told to contact a duty solicitor and want to understand the process.</li>
              <li><strong>Journalists, researchers and policy people</strong> who need an accurate, citable overview.</li>
            </ul>
          </section>

          {/* Rights */}
          <section className="mb-12">
            <SectionHeading id="rights">Your three core PACE rights</SectionHeading>
            <p className="mt-3 text-sm leading-relaxed text-[var(--muted)]">
              The Police and Criminal Evidence Act 1984 (PACE) and its Codes of Practice set out
              every detained person&apos;s rights in custody. The three rights below sit at the
              heart of the system — the custody sergeant must read them to you on arrival and you
              can exercise them at any time during your detention.
            </p>
            <div className="mt-6 space-y-4">
              {RIGHTS.map((r) => (
                <div
                  key={r.title}
                  className="rounded-[var(--radius)] border-l-4 border-[var(--gold)] bg-slate-50 p-5"
                >
                  <p className="text-xs font-semibold uppercase tracking-wide text-[var(--gold)]">
                    {r.n}
                  </p>
                  <h3 className="mt-1 text-base font-bold text-[var(--navy)]">{r.title}</h3>
                  <p
                    className="mt-2 text-sm leading-relaxed text-[var(--muted)]"
                    dangerouslySetInnerHTML={{ __html: r.body }}
                  />
                </div>
              ))}
            </div>
            <p className="mt-4 text-sm leading-relaxed text-[var(--muted)]">
              These rights sit alongside the safeguards in PACE Code C — appropriate adults for
              vulnerable suspects, interpreter provision, rest periods, food, fitness for
              interview, and the right to challenge improper questioning.
            </p>
          </section>

          {/* Lifecycle */}
          <section className="mb-12">
            <SectionHeading id="lifecycle">The lifecycle of a custody case</SectionHeading>
            <p className="mt-3 text-sm leading-relaxed text-[var(--muted)]">
              Every case follows the same seven-stage arc — from the moment of arrest to the
              charge or release decision. Times vary, but the structure does not.
            </p>
            <div className="mt-6 space-y-4">
              {LIFECYCLE.map((stage) => (
                <div
                  key={stage.step}
                  className="rounded-[var(--radius-lg)] border border-[var(--card-border)] bg-[var(--card-bg)] p-6 shadow-[var(--card-shadow)]"
                >
                  <div className="flex items-start gap-4">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 border-[var(--gold)] text-sm font-bold text-[var(--gold)]">
                      {stage.step}
                    </span>
                    <div>
                      <h3 className="text-base font-bold text-[var(--navy)]">{stage.title}</h3>
                      <p
                        className="mt-2 text-sm leading-relaxed text-[var(--muted)]"
                        dangerouslySetInnerHTML={{ __html: stage.body }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Caution */}
          <section className="mb-12">
            <SectionHeading id="caution">The caution and adverse inference</SectionHeading>
            <div className="mt-4 rounded-[var(--radius-lg)] border border-[var(--gold)]/30 bg-amber-50/80 p-5 italic text-[var(--navy)]">
              &quot;You do not have to say anything, but it may harm your defence if you do not mention
              when questioned something which you later rely on in court. Anything you do say may
              be given in evidence.&quot;
            </div>
            <p className="mt-4 text-sm leading-relaxed text-[var(--muted)]">
              This is the most important warning in police-station practice. Decoded:
            </p>
            <ul className="mt-3 list-disc space-y-2 pl-6 text-sm leading-relaxed text-[var(--muted)]">
              <li><strong>You do not have to say anything.</strong> You have a right to silence. You can answer &quot;no comment&quot; to every question.</li>
              <li><strong>But silence can be used against you.</strong> Under CJPOA 1994 s.34, if you stay silent in interview and later rely on a defence at trial that you could reasonably have mentioned, the court can draw an &quot;adverse inference&quot; — treating your earlier silence as suspicious.</li>
              <li><strong>Anything you say is evidence.</strong> The interview is recorded. Even off-the-cuff remarks (in the car, in the corridor, in the cell) can be repeated in court if the officer made a note.</li>
            </ul>
            <p className="mt-4 text-sm leading-relaxed text-[var(--muted)]">
              The decision whether to answer questions, give a prepared statement, or go no
              comment is the central tactical call of every police-station attendance. It depends
              on what the police disclose, what the suspect&apos;s instructions are, and how
              strong the case looks against them. There is no &quot;always answer&quot; or &quot;always no
              comment&quot; rule — that is what the adviser is trained to weigh up.
            </p>
          </section>

          {/* Privilege */}
          <section className="mb-12">
            <SectionHeading id="privilege">Legal privilege and conflicts</SectionHeading>
            <p className="mt-3 text-sm leading-relaxed text-[var(--muted)]">
              Anything a client tells their adviser in the private consultation is protected by
              legal professional privilege. The police cannot listen, cannot ask either party
              what was said, and cannot compel disclosure of the consultation notes — not now,
              not at trial, not on appeal.
            </p>
            <p className="mt-3 text-sm leading-relaxed text-[var(--muted)]">
              There is one important professional limit: an adviser cannot knowingly let a client
              mislead the court or the police. If a client admits guilt in consultation but then
              insists on putting forward a positive false defence in interview, the adviser must
              advise them to go no comment instead. If the client refuses, the adviser must
              withdraw from the case on grounds of &quot;professional embarrassment.&quot; This is
              fundamental to the SRA Code of Conduct.
            </p>
          </section>

          {/* Players */}
          <section className="mb-12">
            <SectionHeading id="players">The key players</SectionHeading>
            <p className="mt-3 text-sm leading-relaxed text-[var(--muted)]">
              Six roles shape every police station case. Understanding who does what — and what
              they cannot do — is the foundation of the job.
            </p>
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              {PLAYERS.map((p) => (
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

          {/* Funding */}
          <section className="mb-12">
            <SectionHeading id="funding">How legal aid funding works</SectionHeading>
            <p className="mt-3 text-sm leading-relaxed text-[var(--muted)]">
              Police station advice is the only area of legal aid with no means test. The system
              is paid for through the Legal Aid Agency&apos;s fixed-fee scheme.
            </p>
            <ul className="mt-4 space-y-3">
              {FUNDING_POINTS.map((p, i) => (
                <li
                  key={i}
                  className="rounded-[var(--radius)] border border-[var(--card-border)] bg-[var(--card-bg)] p-4 text-sm leading-relaxed text-[var(--muted)]"
                  dangerouslySetInnerHTML={{ __html: p }}
                />
              ))}
            </ul>
          </section>

          {/* Outcomes */}
          <section className="mb-12">
            <SectionHeading id="outcomes">Possible custody outcomes</SectionHeading>
            <div className="mt-6 space-y-4">
              {OUTCOMES.map((o) => (
                <div
                  key={o.label}
                  className="rounded-[var(--radius)] border-l-4 border-[var(--gold)] bg-slate-50 p-5"
                >
                  <h3 className="text-base font-bold text-[var(--navy)]">{o.label}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-[var(--muted)]">{o.body}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Vulnerable */}
          <section className="mb-12">
            <SectionHeading id="vulnerable">Vulnerable suspects and appropriate adults</SectionHeading>
            <p className="mt-3 text-sm leading-relaxed text-[var(--muted)]">
              PACE Code C provides extensive safeguards for suspects who are under 18, mentally
              vulnerable, or otherwise at risk in custody. The most important is the requirement
              for an <strong>Appropriate Adult</strong> to be present at all stages — including
              the rights notification, consultation with the legal adviser, and the interview
              itself.
            </p>
            <ul className="mt-4 list-disc space-y-2 pl-6 text-sm leading-relaxed text-[var(--muted)]">
              <li><strong>Juveniles (under 18):</strong> a parent, guardian, social worker, or other responsible adult unconnected with the offence.</li>
              <li><strong>Mentally vulnerable adults:</strong> a relative, a registered mental-health professional, or a trained appropriate-adult scheme volunteer.</li>
              <li><strong>Identification:</strong> the custody sergeant should screen every detainee for vulnerability — but the legal adviser must form their own view in consultation. Flagging vulnerability early is one of the most common omissions in failed CIT scenarios.</li>
              <li><strong>Limits:</strong> the appropriate adult is not a legal adviser and cannot replace one. They sit alongside the adviser, not instead of them.</li>
            </ul>
          </section>

          {/* Myths */}
          <section className="mb-12">
            <SectionHeading id="myths">Common misconceptions</SectionHeading>
            <div className="mt-6 space-y-4">
              {MYTHS.map((m, i) => (
                <div
                  key={i}
                  className="rounded-[var(--radius)] border border-[var(--card-border)] bg-[var(--card-bg)] p-5 shadow-[var(--card-shadow)]"
                >
                  <p
                    className="text-base font-bold text-red-700"
                    dangerouslySetInnerHTML={{ __html: `Myth: ${m.myth}` }}
                  />
                  <p className="mt-2 text-sm leading-relaxed text-[var(--muted)]">
                    <strong className="text-[var(--navy)]">Reality:</strong> {m.truth}
                  </p>
                </div>
              ))}
            </div>
          </section>

          {/* FAQ */}
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

          {/* Sources */}
          <section className="mb-12">
            <SectionHeading id="sources">Official sources</SectionHeading>
            <ul className="mt-4 space-y-2">
              {SOURCES.map((link) => (
                <li key={link.href}>
                  <a
                    href={link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm font-medium text-[var(--navy)] underline decoration-[var(--gold)]/40 underline-offset-2 hover:decoration-[var(--gold)]"
                  >
                    {link.label} ↗
                  </a>
                </li>
              ))}
            </ul>
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

          <section className="rounded-[var(--radius-lg)] bg-[var(--navy)] p-8 text-center">
            <h2 className="text-xl font-bold text-white">Need help right now?</h2>
            <p className="mt-3 text-sm text-slate-300">
              Find an accredited police station representative on the directory or contact us with
              general questions. We cannot provide legal advice on a specific case — for that, ask
              the custody officer for the duty solicitor.
            </p>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
              <Link href="/directory" className="btn-gold no-underline">Find a Rep</Link>
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
