import Link from 'next/link';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { PsrTrainPromo } from '@/components/PsrTrainPromo';
import { buildMetadata } from '@/lib/seo';

export const metadata = buildMetadata({
  title: 'How to Find a Supervising Solicitor — Police Station Rep Guide',
  description:
    'Practical guide to finding a supervising solicitor for PSRAS portfolio work: why firms say no, employment vs paid supervision, Law Society search, SCC firms, and professional outreach that actually works.',
  path: '/FindSupervisingSolicitor',
});

const WHY_ELUSIVE = [
  {
    title: 'Supervision is a regulated burden, not a favour',
    body: 'A supervising solicitor must hold a Standard Crime Contract (SCC), meet LAA Police Station Register Arrangements requirements, submit ADMIN 2/ADMIN 3 forms to the DSCC, and remain professionally accountable for your attendances. That is ongoing work — not a one-off signature.',
  },
  {
    title: 'Firms hire to solve their workload',
    body: 'Criminal practices receive hundreds of speculative emails asking for supervision. Most are deleted because the writer offers no immediate value. Firms invest in people who will make the practice easier from day one — not people who need the firm to solve their accreditation problem first.',
  },
  {
    title: 'Probationary reps cannot freelance',
    body: 'Until you pass the Critical Incidents Test (CIT) and are fully accredited, you must work under direct supervision at an SRA-regulated firm. You cannot build a freelance practice while completing your portfolio.',
  },
  {
    title: 'Geography and logistics matter',
    body: 'Police station cover is often at 2am. Firms need someone with a full driving licence, a car, and realistic travel time to local custody suites. Applications from the wrong area — without a relocation plan — are ignored.',
  },
];

const PATHS = [
  {
    title: 'Path A — Employment at an SCC crime firm (most common)',
    steps: [
      'Target firms holding a Standard Crime Contract who are active duty solicitors — use the Law Society “Find a Solicitor” tool and filter for crime.',
      'Apply for paralegal, legal assistant, or admin roles first. Supervision is earned after you prove useful on billing, CRM work, and station logistics.',
      'State clearly that you have (or are studying for) PSRAS accreditation and want a long-term police station career.',
      'Complete supervised attendances in-house; the firm’s supervising solicitor registers you with the DSCC on ADMIN 2.',
    ],
    note: 'Most successful reps never “found” a supervisor on the open market — they were hired, then supervised.',
  },
  {
    title: 'Path B — Paid private supervision (harder, not impossible)',
    steps: [
      'Some accredited reps or small firms offer paid portfolio supervision to trainees outside their employment — rates and availability vary widely.',
      'Expect to pay for their time, DSCC administration, and professional risk. Get the arrangement in writing: scope, fees, attendance limits, and what happens if you fail an assessment.',
      'Verify they hold an active SCC, meet supervising solicitor standards, and will actually submit ADMIN 2/ADMIN 3 — not just “mentor” you informally.',
      'This path does not replace the need for real attendances; you still need access to live police station work.',
    ],
    note: 'PoliceStationRepUK cannot recommend or broker supervisors. Verify credentials independently.',
  },
];

const ACTION_PHASES = [
  {
    number: 1,
    title: 'Qualify your target list',
    timeframe: 'Week 1',
    steps: [
      'Use the Law Society Find a Solicitor search — crime / criminal defence, within 45 minutes of your home.',
      'Cross-check GOV.UK legal aid provider lists for active SCC holders.',
      'Note the head of crime or police station partner by name — never “Dear Sir/Madam”.',
      'Build a spreadsheet: firm name, contact, distance to nearest custody suites, date of outreach.',
    ],
  },
  {
    number: 2,
    title: 'Position yourself as an asset',
    timeframe: 'Weeks 1–4',
    steps: [
      'Lead with what you can do for them: admin, billing, CRM, out-of-hours availability — not “please supervise my portfolio”.',
      'Confirm full UK driving licence and car access in the first paragraph.',
      'Attach a concise CV: qualifications, PSRAS stage, relevant people-facing experience (care, retail, mental health).',
      'Mention willingness to work unsocial hours — with a real example of prior shift or on-call work.',
    ],
  },
  {
    number: 3,
    title: 'Network where supervisors already are',
    timeframe: 'Ongoing',
    steps: [
      'Join CLSA or LCCSA as a student/affiliate member if eligible — events are where duty solicitors meet.',
      'Attend local criminal law CPD or Law Society crime section meetings.',
      'Join the PoliceStationRepUK WhatsApp group for community context (not a supervision marketplace).',
      'Follow up every application by phone 3–5 days later — polite persistence beats one email.',
    ],
  },
  {
    number: 4,
    title: 'Close the supervision loop officially',
    timeframe: 'Once a firm agrees',
    steps: [
      'Confirm who the named supervising solicitor is and that they hold police station supervisor status under the 2025 Register Arrangements.',
      'Ensure ADMIN 2 is submitted to the DSCC when you start probationary registration.',
      'Keep a log of every supervised attendance for your portfolio — dates, stations, offence types, outcomes.',
      'Plan annual ADMIN 3 renewals with your supervisor — lapses can remove you from the register.',
    ],
  },
];

const DOS = [
  'Apply for paralegal or admin roles at SCC crime firms and grow into supervision.',
  'Research PSRAS requirements before contacting firms — show you understand the commitment.',
  'Demonstrate people-facing experience (care, hospitality, mental health, retail conflict).',
  'Highlight resilience: unsocial hours, driving licence, realistic travel radius.',
  'Get legal work experience (even voluntary) before cold-contacting firms.',
  'Personalise every email to the head of crime by name.',
];

const DONTS = [
  'Send emails titled “Can you supervise my portfolio?” or “Be my supervising solicitor?”',
  'Mass BCC applications — firms spot them instantly.',
  'Apply to corporate, family, or non-crime firms — they cannot supervise PSRAS work.',
  'Apply 200 miles away without stating you are relocating.',
  'Treat accreditation as a side hustle — firms invest in committed trainees.',
  'Expect free supervision from strangers — professional supervision has a real cost.',
];

const FAQS: { q: string; a: string }[] = [
  {
    q: 'Will PoliceStationRepUK become my supervising solicitor?',
    a: 'No. We are a directory platform, not a law firm. We cannot supervise portfolios, provide legal advice, or register you with the LAA.',
  },
  {
    q: 'Where can I find a supervising solicitor?',
    a: 'Primarily through employment at an SCC criminal defence firm, or occasionally through a paid private arrangement with an accredited provider. Use the Law Society directory, legal aid provider lists, and professional networks (CLSA, LCCSA).',
  },
  {
    q: 'Why is it so difficult to find a supervising solicitor?',
    a: 'Because supervision carries regulatory and insurance risk, requires DSCC administration, and demands the supervisor’s time on every attendance. Firms only take that on when the trainee also solves a business need.',
  },
  {
    q: "Why won't solicitors supervise me for free if I'm not their employee?",
    a: 'They are professionally accountable for your work product, must complete ADMIN forms, and carry the reputational risk if you perform poorly. Without employment, there is little incentive unless you pay or bring substantial value.',
  },
  {
    q: 'Can I pay a solicitor to supervise me privately?',
    a: 'Sometimes — arrangements vary. Get clear written terms: fee, number of attendances, DSCC registration, and what happens if either party ends the arrangement. Verify SCC status independently.',
  },
  {
    q: 'Can I complete PSRAS training without a supervisor, then find work after?',
    a: 'You can study and sit the written exam if not exempt, but portfolio attendances and the CIT require supervision. You cannot shortcut the supervised practice element.',
  },
  {
    q: 'I already passed the written exam — can I finish without a firm?',
    a: 'The written exam is only one component. Portfolio evidence and the Critical Incidents Test still require a qualifying supervising solicitor and real police station attendances.',
  },
  {
    q: 'Is it worth becoming a police station rep?',
    a: 'For the right person — resilient, geographically flexible, and committed to criminal defence — it remains a viable career. It is not quick, cheap, or suitable as casual extra income. See our full PSRAS roadmap for timelines and costs.',
  },
];

const OFFICIAL_LINKS = [
  {
    label: 'SRA — Police Station Representative Accreditation Scheme',
    href: 'https://www.sra.org.uk/solicitors/resources/specific-areas-of-practice/police-station-representative-accreditation-scheme/',
  },
  {
    label: 'SRA — Assessment guidelines',
    href: 'https://www.sra.org.uk/solicitors/resources/specific-areas-of-practice/assessment-guidelines/',
  },
  {
    label: 'SRA — Good practice guide for police station representatives',
    href: 'https://www.sra.org.uk/solicitors/resources/specific-areas-of-practice/good-practice-guide-police-station-representatives/',
  },
  {
    label: 'LAA — Police Station Register Arrangements 2025 (PDF)',
    href: 'https://assets.publishing.service.gov.uk/media/68dcf841ef1c2f72bc1e4c9f/Police_Station_Register_Arrangements_2025.pdf',
  },
  {
    label: 'Law Society — Find a Solicitor',
    href: 'https://solicitors.lawsociety.org.uk/',
  },
  {
    label: 'GOV.UK — PACE Codes of Practice',
    href: 'https://www.gov.uk/guidance/police-and-criminal-evidence-act-1984-pace-codes-of-practice',
  },
];

const RELATED = [
  { href: '/HowToBecomePoliceStationRep', label: 'How to Become a Rep', desc: 'Full PSRAS roadmap, costs, and CIT' },
  { href: '/BuildPortfolioGuide', label: 'Build Your Portfolio', desc: 'Supervised attendances and evidence' },
  { href: '/PrepareForCIT', label: 'Prepare for the CIT', desc: 'Critical Incidents Test prep' },
  { href: '/GetWork', label: 'Get Work Guide', desc: 'After accreditation — freelance practice' },
  { href: '/BeginnersGuide', label: "Beginner's Guide", desc: 'First weeks as a new rep' },
];

export default function FindSupervisingSolicitorPage() {
  return (
    <>
      <section className="bg-[var(--navy)] py-10 sm:py-14">
        <div className="page-container !py-0">
          <Breadcrumbs
            light
            items={[
              { label: 'Home', href: '/' },
              { label: 'Resources', href: '/Resources' },
              { label: 'Find a Supervising Solicitor', href: '/FindSupervisingSolicitor' },
            ]}
          />
          <p className="mt-3 text-sm font-medium text-[var(--gold)]">Career guide · PSRAS supervision</p>
          <h1 className="mt-2 text-h1 text-white">
            How to Find That Elusive Supervising Solicitor
          </h1>
          <p className="mt-3 max-w-2xl text-lg leading-relaxed text-slate-300">
            A practical, honest guide for aspiring police station representatives — why supervision
            is hard to secure, what firms actually want, and how to position yourself so an SCC
            crime practice will invest in your accreditation.
          </p>
          <p className="mt-2 text-xs text-slate-400">Last updated: 20 May 2026 · Article ref: FSS-20260520</p>
        </div>
      </section>

      <div className="page-container">
        <div className="mx-auto max-w-4xl">
          <div className="mb-10 rounded-[var(--radius-lg)] border border-amber-300 bg-amber-50 p-6">
            <h2 className="text-base font-bold text-amber-900">Important — read first</h2>
            <p className="mt-2 text-sm leading-relaxed text-amber-900">
              This page is <strong>general information only</strong>, not legal advice. PoliceStationRepUK
              is not a law firm and cannot act as your supervising solicitor. Always verify a firm&apos;s
              Standard Crime Contract status, supervisor credentials, and PSRAS requirements with the{' '}
              <a
                href="https://www.sra.org.uk/solicitors/resources/specific-areas-of-practice/police-station-representative-accreditation-scheme/"
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold underline"
              >
                SRA
              </a>{' '}
              and your chosen assessment organisation (Cardiff University or Datalaw) before relying on
              any arrangement.
            </p>
          </div>

          <section className="mb-12">
            <h2 className="text-h2 text-[var(--navy)]">Why supervising solicitors feel &quot;elusive&quot;</h2>
            <p className="mt-2 text-sm leading-relaxed text-[var(--muted)]">
              Under the{' '}
              <a
                href="https://assets.publishing.service.gov.uk/media/68dcf841ef1c2f72bc1e4c9f/Police_Station_Register_Arrangements_2025.pdf"
                target="_blank"
                rel="noopener noreferrer"
                className="underline"
              >
                Police Station Register Arrangements 2025
              </a>
              , a <strong>supervising solicitor</strong> is the solicitor who supervises your work,
              submits ADMIN 2 when you become probationary, and signs annual ADMIN 3 renewals. They
              must meet LAA contractual requirements — it is not informal mentoring.
            </p>
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              {WHY_ELUSIVE.map((item) => (
                <div
                  key={item.title}
                  className="rounded-[var(--radius)] border border-[var(--card-border)] bg-[var(--card-bg)] p-5 shadow-[var(--card-shadow)]"
                >
                  <h3 className="text-base font-bold text-[var(--navy)]">{item.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-[var(--muted)]">{item.body}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="mb-12">
            <h2 className="text-h2 text-[var(--navy)]">Two realistic paths to supervision</h2>
            <div className="mt-6 space-y-6">
              {PATHS.map((path) => (
                <div
                  key={path.title}
                  className="rounded-[var(--radius-lg)] border border-[var(--card-border)] bg-[var(--card-bg)] p-6 shadow-[var(--card-shadow)] sm:p-8"
                >
                  <h3 className="text-lg font-bold text-[var(--navy)]">{path.title}</h3>
                  <ol className="mt-4 list-decimal space-y-2 pl-5 text-sm leading-relaxed text-[var(--muted)]">
                    {path.steps.map((step) => (
                      <li key={step}>{step}</li>
                    ))}
                  </ol>
                  <p className="mt-4 rounded-lg bg-slate-50 px-4 py-3 text-sm text-[var(--muted)]">
                    <strong className="text-[var(--navy)]">Note:</strong> {path.note}
                  </p>
                </div>
              ))}
            </div>
          </section>

          <section className="mb-12">
            <h2 className="text-h2 text-[var(--navy)]">Your 4-phase action plan</h2>
            <div className="mt-6 space-y-6">
              {ACTION_PHASES.map((phase) => (
                <div
                  key={phase.number}
                  className="rounded-[var(--radius-lg)] border border-[var(--card-border)] bg-[var(--card-bg)] p-6 shadow-[var(--card-shadow)] sm:p-8"
                >
                  <div className="mb-4 flex items-start gap-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 border-[var(--gold)] text-sm font-bold text-[var(--gold)]">
                      {phase.number}
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-[var(--navy)]">{phase.title}</h3>
                      <p className="text-sm text-[var(--muted)]">{phase.timeframe}</p>
                    </div>
                  </div>
                  <ul className="space-y-2 pl-14">
                    {phase.steps.map((step) => (
                      <li key={step} className="flex gap-2 text-sm leading-relaxed text-[var(--muted)]">
                        <span className="mt-0.5 shrink-0 text-emerald-600">✓</span>
                        {step}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </section>

          <section className="mb-12">
            <h2 className="text-h2 text-[var(--navy)]">Professional do&apos;s and don&apos;ts</h2>
            <p className="mt-2 text-sm text-[var(--muted)]">
              Criminal defence firms reject most speculative supervision requests instantly. This
              table reflects what experienced practitioners and firm managers consistently report.
            </p>
            <div className="mt-6 grid gap-6 sm:grid-cols-2">
              <div className="rounded-[var(--radius)] border border-emerald-200 bg-emerald-50/50 p-5">
                <h3 className="font-bold text-emerald-900">Do this</h3>
                <ul className="mt-3 space-y-2">
                  {DOS.map((item) => (
                    <li key={item} className="flex gap-2 text-sm text-emerald-900">
                      <span className="shrink-0 font-bold">✓</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="rounded-[var(--radius)] border border-red-200 bg-red-50/50 p-5">
                <h3 className="font-bold text-red-900">Don&apos;t do this</h3>
                <ul className="mt-3 space-y-2">
                  {DONTS.map((item) => (
                    <li key={item} className="flex gap-2 text-sm text-red-900">
                      <span className="shrink-0 font-bold">✗</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </section>

          <PsrTrainPromo variant="card" campaign="find_supervisor" className="mb-12" />

          <section className="mb-12">
            <h2 className="text-h2 text-[var(--navy)]">Frequently asked questions</h2>
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
                  <p className="mt-3 text-sm leading-relaxed text-[var(--muted)]">{faq.a}</p>
                </details>
              ))}
            </div>
          </section>

          <section className="mb-12">
            <h2 className="text-h2 text-[var(--navy)]">Official sources</h2>
            <ul className="mt-4 space-y-2">
              {OFFICIAL_LINKS.map((link) => (
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
            <h2 className="text-xl font-bold text-white">Still building your PSRAS journey?</h2>
            <p className="mt-3 text-sm text-slate-300">
              Read the full accreditation roadmap, then return here when you are ready to approach
              firms professionally.
            </p>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
              <Link href="/HowToBecomePoliceStationRep" className="btn-gold no-underline">
                Full PSRAS guide
              </Link>
              <Link
                href="/Contact"
                className="btn-outline !border-slate-500 !text-white hover:!border-[var(--gold)] hover:!text-[var(--gold)] no-underline"
              >
                Contact us
              </Link>
            </div>
            <p className="mt-6 text-xs text-slate-400">
              Questions by email welcome — we cannot provide legal advice or act as your supervisor.
              Responses may take several days.
            </p>
          </section>
        </div>
      </div>
    </>
  );
}
