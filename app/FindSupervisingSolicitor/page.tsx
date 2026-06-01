import Link from 'next/link';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { ContentReliabilityNotice } from '@/components/ContentReliabilityNotice';
import { ResolvedContentSources } from '@/components/ContentSourcesFooter';
import { PsrTrainPromo } from '@/components/PsrTrainPromo';
import { buildMetadata } from '@/lib/seo';

export const metadata = buildMetadata({
  title: 'How to Find a Supervising Solicitor — PSRAS Career Guide',
  description:
    'In-depth guide for aspiring police station representatives: who qualifies as a supervising solicitor under the LAA 2025 Arrangements, how to identify and approach Standard Crime Contract firms, what to put in an application that actually works, and the regulatory traps to avoid.',
  path: '/FindSupervisingSolicitor',
});

const ON_THIS_PAGE: { id: string; label: string }[] = [
  { id: 'definition', label: 'What a supervising solicitor actually is' },
  { id: 'why-elusive', label: 'Why supervision feels elusive' },
  { id: 'who-can-supervise', label: 'Who can supervise — the legal test' },
  { id: 'employment', label: 'The realistic route — employment at an SCC firm' },
  { id: 'identify-firms', label: 'How to identify firms that can supervise you' },
  { id: 'application-strategy', label: 'A serious application strategy' },
  { id: 'email-template', label: 'What a strong application looks like' },
  { id: 'interview', label: 'The interview — what firms are scoring' },
  { id: 'admin-process', label: 'After “yes” — the ADMIN 2 / ADMIN 3 process' },
  { id: 'supervisor-leaves', label: 'If your supervisor leaves or the firm closes' },
  { id: 'red-flags', label: 'Red flags and arrangements to refuse' },
  { id: 'alternative-routes', label: 'Alternative entry routes (SQE, CILEX, in-house)' },
  { id: 'geography', label: 'Geography and duty-rota density' },
  { id: 'rejection', label: 'Handling rejection and persistence' },
  { id: 'faq', label: 'Frequently asked questions' },
  { id: 'sources', label: 'Official sources' },
];

const WHY_ELUSIVE = [
  {
    title: 'Supervision is a regulated obligation, not a favour',
    body: 'A supervising solicitor must meet the LAA Crime Contract Supervisor standards, sign you onto the DSCC register via ADMIN 2, complete an ADMIN 3 every year, and remain professionally and contractually accountable for your work. The SRA Code of Conduct for Firms requires them to make sure you stay competent. This is months of administration and reputational risk — not a one-off favour.',
  },
  {
    title: 'The LAA contracts with firms, not individuals',
    body: 'Under the Legal Aid, Sentencing and Punishment of Offenders Act 2012, the Legal Aid Agency contracts with firms holding a Standard Crime Contract — not with you. Without a firm prepared to put you onto its contract, your portfolio attendances cannot be billed and your supervisor cannot certify your portfolio. This is why “please supervise me” without an offer of employment almost never lands.',
  },
  {
    title: 'Probationary representatives cannot freelance',
    body: 'Until you pass the Critical Incidents Test (CIT) and become an Accredited Representative on the Police Station Register, you must work as a probationary representative under direct supervision at the firm whose Standard Crime Contract carries you. You cannot do freelance attendances during your probationary year.',
  },
  {
    title: 'Real-time risk',
    body: 'Police station work happens at 02:00. If you give bad advice, the supervising solicitor — and the firm — owns the regulatory and reputational consequences. Their professional indemnity insurer underwrites your competence. Firms only take on that exposure for trainees they have hired, can observe, and can replace if needed.',
  },
];

const SUPERVISOR_TESTS = [
  {
    title: 'They must be a Duty Solicitor or meet the Crime Contract Supervisor standards',
    body: 'Para 1 of the Police Station Register Arrangements 2025 defines a Supervising Solicitor as a Duty Solicitor, or — failing that — a solicitor acceptable to the LAA as meeting the Criminal Investigations and Criminal Proceedings supervisor standard under the 2025 Standard Crime Contract. Prison Law or Appeals & Reviews supervisor status alone is not enough.',
  },
  {
    title: 'They must not be suspended from Supervising Solicitor status',
    body: 'A solicitor who has been suspended from supervising under the Standard Crime Contract cannot be your supervisor, even informally. Always confirm current status with the firm — and the DSCC if in doubt.',
  },
  {
    title: 'They (or their firm) must hold an SCC police station schedule',
    body: 'The firm itself must hold a current Standard Crime Contract with a police station schedule. A corporate, family, immigration, or civil firm — however senior — cannot supervise PSRAS portfolio work. The contract is with the firm, not the named partner.',
  },
  {
    title: 'They must remain the same supervisor throughout',
    body: 'Para 4 of the 2025 Arrangements expects the same solicitor to supervise you through accreditation. Changes are permitted only with DSCC approval where there are exceptional circumstances (illness, retirement). Picking a supervisor who is about to retire is a poor strategic choice.',
  },
];

const SCC_INDICATORS = [
  'They appear on the GOV.UK Find a Legal Aid Adviser tool for Crime work in your area.',
  'Their website mentions “24/7 police station cover”, “duty solicitor scheme”, “Standard Crime Contract”, or names duty solicitors.',
  'Their staff page lists multiple PSRAS-accredited representatives or duty solicitors.',
  'They publish case studies involving police station, magistrates’ court, or Crown Court work.',
  'They are listed as a member firm of the Criminal Law Solicitors’ Association (CLSA) or London Criminal Courts Solicitors’ Association (LCCSA).',
];

const APPLICATION_BUILDING_BLOCKS = [
  {
    title: 'A 45-minute travel commitment',
    body: 'PACE Code C presumes representation arrives promptly. State explicitly that you live within 45 minutes of the firm’s primary custody suites, hold a full UK driving licence, and have access to a car insured for business use.',
  },
  {
    title: 'Out-of-hours willingness — with evidence',
    body: 'Saying “I am willing to work nights” is meaningless on its own. Show evidence: a previous shift role, on-call rotation, hospitality late shifts, care work, or anything that proves you can function at 03:00 without melting down.',
  },
  {
    title: 'Existing skills the firm needs from day one',
    body: 'Lead with what you can do today: bundle preparation, CRM data entry, billing assistance, file management, client telephone handling, written attendance note drafting. Supervision is what you want; admin value is what gets you hired.',
  },
  {
    title: 'PSRAS progress (or a clear, funded plan)',
    body: 'State which assessment organisation you have applied to (Cardiff or Datalaw), whether you are exempt from the written exam (LPC / BTC / SQE Parts 1 & 2 / current practising certificate), and how Part A of the portfolio will be funded — by you or by the firm.',
  },
  {
    title: 'Resilience and judgement, not entitlement',
    body: 'Reference people-facing work where you de-escalated conflict — retail, hospitality, healthcare, social care, mental-health support. Firms are buying judgement under stress, not a CV of academic credentials.',
  },
  {
    title: 'A named recipient',
    body: 'Find the head of crime, police station manager, or training principal by name (firm website, Law Society directory, LinkedIn). “Dear Sir/Madam” signals you have not done the basic work.',
  },
];

const APPLICATION_PHASES = [
  {
    number: 1,
    title: 'Build a targeted firm list',
    timeframe: 'Days 1–7',
    steps: [
      'Map every custody suite within 45 minutes of your home using /StationsDirectory.',
      'Use GOV.UK Find a Legal Aid Adviser → Crime to list all Standard Crime Contract holders covering those custody suites.',
      'Cross-check the Law Society’s Find a Solicitor tool — filter for Criminal Defence and 25-mile radius.',
      'Visit each firm’s website. Confirm they actively cover police stations (24/7 cover language, named duty solicitors, PSRAS reps).',
      'Identify the head of crime / police station manager / training principal by name.',
      'Maintain a spreadsheet: firm, named contact, email, phone, distance, date contacted, response.',
    ],
  },
  {
    number: 2,
    title: 'Write applications that are useful to read',
    timeframe: 'Days 7–14',
    steps: [
      'One firm per application — never BCC.',
      'Subject line: “Application — Paralegal / Trainee Police Station Rep — [Your name], [your nearest custody suite]”.',
      'Open with what you can do for them this month, not what you want from them this year.',
      'Cover: PSRAS status, exemption from written exam (if any), driving licence, out-of-hours availability, postal address.',
      'Attach a one-page CV and a one-page reference list. No certificates unless asked.',
      'Close with a precise next step — “I will follow up by phone on [date].”',
    ],
  },
  {
    number: 3,
    title: 'Follow up — politely, by phone',
    timeframe: 'Days 10–21',
    steps: [
      'Call 3–5 working days after the email — switchboard, ask for the named contact.',
      'If they are unavailable, ask for the best time to call back; do not leave a voicemail unless asked.',
      'Keep the call under 90 seconds: confirm receipt, ask whether they are recruiting, ask whether you can attend the office for an informal chat.',
      'If they say no, ask whether they know of any nearby firm that is currently hiring — head of crime networks are tight.',
    ],
  },
  {
    number: 4,
    title: 'Show up, in person',
    timeframe: 'Ongoing',
    steps: [
      'Attend local CLSA / LCCSA / Law Society crime section events.',
      'Sit in the public gallery at your local magistrates’ court — listen, take notes, introduce yourself afterwards.',
      'Volunteer with a justice charity (Justice & Care, Switchback, Centrepoint legal clinics) to build genuine criminal-justice exposure.',
      'Once you have a name in mind, ask for a 15-minute informational coffee — never lead with “will you supervise me?”',
    ],
  },
  {
    number: 5,
    title: 'Convert offers, decline traps',
    timeframe: 'Once offers arrive',
    steps: [
      'Verify the firm holds a current Standard Crime Contract by re-checking the GOV.UK adviser tool.',
      'Confirm in writing who the named supervising solicitor will be and that they meet Crime Contract Supervisor standards.',
      'Get a written job description, salary, and statement that ADMIN 2 will be filed by the supervisor when you start probationary work.',
      'Reject any arrangement where you are asked to pay the firm or the named supervisor for supervision — see the red flags section.',
    ],
  },
];

const EMAIL_TEMPLATE = `Subject: Application — Paralegal / Trainee Police Station Rep — Jane Doe, Maidstone

Dear Ms Patel,

I am writing to apply for a paralegal or trainee police station representative role with [Firm name]. I live in Maidstone (ME15), hold a full UK driving licence, and can reach Maidstone, Medway, North Kent, and Folkestone custody suites within 45 minutes.

What I can offer your practice from day one:

- Four years' experience handling case files at [Civil firm]: bundle preparation, CRM data entry, billing assistance, client telephone handling.
- Three years as a registered mental health support worker before that — confident managing distressed clients and de-escalating conflict.
- A demonstrable record of out-of-hours work — I currently cover one weekend in three on the [Charity] crisis line.

PSRAS progress: I have registered with Datalaw and am exempt from the written examination (LPC, College of Law, 2018). Part A of the portfolio is self-funded; I am ready to begin observed attendances as soon as I am with a supervising solicitor.

CV attached. I will follow up by phone next Tuesday.

Thank you for your time,

Jane Doe
07700 900123
jane.doe@example.com`;

const INTERVIEW_CRITERIA = [
  {
    title: 'Will you turn up at 03:00 on a Sunday?',
    body: 'Firms will probe this directly. Have a concrete answer: childcare arrangements, partner support, distance to the station, a working car, a charger by the bed.',
  },
  {
    title: 'Will you embarrass us in interview?',
    body: 'They are not testing your law on day one. They are testing whether you can stay calm when a custody sergeant is shouting and an investigating officer is impatient. Bring an example.',
  },
  {
    title: 'Can you write a defensible attendance note?',
    body: 'Most firms will ask you to draft a short note from a scenario. Practise on the Wiki guides — see /Wiki — and the SRA Good Practice Guide. Concise, chronological, and factual beats long and editorial every time.',
  },
  {
    title: 'Will you stay long enough to be worth training?',
    body: 'Firms estimate it takes 12–24 months to recoup the cost of training and supervising a new rep. Be honest about your geography, family, and career horizon. Saying “I want to be on your duty rota in three years” lands better than “I just need accreditation.”',
  },
];

const ADMIN_STEPS = [
  {
    title: 'The firm submits ADMIN 2',
    body: 'After your assessment organisation certifies Part A of the portfolio and the written exam (or your exemption), the firm’s supervising solicitor submits an ADMIN 2 to the DSCC to register you as a Probationary Representative. You must apply within three months of certification.',
  },
  {
    title: 'You are on the Police Station Register as Probationary',
    body: 'You can now attend police stations under the supervising solicitor. You have 12 months from registration to pass the remaining Relevant Tests (Part B of the portfolio + CIT) and become Accredited. Miss the 12-month deadline without an extension and you can be removed from the Register.',
  },
  {
    title: 'Annual ADMIN 3',
    body: 'Once accredited, every year the DSCC runs a data cleanse. Your supervising solicitor must return an ADMIN 3 confirming your contact details, CPD, and absence of regulatory or criminal proceedings. If your supervisor refuses or cannot confirm, you will be suspended from the Register.',
  },
  {
    title: 'Stay in contact with your supervisor',
    body: 'The 2025 Arrangements explicitly require Police Station Representatives to keep their supervising solicitor informed and reachable. Annual silence followed by a panicked ADMIN 3 request is how reps lose their Register status.',
  },
];

const RED_FLAGS = [
  'You are asked to pay the named supervisor (or “admin fees” to the firm) for supervision. Supervision is a regulated function under the LAA contract and the SRA Code of Conduct for Firms — not a service for sale to trainees.',
  'A non-SCC firm offers to “supervise” you. They cannot. Any portfolio attendances under their watch will not be billable, and may be rejected by your assessment organisation.',
  'You are asked to sign anything before the firm has shown you their current Standard Crime Contract status on the GOV.UK adviser tool.',
  'The named supervisor cannot be found on the Law Society roll, or has no recent criminal practising history.',
  'You are told you can “self-supervise” your own attendances. PSRAS portfolio work requires real-time supervision by a qualifying solicitor — there is no self-supervision route.',
  'A third party offers to “place” you with a supervisor for a fee. The DSCC and LAA do not recognise paid placement agencies as part of PSRAS registration.',
  'The arrangement is undocumented. No employment contract, no consultancy agreement, no written confirmation of supervision — walk away.',
];

const RED_FLAG_NOTE =
  'PoliceStationRepUK strongly recommends that aspiring representatives do not pay any individual or firm for supervision. The legitimate route is paid employment (or a structured training contract) at an SCC-holding firm — where you contribute work and they provide supervision as part of the employer/supervisor relationship.';

const ALTERNATIVE_ROUTES = [
  {
    title: 'In-house criminal teams at large national firms',
    body: 'Large national crime firms (Stephensons, Tuckers, GT Stewart, Hodge Jones & Allen, EBR Attridge and similar) run structured training pathways. They are competitive but offer the most reliable supervised route and pay during training.',
  },
  {
    title: 'CILEX route → criminal litigation',
    body: 'Becoming a CILEX criminal law practitioner is a longer pathway, but provides legal training while you work and earn at a firm. Once a CILEX practitioner, you can still complete PSRAS under your firm’s supervising solicitor.',
  },
  {
    title: 'SQE route → in-house police station rep',
    body: 'If you complete SQE 1 & 2, you are exempt from the PSRAS written exam. You still need a supervising solicitor and portfolio attendances, but you remove one obstacle.',
  },
  {
    title: 'Public Defender Service (England & Wales)',
    body: 'The PDS is a state-employed criminal defence service. It hires and trains police station reps and duty solicitors directly. Vacancies are occasional but worth tracking on the Civil Service Jobs portal.',
  },
  {
    title: 'CILEX or paralegal apprenticeships',
    body: 'Some SCC firms run government-funded paralegal or legal apprenticeship schemes (Level 3 / Level 7). These are paid, structured, and supervised. Search “legal apprenticeship” on the GOV.UK find an apprenticeship service.',
  },
];

const GEOGRAPHY_NOTES = [
  {
    title: 'London',
    body: 'Highest density of SCC firms and duty solicitors, but also the highest competition for trainee places. Strong networks through LCCSA. Travel between custody suites is the principal logistical cost.',
  },
  {
    title: 'Large regional cities (Manchester, Birmingham, Leeds, Liverpool, Bristol)',
    body: 'Mature crime market with multiple SCC firms, often with structured training pathways. CLSA branch networks are useful. Travel times to custody suites are usually manageable.',
  },
  {
    title: 'Counties and market towns',
    body: 'Fewer SCC firms, but you are often more memorable as a candidate. The 45-minute travel commitment is easier to keep. Driving licence and car are non-negotiable.',
  },
  {
    title: 'Rural and coastal areas',
    body: 'SCC supply is thin. Some firms may welcome a committed local trainee precisely because cover is hard to source. Expect a longer geographic radius and more night work.',
  },
];

const REJECTION_RULES = [
  'Track every application in a spreadsheet — date sent, follow-up date, outcome, reason if known.',
  'A rejection is data, not a judgement. Ask politely what tipped the decision — many firms will tell you.',
  'Re-apply to the same firm after six months only if something material has changed (new qualification, new geographic move, new role).',
  'Set a realistic target: 30–60 quality applications over three months, not 500 generic emails in a week.',
  'If you receive five rejections that mention the same gap, fix the gap before sending more applications.',
  'Talk to other trainees in the CLSA / LCCSA / WhatsApp group — many roles are filled by referral, not advert.',
];

const FAQS: { q: string; a: string }[] = [
  {
    q: 'Will PoliceStationRepUK become my supervising solicitor?',
    a: 'No. We are a directory and information platform operated by Defence Legal Services Ltd. We are not a law firm and we do not hold a Standard Crime Contract for trainees we are not employing. We cannot supervise portfolios, certify Part A, or sign ADMIN 2 / ADMIN 3 forms.',
  },
  {
    q: 'Should I pay a solicitor to supervise me privately?',
    a: 'We strongly recommend against any arrangement where you pay a firm or named solicitor for supervision. Supervision is a regulated obligation under the LAA Standard Crime Contract and the SRA Code of Conduct for Firms — not a paid-for service. Legitimate supervision is part of the employer/employee or training relationship at an SCC firm.',
  },
  {
    q: 'Where can I legitimately find a supervising solicitor?',
    a: 'Through paid employment (paralegal, legal assistant, trainee rep, apprentice) at a firm that holds a Standard Crime Contract with a police station schedule, where the firm’s designated supervisor under the SCC will supervise your PSRAS work.',
  },
  {
    q: 'Why is it so difficult to secure?',
    a: 'Because supervision creates ongoing regulatory, contractual, and insurance exposure for the firm. Para 4 of the 2025 Arrangements expects continuity of supervisor across the whole accreditation; firms only commit to that when you are also delivering work to the practice.',
  },
  {
    q: 'I already passed the SRA written exam — can I finish PSRAS without a firm?',
    a: 'No. Portfolio attendances (Part A and Part B) and the Critical Incidents Test all require a qualifying supervising solicitor and real police station attendances under the firm’s Standard Crime Contract.',
  },
  {
    q: 'What about working unpaid “for the experience”?',
    a: 'An unpaid arrangement at an SCC firm where the firm files ADMIN 2 and provides genuine supervision can be a legitimate path, but it is not the same as paying the firm for supervision. Check the National Minimum Wage rules with the firm before accepting an unpaid arrangement — most legitimate paralegal roles are paid.',
  },
  {
    q: 'My supervisor is retiring next year. What do I do?',
    a: 'Notify the DSCC immediately and arrange a replacement supervisor at the same firm (or a new firm). Para 5 of the 2025 Arrangements requires Police Station Representatives to always have a designated supervisor — a gap risks suspension from the Register.',
  },
  {
    q: 'Can I work for two firms simultaneously?',
    a: 'Probationary representatives are tied to the SCC of the supervising solicitor. Once Accredited, freelance reps can work for multiple firms, but each instructing firm must claim under its own SCC. Your designated supervisor on the Register is still a single named solicitor.',
  },
  {
    q: 'I have a criminal record. Will I be refused registration?',
    a: 'Not automatically. Para 3 of the 2025 Arrangements states that applications are judged on the facts. PACE Schedule C 6.13 is applied: minor and historic convictions are usually not a bar; recent or serious convictions usually are. Disclose any conviction proactively to your firm and assessment organisation.',
  },
  {
    q: 'Is it actually worth becoming a police station representative?',
    a: 'For the right person — geographically flexible, resilient, committed to criminal defence — yes. It is not quick, cheap, or suitable as casual extra income. See /HowToBecomePoliceStationRep for full timelines and costs, and /GetWork for income expectations once accredited.',
  },
];

const OFFICIAL_LINKS = [
  {
    label: 'LAA — Police Station Register Arrangements 2025 (PDF)',
    href: 'https://assets.publishing.service.gov.uk/media/68dcf841ef1c2f72bc1e4c9f/Police_Station_Register_Arrangements_2025.pdf',
  },
  {
    label: 'SRA — Police Station Representative Accreditation Scheme',
    href: 'https://www.sra.org.uk/solicitors/resources/specific-areas-of-practice/police-station-representative-accreditation-scheme/',
  },
  {
    label: 'SRA — Assessment guidelines',
    href: 'https://www.sra.org.uk/solicitors/resources/specific-areas-of-practice/assessment-guidelines/',
  },
  {
    label: 'SRA — Standards of competence for accreditation',
    href: 'https://www.sra.org.uk/solicitors/resources/specific-areas-of-practice/standards/',
  },
  {
    label: 'SRA — Good practice guide for police station representatives',
    href: 'https://www.sra.org.uk/solicitors/resources/specific-areas-of-practice/good-practice-guide-police-station-representatives/',
  },
  {
    label: 'GOV.UK — Find a Legal Aid Adviser',
    href: 'https://find-legal-advice.justice.gov.uk/',
  },
  {
    label: 'Law Society — Find a Solicitor',
    href: 'https://solicitors.lawsociety.org.uk/',
  },
  {
    label: 'GOV.UK — Standard Crime Contract 2025',
    href: 'https://www.gov.uk/government/publications/standard-crime-contract-2025',
  },
  {
    label: 'GOV.UK — PACE Codes of Practice',
    href: 'https://www.gov.uk/guidance/police-and-criminal-evidence-act-1984-pace-codes-of-practice',
  },
  {
    label: 'Cardiff University — PSRAS course',
    href: 'https://www.cardiff.ac.uk/professional-development/available-training/short-courses/psras',
  },
  {
    label: 'Datalaw — PSRAS assessment',
    href: 'https://datalawonline.co.uk/',
  },
];

const RELATED = [
  { href: '/HowToBecomePoliceStationRep', label: 'How to Become a Rep', desc: 'Full PSRAS roadmap, costs, and CIT' },
  { href: '/BuildPortfolioGuide', label: 'Build Your Portfolio', desc: 'Supervised attendances and evidence' },
  { href: '/PrepareForCIT', label: 'Prepare for the CIT', desc: 'Critical Incidents Test prep' },
  { href: '/DSCCRegistrationGuide', label: 'DSCC Registration Guide', desc: 'ADMIN 2 / ADMIN 3 detail' },
  { href: '/Wiki', label: 'Rep Wiki', desc: 'Practice guides for new reps' },
  { href: '/GetWork', label: 'Get Work Guide', desc: 'After accreditation — freelance practice' },
];

function SectionHeading({ id, children }: { id: string; children: React.ReactNode }) {
  return (
    <h2 id={id} className="text-h2 scroll-mt-24 text-[var(--navy)]">
      {children}
    </h2>
  );
}

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
            An in-depth, regulation-grounded guide for aspiring police station representatives —
            what a supervising solicitor really is under the LAA 2025 Arrangements, who can lawfully
            supervise you, and how to win a paid trainee position at a Standard Crime Contract firm
            without falling into paid-supervision traps.
          </p>
          <p className="mt-2 text-xs text-slate-400">
            Last updated: 20 May 2026 · Article ref: FSS-20260520 · Author: Robert Cashman, Duty
            Solicitor &amp; Higher Court Advocate
          </p>
        </div>
      </section>

      <div className="page-container">
        <div className="mx-auto max-w-4xl">
          <ContentReliabilityNotice className="mb-8" />
          {/* Read first */}
          <div className="mb-10 rounded-[var(--radius-lg)] border border-amber-300 bg-amber-50 p-6">
            <h2 className="text-base font-bold text-amber-900">Read this first</h2>
            <p className="mt-2 text-sm leading-relaxed text-amber-900">
              This page is <strong>general career information only</strong> — not legal advice. PoliceStationRepUK
              is operated by Defence Legal Services Ltd. We are not a law firm, do not hold a Standard Crime
              Contract for trainees we have not employed, and cannot act as your supervising solicitor.
            </p>
            <p className="mt-2 text-sm leading-relaxed text-amber-900">
              We also <strong>strongly recommend against</strong> any arrangement where you pay a firm or named
              solicitor for supervision. Supervision is a regulated function under the LAA Standard Crime
              Contract and the SRA Code of Conduct for Firms — it is not a service for sale to trainees. The
              only realistic, defensible route is paid employment (or a structured apprenticeship / training
              contract) at a firm that already holds the contract.
            </p>
          </div>

          {/* On this page */}
          <nav className="mb-12 rounded-[var(--radius-lg)] border border-[var(--card-border)] bg-[var(--card-bg)] p-5 shadow-[var(--card-shadow)] sm:p-6" aria-label="On this page">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-[var(--navy)]">
              On this page
            </h2>
            <ol className="mt-3 grid list-decimal gap-x-6 gap-y-1 pl-5 text-sm text-[var(--muted)] sm:grid-cols-2">
              {ON_THIS_PAGE.map((item) => (
                <li key={item.id}>
                  <a href={`#${item.id}`} className="text-[var(--navy)] underline decoration-[var(--gold)]/40 underline-offset-2 hover:decoration-[var(--gold)]">
                    {item.label}
                  </a>
                </li>
              ))}
            </ol>
          </nav>

          {/* Definition */}
          <section className="mb-12">
            <SectionHeading id="definition">What a supervising solicitor actually is</SectionHeading>
            <p className="mt-3 text-sm leading-relaxed text-[var(--muted)]">
              The term comes from the <strong>Police Station Register Arrangements 2025</strong>, issued by the
              Legal Aid Agency under the Legal Aid, Sentencing and Punishment of Offenders Act 2012. A
              <em> Supervising Solicitor</em> is the solicitor currently supervising a Police Station
              Representative who:
            </p>
            <ul className="mt-4 list-disc space-y-2 pl-6 text-sm leading-relaxed text-[var(--muted)]">
              <li>is a current Duty Solicitor, <em>or</em></li>
              <li>
                is a solicitor acceptable to the LAA as meeting the <strong>Criminal Investigations and
                Criminal Proceedings supervisor standard</strong> under the 2025 Standard Crime Contract
                (including on a temporary basis); and
              </li>
              <li>has <strong>not been suspended</strong> from Supervising Solicitor status under the SCC.</li>
            </ul>
            <p className="mt-4 text-sm leading-relaxed text-[var(--muted)]">
              They sit inside a firm that holds a Standard Crime Contract with a police station schedule. The
              LAA contracts with the firm, not with you directly. They are responsible for:
            </p>
            <ul className="mt-3 list-disc space-y-2 pl-6 text-sm leading-relaxed text-[var(--muted)]">
              <li>certifying Part A of your portfolio with your assessment organisation;</li>
              <li>filing ADMIN 2 with the DSCC to add you to the Police Station Register as Probationary;</li>
              <li>supervising your attendances in real time during your 12-month probationary year;</li>
              <li>filing ADMIN 3 at every annual DSCC data cleanse;</li>
              <li>maintaining your professional indemnity cover via the firm’s insurance;</li>
              <li>meeting the SRA <em>Good practice guide for police station representatives</em> obligation to supervise your work to an appropriate standard.</li>
            </ul>
          </section>

          {/* Why elusive */}
          <section className="mb-12">
            <SectionHeading id="why-elusive">Why supervision feels &quot;elusive&quot;</SectionHeading>
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

          {/* Who can supervise */}
          <section className="mb-12">
            <SectionHeading id="who-can-supervise">Who can supervise — the legal test</SectionHeading>
            <p className="mt-3 text-sm leading-relaxed text-[var(--muted)]">
              Before you contact any firm, run the four tests below. If any one of them fails, the
              arrangement is not workable — no matter how enthusiastic the named solicitor is about helping
              you.
            </p>
            <div className="mt-6 space-y-4">
              {SUPERVISOR_TESTS.map((t) => (
                <div
                  key={t.title}
                  className="rounded-[var(--radius)] border-l-4 border-[var(--gold)] bg-slate-50 p-5"
                >
                  <h3 className="text-base font-bold text-[var(--navy)]">{t.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-[var(--muted)]">{t.body}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Employment route */}
          <section className="mb-12">
            <SectionHeading id="employment">The realistic route — employment at an SCC firm</SectionHeading>
            <p className="mt-3 text-sm leading-relaxed text-[var(--muted)]">
              There is one reliable, regulator-aligned route to PSRAS supervision: <strong>paid employment
              (or a structured apprenticeship) at a firm holding a Standard Crime Contract with a police
              station schedule</strong>. Inside that employment relationship, the firm’s designated supervisor
              under the SCC will supervise your PSRAS work as part of their existing contractual and
              regulatory obligations. This is the model the LAA, the SRA, and the assessment organisations
              are designed around.
            </p>
            <p className="mt-3 text-sm leading-relaxed text-[var(--muted)]">
              Successful trainees almost always follow the same arc:
            </p>
            <ol className="mt-4 list-decimal space-y-2 pl-6 text-sm leading-relaxed text-[var(--muted)]">
              <li>Apply for paralegal, legal assistant, or police-station-cover trainee roles at multiple SCC firms.</li>
              <li>Make yourself useful on admin, billing, CRM, file management for 3–12 months.</li>
              <li>Enrol with Cardiff or Datalaw with the firm’s knowledge (and often funding).</li>
              <li>Sit / be exempt from the written exam; complete Part A of the portfolio with observed attendances.</li>
              <li>Your supervisor files ADMIN 2; you become a Probationary Representative on the Register.</li>
              <li>Complete Part B + CIT within 12 months. You are now Accredited.</li>
              <li>Choose whether to remain employed, go freelance, or move firms with your accreditation intact.</li>
            </ol>
          </section>

          {/* How to identify SCC firms */}
          <section className="mb-12">
            <SectionHeading id="identify-firms">How to identify firms that can supervise you</SectionHeading>
            <p className="mt-3 text-sm leading-relaxed text-[var(--muted)]">
              Not every criminal-law firm holds an active Standard Crime Contract — and those that do not
              cannot lawfully supervise your PSRAS portfolio. Use multiple signals before applying:
            </p>
            <ul className="mt-4 list-disc space-y-2 pl-6 text-sm leading-relaxed text-[var(--muted)]">
              {SCC_INDICATORS.map((s) => (
                <li key={s}>{s}</li>
              ))}
            </ul>
            <p className="mt-4 text-sm leading-relaxed text-[var(--muted)]">
              The single most reliable source is the GOV.UK <em>Find a Legal Aid Adviser</em> tool filtered for
              Crime — it lists every active legal aid provider by postcode. Cross-check with the Law Society
              roll for the named supervisor and with the SRA register for their practising status.
            </p>
          </section>

          {/* Application strategy */}
          <section className="mb-12">
            <SectionHeading id="application-strategy">A serious application strategy</SectionHeading>
            <p className="mt-3 text-sm leading-relaxed text-[var(--muted)]">
              Firms read applications the way custody officers read disclosure: looking for what is missing.
              A strong application puts the building blocks below into a single, scannable page.
            </p>
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              {APPLICATION_BUILDING_BLOCKS.map((b) => (
                <div
                  key={b.title}
                  className="rounded-[var(--radius)] border border-[var(--card-border)] bg-[var(--card-bg)] p-5 shadow-[var(--card-shadow)]"
                >
                  <h3 className="text-base font-bold text-[var(--navy)]">{b.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-[var(--muted)]">{b.body}</p>
                </div>
              ))}
            </div>

            <h3 className="mt-10 text-lg font-bold text-[var(--navy)]">Five-phase plan</h3>
            <div className="mt-4 space-y-6">
              {APPLICATION_PHASES.map((phase) => (
                <div
                  key={phase.number}
                  className="rounded-[var(--radius-lg)] border border-[var(--card-border)] bg-[var(--card-bg)] p-6 shadow-[var(--card-shadow)] sm:p-8"
                >
                  <div className="mb-4 flex items-start gap-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 border-[var(--gold)] text-sm font-bold text-[var(--gold)]">
                      {phase.number}
                    </div>
                    <div>
                      <h4 className="text-lg font-bold text-[var(--navy)]">{phase.title}</h4>
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

          {/* Email template */}
          <section className="mb-12">
            <SectionHeading id="email-template">What a strong application looks like</SectionHeading>
            <p className="mt-3 text-sm leading-relaxed text-[var(--muted)]">
              The example below is illustrative — adapt it ruthlessly to your geography, your prior work, and
              the named contact. It demonstrates the structure firms respond to: useful first, ambitious
              second, PSRAS status third.
            </p>
            <pre className="mt-4 overflow-x-auto rounded-[var(--radius)] border border-[var(--card-border)] bg-slate-50 p-5 text-xs leading-relaxed text-[var(--navy)] sm:text-sm">
{EMAIL_TEMPLATE}
            </pre>
          </section>

          {/* Interview */}
          <section className="mb-12">
            <SectionHeading id="interview">The interview — what firms are scoring</SectionHeading>
            <p className="mt-3 text-sm leading-relaxed text-[var(--muted)]">
              An interview for a junior criminal-law role is not an academic exam. It is a risk assessment.
              The head of crime is mentally answering four questions:
            </p>
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              {INTERVIEW_CRITERIA.map((c) => (
                <div
                  key={c.title}
                  className="rounded-[var(--radius)] border border-[var(--card-border)] bg-[var(--card-bg)] p-5 shadow-[var(--card-shadow)]"
                >
                  <h3 className="text-base font-bold text-[var(--navy)]">{c.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-[var(--muted)]">{c.body}</p>
                </div>
              ))}
            </div>
          </section>

          {/* PSR Train promo */}
          <PsrTrainPromo variant="card" campaign="find_supervisor" className="mb-12" />

          {/* ADMIN process */}
          <section className="mb-12">
            <SectionHeading id="admin-process">After &quot;yes&quot; — the ADMIN 2 / ADMIN 3 process</SectionHeading>
            <p className="mt-3 text-sm leading-relaxed text-[var(--muted)]">
              Securing a supervisor is the start, not the end, of the regulatory paperwork. The 2025
              Arrangements impose strict timelines.
            </p>
            <div className="mt-6 space-y-4">
              {ADMIN_STEPS.map((s) => (
                <div
                  key={s.title}
                  className="rounded-[var(--radius)] border border-[var(--card-border)] bg-[var(--card-bg)] p-5 shadow-[var(--card-shadow)]"
                >
                  <h3 className="text-base font-bold text-[var(--navy)]">{s.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-[var(--muted)]">{s.body}</p>
                </div>
              ))}
            </div>
            <p className="mt-4 text-sm leading-relaxed text-[var(--muted)]">
              See <Link href="/DSCCRegistrationGuide" className="text-[var(--navy)] underline decoration-[var(--gold)]/40 underline-offset-2 hover:decoration-[var(--gold)]">our DSCC Registration Guide</Link>
              {' '}for the form-by-form detail.
            </p>
          </section>

          {/* Supervisor leaves */}
          <section className="mb-12">
            <SectionHeading id="supervisor-leaves">If your supervisor leaves or the firm closes</SectionHeading>
            <p className="mt-3 text-sm leading-relaxed text-[var(--muted)]">
              The 2025 Arrangements (paras 4–5) require Police Station Representatives to always have a
              designated supervising solicitor. Gaps are the most common reason reps are quietly removed
              from the Police Station Register at the annual DSCC data cleanse.
            </p>
            <ul className="mt-4 list-disc space-y-2 pl-6 text-sm leading-relaxed text-[var(--muted)]">
              <li>If your supervisor retires, is unwell, or leaves the firm, notify the DSCC immediately.</li>
              <li>Identify a replacement at the same firm (preferred) or arrange a move to another SCC firm.</li>
              <li>If your firm loses its Standard Crime Contract, you must move firms to retain Register status.</li>
              <li>The DSCC can authorise a temporary supervisor in exceptional circumstances — request it in writing.</li>
              <li>Do not assume an ADMIN 3 will be filed for you — confirm with the new supervisor in writing.</li>
            </ul>
          </section>

          {/* Red flags */}
          <section className="mb-12">
            <SectionHeading id="red-flags">Red flags and arrangements to refuse</SectionHeading>
            <div className="mt-4 rounded-[var(--radius-lg)] border border-red-300 bg-red-50 p-5 text-sm leading-relaxed text-red-900">
              {RED_FLAG_NOTE}
            </div>
            <ul className="mt-6 list-disc space-y-2 pl-6 text-sm leading-relaxed text-[var(--muted)]">
              {RED_FLAGS.map((r) => (
                <li key={r}>{r}</li>
              ))}
            </ul>
          </section>

          {/* Alternative entry routes */}
          <section className="mb-12">
            <SectionHeading id="alternative-routes">Alternative entry routes</SectionHeading>
            <p className="mt-3 text-sm leading-relaxed text-[var(--muted)]">
              If you cannot land a paralegal role at an SCC firm directly, consider these regulator-aligned
              alternatives that still lead to legitimate PSRAS supervision.
            </p>
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              {ALTERNATIVE_ROUTES.map((r) => (
                <div
                  key={r.title}
                  className="rounded-[var(--radius)] border border-[var(--card-border)] bg-[var(--card-bg)] p-5 shadow-[var(--card-shadow)]"
                >
                  <h3 className="text-base font-bold text-[var(--navy)]">{r.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-[var(--muted)]">{r.body}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Geography */}
          <section className="mb-12">
            <SectionHeading id="geography">Geography and duty-rota density</SectionHeading>
            <p className="mt-3 text-sm leading-relaxed text-[var(--muted)]">
              The structure of the SCC market varies sharply by region. Match your application strategy to
              your location.
            </p>
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              {GEOGRAPHY_NOTES.map((g) => (
                <div
                  key={g.title}
                  className="rounded-[var(--radius)] border border-[var(--card-border)] bg-[var(--card-bg)] p-5 shadow-[var(--card-shadow)]"
                >
                  <h3 className="text-base font-bold text-[var(--navy)]">{g.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-[var(--muted)]">{g.body}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Rejection */}
          <section className="mb-12">
            <SectionHeading id="rejection">Handling rejection and persistence</SectionHeading>
            <p className="mt-3 text-sm leading-relaxed text-[var(--muted)]">
              Almost every successful police station representative was rejected multiple times before
              landing their first role. Persistence is part of the assessment — but persistence has to be
              informed, not stubborn.
            </p>
            <ul className="mt-4 list-disc space-y-2 pl-6 text-sm leading-relaxed text-[var(--muted)]">
              {REJECTION_RULES.map((r) => (
                <li key={r}>{r}</li>
              ))}
            </ul>
          </section>

          {/* FAQ */}
          <section className="mb-12">
            <SectionHeading id="faq">Frequently asked questions</SectionHeading>
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
            context={{ kind: 'page', path: '/FindSupervisingSolicitor' }}
            extra={OFFICIAL_LINKS}
          />

          <section className="rounded-[var(--radius-lg)] bg-[var(--navy)] p-8 text-center">
            <h2 className="text-xl font-bold text-white">Still building your PSRAS journey?</h2>
            <p className="mt-3 text-sm text-slate-300">
              Read the full accreditation roadmap, then return here when you are ready to approach
              SCC firms professionally.
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
