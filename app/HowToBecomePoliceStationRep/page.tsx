import Link from 'next/link';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { ContentReliabilityNotice } from '@/components/ContentReliabilityNotice';
import { ResolvedContentSources } from '@/components/ContentSourcesFooter';
import { PsrTrainPromo } from '@/components/PsrTrainPromo';
import { CustodyNotePagePromo } from '@/components/CustodyNotePagePromo';
import { GuideEmailCapture } from '@/components/GuideEmailCapture';
import { JsonLd } from '@/components/JsonLd';
import { buildMetadata, faqPageSchema } from '@/lib/seo';

/** Strip HTML tags / decode the few entities used in FAQ answers for clean JSON-LD text. */
function faqToPlainText(value: string): string {
  return value
    .replace(/<[^>]+>/g, '')
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .trim();
}

export const metadata = buildMetadata({
  title: 'How to Become a Police Station Representative — Complete 2026 Guide',
  description:
    'In-depth guide to becoming an accredited police station representative through the PSRAS scheme: eligibility, the written test, portfolio, the Critical Incidents Test (CIT), costs, timelines, supervision, and post-accreditation work.',
  path: '/HowToBecomePoliceStationRep',
});

const ON_THIS_PAGE = [
  { id: 'overview', label: 'What a police station rep does' },
  { id: 'legal-framework', label: 'The legal framework (PSRAS & LAA 2025)' },
  { id: 'reality', label: 'Reality check — is this for you?' },
  { id: 'eligibility', label: 'Eligibility and prerequisites' },
  { id: 'route-map', label: 'The route map at a glance' },
  { id: 'stage-1', label: 'Stage 1 — Enrol with an assessment organisation' },
  { id: 'stage-2', label: 'Stage 2 — Pass the Written Test' },
  { id: 'stage-3', label: 'Stage 3 — Portfolio (Part A and Part B)' },
  { id: 'stage-4', label: 'Stage 4 — Pass the Critical Incidents Test (CIT)' },
  { id: 'stage-5', label: 'Stage 5 — Get added to the Police Station Register' },
  { id: 'supervision', label: 'The supervision problem' },
  { id: 'costs', label: 'Costs and timeline' },
  { id: 'after', label: 'Life after accreditation' },
  { id: 'faqs', label: 'Frequently asked questions' },
  { id: 'sources', label: 'Official sources' },
];

const REALITY_POINTS = [
  {
    title: 'It is regulated legal work, not a side hustle',
    body: 'Police station representatives advise suspects in custody under PACE 1984 and act as the suspect&apos;s legal adviser inside the interview room. The accreditation is a Legal Aid Agency (LAA) regulatory requirement set out in the Police Station Representatives Accreditation Scheme (PSRAS). The standard expected is the same as a junior duty solicitor — adverse-inference law, identification procedures, vulnerable suspects, and complex disclosure are all in scope.',
  },
  {
    title: 'You will be called at 02:00',
    body: 'Police custody is a 24/7 operation. Once accredited and on the register you can be called any hour of the day, every day of the year, often with little warning. Most reps build a working life around an on-call rota with multiple firms. Reliability — picking up the phone, attending without undue delay once instructed, sending a clean attendance note within 24 hours — is the single most important commercial asset you have.',
  },
  {
    title: 'You need a Standard Crime Contract firm behind you',
    body: 'The LAA contracts with firms, not individuals. You cannot enrol, build a portfolio, or attend police stations until a firm holding a Standard Crime Contract (SCC) with a police station schedule agrees to put you on their contract and supervise you. This is the single biggest barrier to entry — and is covered in detail in our Find a Supervising Solicitor guide.',
  },
  {
    title: 'Probationary reps cannot freelance',
    body: 'Between enrolment and passing the Critical Incidents Test (CIT) you are a Probationary Representative. You must work under direct supervision at the firm whose SCC carries you. Freelance work is only possible once you are fully accredited and on the Police Station Register — typically 12–18 months after starting.',
  },
];

const ELIGIBILITY_RULES = [
  {
    title: 'Right to work in the UK',
    body: 'You must have an unrestricted right to work in the UK. Sponsorship visas issued for trainee or paralegal roles at SCC firms are uncommon — most successful applicants are settled, British, or Irish.',
  },
  {
    title: 'No law degree required',
    body: 'PSRAS is open to non-lawyers. You do not need an LLB, GDL, LPC, or SQE. The qualification is competence-based — Cardiff and Datalaw care about your ability to demonstrate the syllabus, not your academic background. That said, most successful candidates have completed at least an LLB, paralegal training, CILEX, or significant in-firm experience.',
  },
  {
    title: 'Character and suitability',
    body: 'The firm proposing you for the Register must be satisfied that you are of good character. A criminal record is not an automatic bar but must be disclosed to the firm at the application stage. Anything that could engage SRA &quot;character and suitability&quot; concerns (cautions, civil judgments, regulatory action) should be raised openly — concealment is far more damaging than the underlying issue.',
  },
  {
    title: 'Soft skills firms screen hard for',
    body: 'You must be calm under pressure, articulate, able to think strategically about disclosure and interview, and able to write a clean, accurate attendance note at 04:00 after being awake all night. Firms quickly weed out trainees who fold in the interview room or whose notes contradict the custody record.',
  },
];

const STAGE_1_STEPS = [
  'Confirm you have an SCC firm willing to support you (see Stage "Supervision problem" below).',
  'Choose between Cardiff University Law School (long-established, classroom + portfolio) or Datalaw (online / blended, more flexible scheduling).',
  'Pay the assessment organisation enrolment fee — typically £200–£400 — and receive your candidate handbook.',
  'Receive your probationary PSRAS reference. You are now formally enrolled but not yet on the Police Station Register.',
];

const STAGE_2_STEPS = [
  'Study the PACE Codes A–H (in particular Code C and Code G), the Criminal Procedure Rules, the Standard Crime Contract 2025, and the SRA Standards of competence for police station work.',
  'Sit the written examination — two hours, five questions, answer four (Datalaw format). Pass mark is at least 50% overall. See our full Written Exam guide.',
  'Exemptions: solicitors, barristers, LPC, BPTC, and specified CILEX qualifications (PSRA 2025). SQE pass alone is not listed as exempt — confirm with the LAA if unsure.',
  'The written exam must be passed before Part A portfolio cases begin (Datalaw). Resits are permitted under provider regulations — check current Cardiff/Datalaw timetables.',
];

const STAGE_3_STEPS = [
  'Part A Stage 1 — two cases observing your supervising solicitor advising at the police station.',
  'Part A Stage 2 — two cases where you are the primary adviser while observed; signed supervisor feedback required (Datalaw).',
  'Part B — five unsupervised case studies once you hold a probationary PIN (nine portfolio cases in total).',
  'Each case study covers advice and a police interview. Produce reflective write-ups: facts, disclosure, strategy, interview, learning point.',
  'Spread breadth across the nine cases: violence, dishonesty, drugs, traffic, youth, vulnerability, identification, adverse inference — not nine identical files.',
  'Submit to Cardiff/Datalaw for assessment. Expect feedback rounds before final pass. Full guide: Build Your PSRAS Portfolio.',
];

const STAGE_4_STEPS = [
  'Once probationary (Part A + written pass), you may undertake Part B and the CIT in either order (Datalaw).',
  'The CIT is a role-play under exam conditions. Datalaw uses audio scenarios — you respond aloud and are recorded. Confirm Cardiff format in their handbook.',
  'Marking (Datalaw): Content, Confidence, and Control — at least 50% on each criterion in each scenario.',
  'Scenarios follow chronological station attendance: telephone → custody → disclosure → consultation → interview → post-interview.',
  'Stay in role throughout — breaking character scores zero on that question (Datalaw). See our full CIT preparation guide.',
];

const STAGE_5_STEPS = [
  'Your supervising solicitor notifies the DSCC of your CIT pass and submits the upgrade paperwork.',
  'You move from Probationary Representative to Accredited Police Station Representative on the Police Station Register.',
  'You receive a permanent PSRAS PIN — used to identify you to the DSCC and custody officers. Attendances are claimed by the firm through the LAA monthly bulk-claim system (SaBC, fee code INVC).',
  'You can now (subject to your firm&apos;s policy) attend police stations as the sole legal adviser when instructed by a firm — including attendances arising from DSCC duty allocations to that firm (you are not the duty solicitor on the rota).',
];

const COST_TABLE = [
  { label: 'Assessment organisation enrolment', range: '£200 – £400' },
  { label: 'Training course (Cardiff / Datalaw, including written prep)', range: '£800 – £1,500' },
  { label: 'Portfolio assessment fees', range: '£300 – £500' },
  { label: 'Critical Incidents Test (CIT) fee', range: 'Check provider timetable (indicative £450–£650)' },
  { label: 'CIT resit (if needed)', range: 'Check provider regulations' },
  { label: 'SRA / Law Society administrative fees', range: '£0 – £100' },
  { label: 'Travel, accommodation, materials', range: '£200 – £600' },
  { label: 'Total range (single attempt)', range: '£1,950 – £3,750' },
];

const TIMELINE = [
  { phase: 'Securing an SCC firm', length: '1–12 months', detail: 'The hardest stage. Most candidates spend longer here than on the qualification itself.' },
  { phase: 'Enrolment + written test', length: '6–10 weeks', detail: 'Course attendance, self-study, exam booking, written stage pass.' },
  { phase: 'Portfolio (Part A + Part B)', length: '6–12 months', detail: 'Driven by police station case volume at your firm and your supervisor&apos;s availability.' },
  { phase: 'CIT preparation and exam', length: '4–8 weeks', detail: 'Mock interviews, scenario practice, booking the assessment.' },
  { phase: 'Register upgrade and PIN issue', length: '1–4 weeks', detail: 'Administrative — driven by DSCC processing.' },
  { phase: 'Total — start to PSRAS', length: '12–18 months', detail: 'Realistic end-to-end timeline for a candidate already in an SCC firm.' },
];

const SUPERVISION_KEY_POINTS = [
  'You need a Supervising Solicitor — a duty solicitor or a solicitor meeting the LAA Crime Contract Supervisor standard — at a firm with a Standard Crime Contract.',
  'They sign ADMIN 2 (adding you to the Register), supervise your attendances in real time, sign each portfolio entry, and file ADMIN 3 at every annual DSCC cleanse.',
  'You cannot pay a firm or a solicitor for supervision — this is not a service for sale. Any &quot;sponsor for a fee&quot; arrangement carries serious SRA and LAA risk.',
  'The reliable route is paid employment (or a structured apprenticeship) at an SCC firm. Realistic starting roles: police station clerk, paralegal, trainee, or in-house police station administrator.',
];

const AFTER_ACCREDITATION = [
  {
    title: 'Stay employed, build deeper knowledge',
    body: 'Many newly accredited reps stay at their training firm for a further 12–24 months. The salary is lower than freelance income but the case mix, mentoring, and CPD are far richer. Most duty solicitor candidates are recruited from this pool.',
  },
  {
    title: 'Move to freelance attendance work',
    body: 'Once you have a year of accredited attendances and good firm references, freelancing is realistic. You will need professional indemnity insurance, a Standard Crime Contract firm that will instruct you (the LAA fee is paid to them, who then pay you), and an established on-call workflow.',
  },
  {
    title: 'Progress towards Duty Solicitor status',
    body: 'PSRAS is a stepping stone. To become a Duty Solicitor you must qualify as a solicitor (SQE / former LPC route) and pass the Police Station Qualification (PSQ) — the standalone duty qualification, plus the Magistrates&apos; Court Qualification (MCQ) for court duty rotas. Many duty solicitors started as PSRAS-accredited paralegals.',
  },
  {
    title: 'Specialise in high-value work',
    body: 'Specialisms — fraud, RASSO (rape and serious sexual offences), serious organised crime, terrorism, juveniles, vulnerable suspects — command higher Legal Aid fees, generate more interesting work, and improve duty solicitor applications later.',
  },
];

const FAQS = [
  {
    q: 'How long does it take to become an accredited police station representative?',
    a: 'A realistic end-to-end timeline is 12–18 months from enrolment with an assessment organisation to your CIT pass. The hidden stage that adds months — sometimes years — for many candidates is finding an SCC firm willing to supervise you in the first place.',
  },
  {
    q: 'How much does PSRAS accreditation cost?',
    a: 'Plan for £2,000–£3,500 across enrolment, training, portfolio assessment, and the CIT. Some firms reimburse all or part of these costs as part of an employment package. Resits, travel, and additional materials can push the total higher.',
  },
  {
    q: 'Do I need a law degree to qualify?',
    a: 'No. PSRAS is competence-based. You do not need an LLB, GDL, LPC, or SQE pass to enrol. Most accredited reps do have legal training of some kind — a law degree, CILEX, paralegal qualifications, or significant in-firm experience — but it is not a regulatory requirement.',
  },
  {
    q: 'Can I do PSRAS while keeping my current job?',
    a: 'Only if your current job is at an SCC firm or you have negotiated an arrangement that allows real-time supervised attendances. PSRAS is not a distance-learning qualification — you must complete supervised portfolio attendances during police custody hours.',
  },
  {
    q: 'What is the difference between PSRAS and the Police Station Qualification (PSQ)?',
    a: 'PSRAS is the accreditation for non-solicitor representatives. PSQ is the equivalent qualification taken by solicitors who want to become Duty Solicitors. Both involve a written stage, portfolio, and a critical incidents-style assessment, but PSQ is open only to qualified solicitors and is a prerequisite for duty solicitor status.',
  },
  {
    q: 'What is the Critical Incidents Test (CIT)?',
    a: 'The CIT is the final practical PSRAS assessment — role-play under exam conditions testing advice at the police station. Datalaw uses audio scenarios with recorded verbal responses; marking is Content, Confidence, and Control (50% minimum each per scenario). Prepare with our <a href="/PrepareForCIT" class="font-semibold underline">CIT guide</a> after a varied portfolio.',
  },
  {
    q: 'Will I get work straight after accreditation?',
    a: 'Yes — if you have stayed in good standing with your training firm and built relationships with neighbouring firms. The first 6–12 months of freelance work are typically built on referrals from your training firm. Use our Get Work guide for the marketing playbook.',
  },
  {
    q: 'Can a probationary representative freelance?',
    a: 'No. The LAA Arrangements 2025 (and earlier versions) restrict probationary reps to work supervised by their named Supervising Solicitor at their carrying firm. Freelance work — including agency work across multiple firms — is only permitted once you are fully accredited.',
  },
];

const SOURCES = [
  { label: 'LAA — Police Station Register Arrangements 2025', href: 'https://www.gov.uk/guidance/police-station-representatives-and-duty-solicitors' },
  { label: 'Cardiff University — Police Station Representatives Accreditation Scheme', href: 'https://www.cardiff.ac.uk/study/professional/courses/professional-skills-and-qualifications-for-non-lawyers/police-station-representatives-accreditation-scheme' },
  { label: 'Datalaw — Police Station Accreditation', href: 'https://www.datalaw.co.uk/' },
  { label: 'Standard Crime Contract 2025', href: 'https://www.gov.uk/government/publications/standard-crime-contract-2025' },
  { label: 'Criminal Legal Aid (Remuneration) (Amendment) Regulations 2025 (SI 2025/1251, from 22 Dec 2025)', href: 'https://www.legislation.gov.uk/uksi/2025/1251/made' },
  { label: 'Standard Crime Contract 2022 (historical)', href: 'https://www.gov.uk/government/publications/standard-crime-contract-2022' },
  { label: 'PACE Codes of Practice', href: 'https://www.gov.uk/guidance/police-and-criminal-evidence-act-1984-pace-codes-of-practice' },
  { label: 'The Law Society — Police Station Skills practice notes', href: 'https://www.lawsociety.org.uk/topics/criminal-law' },
  { label: 'SRA — Good practice guide for police station representatives', href: 'https://www.sra.org.uk/' },
];

const RELATED = [
  { href: '/PrepareForWrittenExam', label: 'PSRAS written exam guide', desc: 'Format, exemptions, syllabus, and study plan' },
  { href: '/FindSupervisingSolicitor', label: 'How to find a supervising solicitor', desc: 'In-depth playbook for the single hardest stage' },
  { href: '/BuildPortfolioGuide', label: 'PSRAS portfolio guide', desc: 'Nine case studies — Part A and Part B requirements' },
  { href: '/PrepareForCIT', label: 'PSRAS CIT guide', desc: 'Audio role-play format, marking, and prep plan' },
  { href: '/DSCCRegistrationGuide', label: 'DSCC Registration Guide', desc: 'ADMIN 2 / ADMIN 3 and how the duty call flow really works' },
  { href: '/GetWork', label: 'Getting work after accreditation', desc: 'Six-phase action plan for your first freelance year' },
  { href: '/Wiki', label: 'Rep Wiki', desc: 'Operational guides for live cases (no comment, identification, juveniles)' },
];

function SectionHeading({ id, children }: { id: string; children: React.ReactNode }) {
  return (
    <h2 id={id} className="text-h2 scroll-mt-24 text-[var(--navy)]">
      {children}
    </h2>
  );
}

export default function HowToBecomePage() {
  return (
    <>
      <JsonLd
        data={faqPageSchema(
          FAQS.map((faq) => ({ q: faqToPlainText(faq.q), a: faqToPlainText(faq.a) })),
        )}
      />
      <section className="bg-[var(--navy)] py-12 sm:py-16">
        <div className="page-container !py-0">
          <Breadcrumbs
            light
            items={[
              { label: 'Home', href: '/' },
              { label: 'Resources', href: '/Resources' },
              { label: 'How to Become a Police Station Rep', href: '/HowToBecomePoliceStationRep' },
            ]}
          />
          <h1 className="mt-4 text-h1 text-white">
            How to Become a Police Station Representative
          </h1>
          <p className="mt-4 max-w-3xl text-lg leading-relaxed text-white">
            The complete 2026 roadmap to PSRAS accreditation — from securing an SCC firm and passing
            the written test, through the supervised portfolio and Critical Incidents Test, to
            joining the Police Station Register and starting work.
          </p>
          <p className="mt-2 text-xs text-slate-300">
            Last updated: 20 May 2026 · Author: Robert Cashman, Duty Solicitor &amp; Higher Court Advocate
          </p>
        </div>
      </section>

      <div className="page-container">
        <div className="mx-auto max-w-4xl">
          <ContentReliabilityNotice className="mb-8" />
          <CustodyNotePagePromo variant="compact" className="mb-10" />

          {/* Read this first */}
          <div className="mb-10 rounded-[var(--radius-lg)] border border-amber-300 bg-amber-50 p-6">
            <h2 className="text-base font-bold text-amber-900">Read this first</h2>
            <p className="mt-2 text-sm leading-relaxed text-amber-900">
              This page is <strong>general career information only</strong> — not legal advice and
              not a substitute for the LAA Police Station Register Arrangements 2025 or the
              published Cardiff / Datalaw handbooks. Regulatory and contract terms change every
              year; always check the latest GOV.UK guidance before paying any fee.
            </p>
            <p className="mt-2 text-sm leading-relaxed text-amber-900">
              The single biggest reason candidates fail to qualify is not the exam — it is failing
              to secure an SCC firm willing to supervise them. We cover that stage in detail in our{' '}
              <Link href="/FindSupervisingSolicitor" className="font-semibold underline decoration-amber-700 underline-offset-2">
                Find a Supervising Solicitor
              </Link>{' '}
              guide.
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

          {/* Overview */}
          <section className="mb-12">
            <SectionHeading id="overview">What a police station rep does</SectionHeading>
            <p className="mt-3 text-sm leading-relaxed text-[var(--muted)]">
              A police station representative is a non-solicitor legal adviser, accredited under the
              Police Station Representatives Accreditation Scheme (PSRAS), who attends police
              custody suites to advise suspects detained under PACE 1984. The role mirrors that of a
              duty solicitor in custody: take disclosure from the officer in the case, hold a
              privileged consultation with the suspect, advise on the law and on interview
              strategy, sit with the suspect during a recorded interview, and then deal with the
              representations on bail or charge.
            </p>
            <p className="mt-3 text-sm leading-relaxed text-[var(--muted)]">
              You operate inside a firm holding a Legal Aid Agency Standard Crime Contract. Work is
              allocated through three routes: <strong>duty calls</strong> from the Defence Solicitor
              Call Centre (DSCC), <strong>own-client</strong> calls (where the suspect names your
              firm), and <strong>back-up cover</strong> for partner firms. The Legal Aid Agency
              pays a fixed fee per attendance to the firm, which then pays you — either as a
              salaried employee or, once you are fully accredited, as a self-employed contractor.
            </p>
          </section>

          {/* Legal framework */}
          <section className="mb-12">
            <SectionHeading id="legal-framework">The legal framework</SectionHeading>
            <p className="mt-3 text-sm leading-relaxed text-[var(--muted)]">
              Three sets of rules sit behind every police station attendance:
            </p>
            <ul className="mt-4 list-disc space-y-2 pl-6 text-sm leading-relaxed text-[var(--muted)]">
              <li>
                <strong>The Police and Criminal Evidence Act 1984 (PACE)</strong> and its Codes of
                Practice — particularly Code C (detention, treatment, and questioning), Code D
                (identification), and Code G (powers of arrest).
              </li>
              <li>
                <strong>The Criminal Justice and Public Order Act 1994 (CJPOA), sections 34–38</strong>{' '}
                — adverse inference from silence and refusal to account.
              </li>
              <li>
                <strong>The Standard Crime Contract 2025</strong> and the{' '}
                <strong>Police Station Register Arrangements 2025</strong> issued by the Legal Aid
                Agency under LASPO 2012 — these set out who can be on the Register, the supervision
                requirements, and the accreditation pathway.
              </li>
            </ul>
            <p className="mt-3 text-sm leading-relaxed text-[var(--muted)]">
              PSRAS sits inside that framework. It is the LAA-approved accreditation that proves
              you are competent to advise a suspect alone — without it, you cannot be paid by the
              LAA for a police station attendance and you cannot lawfully sign Legal Aid forms
              (CRM1, CRM2, CRM3) as the attending adviser.
            </p>
          </section>

          {/* Reality check */}
          <section className="mb-12">
            <SectionHeading id="reality">Reality check — is this for you?</SectionHeading>
            <p className="mt-3 text-sm leading-relaxed text-[var(--muted)]">
              Before committing time and money, work through the four points below honestly. If two
              or more are deal-breakers for your circumstances, the role is not the right fit.
            </p>
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              {REALITY_POINTS.map((item) => (
                <div
                  key={item.title}
                  className="rounded-[var(--radius)] border border-[var(--card-border)] bg-[var(--card-bg)] p-5 shadow-[var(--card-shadow)]"
                >
                  <h3 className="text-base font-bold text-[var(--navy)]">{item.title}</h3>
                  <p
                    className="mt-2 text-sm leading-relaxed text-[var(--muted)]"
                    dangerouslySetInnerHTML={{ __html: item.body }}
                  />
                </div>
              ))}
            </div>
          </section>

          {/* Eligibility */}
          <section className="mb-12">
            <SectionHeading id="eligibility">Eligibility and prerequisites</SectionHeading>
            <div className="mt-6 space-y-4">
              {ELIGIBILITY_RULES.map((rule) => (
                <div
                  key={rule.title}
                  className="rounded-[var(--radius)] border-l-4 border-[var(--gold)] bg-slate-50 p-5"
                >
                  <h3 className="text-base font-bold text-[var(--navy)]">{rule.title}</h3>
                  <p
                    className="mt-2 text-sm leading-relaxed text-[var(--muted)]"
                    dangerouslySetInnerHTML={{ __html: rule.body }}
                  />
                </div>
              ))}
            </div>
          </section>

          {/* Route map */}
          <section className="mb-12">
            <SectionHeading id="route-map">The route map at a glance</SectionHeading>
            <p className="mt-3 text-sm leading-relaxed text-[var(--muted)]">
              PSRAS has five sequential stages. The order matters — assessment organisations will
              not let you book the CIT without a signed-off portfolio, and the DSCC will not add
              you to the Register without a supervisor.
            </p>
            <ol className="mt-6 space-y-3">
              {[
                { n: 1, h: 'Enrol with an assessment organisation', l: 'Cardiff or Datalaw' },
                { n: 2, h: 'Pass the Written Test', l: 'PACE, CJPOA s34–38, ethics, identification' },
                { n: 3, h: 'Build the supervised portfolio', l: 'Part A observed + Part B as primary adviser' },
                { n: 4, h: 'Pass the Critical Incidents Test (CIT)', l: 'Simulated consultation + interview, marked live' },
                { n: 5, h: 'Get added to the Police Station Register', l: 'Permanent PSRAS PIN issued by DSCC' },
              ].map((s) => (
                <li
                  key={s.n}
                  className="flex items-start gap-4 rounded-[var(--radius)] border border-[var(--card-border)] bg-[var(--card-bg)] p-4"
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 border-[var(--gold)] text-sm font-bold text-[var(--gold)]">
                    {s.n}
                  </span>
                  <div>
                    <p className="font-bold text-[var(--navy)]">{s.h}</p>
                    <p className="mt-1 text-sm text-[var(--muted)]">{s.l}</p>
                  </div>
                </li>
              ))}
            </ol>
          </section>

          <PsrTrainPromo variant="card" campaign="how_to_become_inline" className="mb-12" />

          {/* Stage 1 */}
          <section className="mb-12">
            <SectionHeading id="stage-1">Stage 1 — Enrol with an assessment organisation</SectionHeading>
            <p className="mt-3 text-sm leading-relaxed text-[var(--muted)]">
              There are two LAA-approved assessment organisations: Cardiff University Law School
              and Datalaw. Both deliver the same regulated qualification but with different formats.
            </p>
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <div className="rounded-[var(--radius)] border border-[var(--card-border)] bg-[var(--card-bg)] p-5 shadow-[var(--card-shadow)]">
                <h3 className="text-base font-bold text-[var(--navy)]">Cardiff University</h3>
                <p className="mt-2 text-sm leading-relaxed text-[var(--muted)]">
                  Long-established, classroom-led, with structured cohorts. Strong portfolio
                  feedback process. Recognised by older SCC firms as the &quot;gold standard&quot; route.
                  Course intakes are scheduled — you need to plan your enrolment around them.
                </p>
              </div>
              <div className="rounded-[var(--radius)] border border-[var(--card-border)] bg-[var(--card-bg)] p-5 shadow-[var(--card-shadow)]">
                <h3 className="text-base font-bold text-[var(--navy)]">Datalaw</h3>
                <p className="mt-2 text-sm leading-relaxed text-[var(--muted)]">
                  Online and blended delivery, with rolling enrolment. More flexible for candidates
                  in full-time work or remote from a major city. Identical regulatory standing — a
                  Datalaw PSRAS is a Cardiff PSRAS as far as the LAA and SRA are concerned.
                </p>
              </div>
            </div>
            <ol className="mt-6 list-decimal space-y-2 pl-6 text-sm leading-relaxed text-[var(--muted)]">
              {STAGE_1_STEPS.map((s) => <li key={s}>{s}</li>)}
            </ol>
          </section>

          {/* Stage 2 */}
          <section className="mb-12">
            <SectionHeading id="stage-2">Stage 2 — Pass the Written Test</SectionHeading>
            <p className="mt-3 text-sm leading-relaxed text-[var(--muted)]">
              The written stage proves you have the knowledge base to advise a suspect competently.
              It is not optional and it is not a formality — the failure rate at this stage is
              materially higher than at the CIT, because candidates underestimate it.
            </p>
            <ol className="mt-4 list-decimal space-y-2 pl-6 text-sm leading-relaxed text-[var(--muted)]">
              {STAGE_2_STEPS.map((s) => <li key={s}>{s}</li>)}
            </ol>
            <div className="mt-6 rounded-[var(--radius)] border-l-4 border-[var(--gold)] bg-slate-50 p-5 text-sm leading-relaxed text-[var(--muted)]">
              <strong className="text-[var(--navy)]">High-yield topics:</strong> Code C
              safeguards for vulnerable suspects, Code D identification procedures, when adverse
              inference does and does not bite, the difference between &quot;reasonable suspicion&quot; and
              &quot;reasonable belief&quot;, the law on prepared statements, and the ethical limits on
              advising a client who admits guilt in consultation.
            </div>
          </section>

          {/* Stage 3 */}
          <section className="mb-12">
            <SectionHeading id="stage-3">Stage 3 — Portfolio (Part A and Part B)</SectionHeading>
            <p className="mt-3 text-sm leading-relaxed text-[var(--muted)]">
              The portfolio is the heart of PSRAS — nine case studies in total (Part A: four observed
              cases; Part B: five unsupervised). See our{' '}
              <Link href="/BuildPortfolioGuide" className="font-semibold text-[var(--navy)] underline">
                PSRAS Portfolio Guide
              </Link>{' '}
              for the full requirements.
            </p>
            <ol className="mt-4 list-decimal space-y-2 pl-6 text-sm leading-relaxed text-[var(--muted)]">
              {STAGE_3_STEPS.map((s) => (
                <li key={s} dangerouslySetInnerHTML={{ __html: s }} />
              ))}
            </ol>
            <div className="mt-6 rounded-[var(--radius)] border-l-4 border-emerald-500 bg-emerald-50/60 p-5 text-sm leading-relaxed text-[var(--muted)]">
              <strong className="text-[var(--navy)]">Tip from real assessments:</strong> the
              strongest portfolios are not the longest. Assessors look for a reflective voice — a
              candidate who can articulate why they advised silence in one case and a full account
              in another, and what they would do differently next time. Generic &quot;I advised no
              comment because PACE says so&quot; entries fail.
            </div>
          </section>

          {/* Stage 4 */}
          <section className="mb-12">
            <SectionHeading id="stage-4">Stage 4 — Pass the Critical Incidents Test (CIT)</SectionHeading>
            <p className="mt-3 text-sm leading-relaxed text-[var(--muted)]">
              The CIT is the final practical assessment — role-play under exam conditions. Datalaw uses
              audio scenarios; you respond aloud and are marked on Content, Confidence, and Control.
              Full preparation guide:{' '}
              <Link href="/PrepareForCIT" className="font-semibold text-[var(--navy)] underline">
                PSRAS CIT Guide
              </Link>
              .
            </p>
            <ol className="mt-4 list-decimal space-y-2 pl-6 text-sm leading-relaxed text-[var(--muted)]">
              {STAGE_4_STEPS.map((s) => <li key={s}>{s}</li>)}
            </ol>
            <div className="mt-6 rounded-[var(--radius)] border-l-4 border-red-400 bg-red-50/60 p-5 text-sm leading-relaxed text-[var(--muted)]">
              <strong className="text-[var(--navy)]">Why candidates fail the CIT:</strong> rushing
              the consultation; failing to give a clear adverse inference explanation; missing a
              vulnerability flag (mental health, learning disability, intoxication); intervening
              too aggressively (or not at all) during interview; and ethical failures — for example
              continuing to act after the client admits guilt in consultation but insists on lying
              in interview.
            </div>
          </section>

          {/* Stage 5 */}
          <section className="mb-12">
            <SectionHeading id="stage-5">Stage 5 — Get added to the Police Station Register</SectionHeading>
            <ol className="mt-4 list-decimal space-y-2 pl-6 text-sm leading-relaxed text-[var(--muted)]">
              {STAGE_5_STEPS.map((s) => (
                <li key={s} dangerouslySetInnerHTML={{ __html: s }} />
              ))}
            </ol>
            <p className="mt-4 text-sm leading-relaxed text-[var(--muted)]">
              For the operational detail of the DSCC, ADMIN 2, ADMIN 3, and the duty call flow,
              see our{' '}
              <Link
                href="/DSCCRegistrationGuide"
                className="font-semibold text-[var(--navy)] underline decoration-[var(--gold)]/40 underline-offset-2 hover:decoration-[var(--gold)]"
              >
                DSCC Registration Guide
              </Link>
              .
            </p>
          </section>

          {/* Supervision */}
          <section className="mb-12">
            <SectionHeading id="supervision">The supervision problem</SectionHeading>
            <p className="mt-3 text-sm leading-relaxed text-[var(--muted)]">
              Almost every PSRAS query we receive boils down to: <em>how do I find a supervising
              solicitor?</em> Supervision is a regulated function, not a favour, and is the
              single biggest barrier between a motivated applicant and accreditation.
            </p>
            <ul className="mt-4 list-disc space-y-2 pl-6 text-sm leading-relaxed text-[var(--muted)]">
              {SUPERVISION_KEY_POINTS.map((p) => (
                <li key={p} dangerouslySetInnerHTML={{ __html: p }} />
              ))}
            </ul>
            <div className="mt-6 rounded-[var(--radius-lg)] border border-[var(--gold)]/30 bg-amber-50/80 p-5 sm:p-6">
              <p className="text-sm font-semibold text-[var(--navy)]">
                Read the full supervision playbook
              </p>
              <p className="mt-2 text-sm leading-relaxed text-[var(--muted)]">
                We have a dedicated, 50-section guide on why supervision is hard to secure, the
                legal tests, application strategy, an email template, interview prep, and the
                ADMIN 2 / ADMIN 3 process.
              </p>
              <Link
                href="/FindSupervisingSolicitor"
                className="mt-3 inline-flex text-sm font-semibold text-[var(--navy)] underline decoration-[var(--gold)] underline-offset-2 hover:text-[var(--gold-link)]"
              >
                How to find a supervising solicitor →
              </Link>
            </div>
          </section>

          {/* Costs and timeline */}
          <section className="mb-12">
            <SectionHeading id="costs">Costs and timeline</SectionHeading>
            <h3 className="mt-6 text-lg font-bold text-[var(--navy)]">Costs (one-time)</h3>
            <div className="mt-4 overflow-hidden rounded-[var(--radius)] border border-[var(--card-border)]">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-left">
                  <tr>
                    <th className="px-4 py-3 font-semibold text-[var(--navy)]">Cost</th>
                    <th className="px-4 py-3 font-semibold text-[var(--navy)]">Typical range</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--card-border)] text-[var(--muted)]">
                  {COST_TABLE.map((row) => (
                    <tr key={row.label} className={row.label.startsWith('Total') ? 'bg-amber-50/60 font-semibold text-[var(--navy)]' : ''}>
                      <td className="px-4 py-3">{row.label}</td>
                      <td className="px-4 py-3">{row.range}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <h3 className="mt-8 text-lg font-bold text-[var(--navy)]">Timeline</h3>
            <div className="mt-4 space-y-3">
              {TIMELINE.map((t) => (
                <div
                  key={t.phase}
                  className="grid gap-2 rounded-[var(--radius)] border border-[var(--card-border)] bg-[var(--card-bg)] p-4 sm:grid-cols-[1fr_auto_2fr] sm:items-center"
                >
                  <p className="font-semibold text-[var(--navy)]">{t.phase}</p>
                  <p className="text-xs font-medium uppercase tracking-wide text-[var(--navy)]">
                    {t.length}
                  </p>
                  <p
                    className="text-sm text-[var(--muted)]"
                    dangerouslySetInnerHTML={{ __html: t.detail }}
                  />
                </div>
              ))}
            </div>
          </section>

          {/* After accreditation */}
          <section className="mb-12">
            <SectionHeading id="after">Life after accreditation</SectionHeading>
            <p className="mt-3 text-sm leading-relaxed text-[var(--muted)]">
              PSRAS is the start of a career, not the destination. There are four well-trodden
              paths once you are on the Register.
            </p>
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              {AFTER_ACCREDITATION.map((item) => (
                <div
                  key={item.title}
                  className="rounded-[var(--radius)] border border-[var(--card-border)] bg-[var(--card-bg)] p-5 shadow-[var(--card-shadow)]"
                >
                  <h3 className="text-base font-bold text-[var(--navy)]">{item.title}</h3>
                  <p
                    className="mt-2 text-sm leading-relaxed text-[var(--muted)]"
                    dangerouslySetInnerHTML={{ __html: item.body }}
                  />
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
                  <p className="mt-3 text-sm leading-relaxed text-[var(--muted)]">{faq.a}</p>
                </details>
              ))}
            </div>
          </section>

          <GuideEmailCapture
            className="mb-12"
            title="Get the 'how to become a rep' roadmap by email"
            description="The full route — accreditation steps, costs, timelines, and finding a supervising firm — in one summary. No spam."
            source="become-a-rep"
            leadMagnet="How to become a police station rep — roadmap"
            buttonLabel="Email me the roadmap"
          />

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
            context={{ kind: 'page', path: '/HowToBecomePoliceStationRep' }}
            extra={SOURCES}
          />

          <PsrTrainPromo variant="hero" campaign="how_to_become_footer" className="mb-10" />

          <section className="rounded-[var(--radius-lg)] bg-[var(--navy)] p-8 text-center">
            <h2 className="text-xl font-bold text-white">Already accredited?</h2>
            <p className="mt-3 text-sm text-slate-300">
              Join the free directory and connect with criminal defence firms across England &amp; Wales,
              or read our guide to getting freelance work after accreditation.
            </p>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
              <Link href="/register" className="btn-gold no-underline">Register as a Rep (Free)</Link>
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
