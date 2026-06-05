/** Structured content for /BuildPortfolioGuide — verified against PSRA 2025, Datalaw portfolio guide, SRA standards. */

export const PORTFOLIO_ON_THIS_PAGE = [
  { id: 'journey', label: 'Where the portfolio sits' },
  { id: 'requirements', label: 'Official case requirements' },
  { id: 'probationary', label: 'Probationary rules' },
  { id: 'deadlines', label: 'Deadlines and PIN suspension' },
  { id: 'competence', label: 'SRA competence mapping' },
  { id: 'case-report', label: 'Case report blueprint' },
  { id: 'breadth', label: 'Breadth matrix (9 cases)' },
  { id: 'supervision', label: 'Supervisor feedback' },
  { id: 'submission', label: 'Submission workflow' },
  { id: 'fail-patterns', label: 'Common fail patterns' },
  { id: 'checklist', label: 'Self-assessment checklist' },
  { id: 'tips', label: 'Tips for success' },
  { id: 'mistakes', label: 'Common mistakes' },
  { id: 'faqs', label: 'FAQs' },
  { id: 'related', label: 'Related guides' },
  { id: 'sources', label: 'Official sources' },
] as const;

export const PORTFOLIO_JOURNEY_STEPS = [
  {
    n: 1,
    title: 'Enrol with Cardiff or Datalaw',
    body: 'Register with an SRA-authorised assessment organisation. You receive regulations, handbook, and timetable.',
  },
  {
    n: 2,
    title: 'Pass the written exam (or prove exemption)',
    body: 'The written examination must be passed before Part A portfolio cases begin (Datalaw process). PSRA 2025 also requires written pass (or exemption) before DSCC probationary registration.',
  },
  {
    n: 3,
    title: 'Complete Part A (four case studies)',
    body: 'Part A Stage 1: two cases observing your supervising solicitor. Part A Stage 2: two cases where you advise while observed. Submit Part A for assessment; cases must usually be within three months of submission (Datalaw).',
  },
  {
    n: 4,
    title: 'Probationary registration (ADMIN 2)',
    body: 'Once Part A and the written exam (or exemption) are passed, your supervising solicitor submits ADMIN 2 to the DSCC. You receive a probationary PIN — typically within 14 days of a complete application (PSRA 2025).',
  },
  {
    n: 5,
    title: 'Complete Part B (five case studies) and pass the CIT',
    body: 'After probationary registration you may undertake Part B (five unsupervised cases) and the Critical Incidents Test — in either order (Datalaw). All nine portfolio cases must be submitted within 12 months of your first case (Datalaw).',
  },
  {
    n: 6,
    title: 'Full accreditation',
    body: 'When Part B portfolio and CIT are passed, you become a fully accredited police station representative on the Register.',
  },
] as const;

export const PORTFOLIO_CASE_TABLE = [
  {
    part: 'Part A — Stage 1',
    cases: '2',
    role: 'Observe supervising solicitor advising at the police station',
    supervision: 'Supervising solicitor leads; you take detailed notes',
  },
  {
    part: 'Part A — Stage 2',
    cases: '2',
    role: 'You advise at the police station while observed by supervising solicitor',
    supervision: 'Signed written supervisor feedback required (Datalaw upload for cases 3–4)',
  },
  {
    part: 'Part B',
    cases: '5',
    role: 'You advise unsupervised (probationary PIN in place)',
    supervision: 'Feedback sessions recommended; not always mandatory in submission',
  },
  {
    part: 'Total portfolio',
    cases: '9',
    role: 'Each case includes advice and attendance at a police interview',
    supervision: 'Chronological order; co-defendant matter counts as one case only',
  },
] as const;

export const PORTFOLIO_PROVIDER_NOTES = [
  {
    provider: 'Datalaw',
    notes:
      'Nine cases in two parts (2+2+5). Part A may be submitted for technical compliance before probationary PIN. Part B and CIT available once probationary status is granted. Confirm current submission deadlines on the Datalaw timetable.',
  },
  {
    provider: 'Cardiff University',
    notes:
      'Cardiff runs the same regulated PSRAS qualification but may differ on templates, submission dates, and classroom support. Download Cardiff&apos;s current candidate handbook — do not assume Datalaw numbers differ without checking.',
  },
] as const;

export const PORTFOLIO_PROBATIONARY_RULES = [
  'Probationary representatives must not take on duty cases or indictable-only cases (PSRA 2025).',
  'Probationary representatives may only advise on own-client cases assigned to the provider where their supervising solicitor is based (PSRA 2025).',
  'Part A Stage 1 cases may include duty-referred and indictable matters because the supervising solicitor leads (Datalaw).',
  'Part B cases: own-client summary or either-way offences only for probationary reps (Datalaw).',
  'Every case must include an interview where the suspect is questioned by a constable (Datalaw).',
  'You must have a recognised supervising solicitor at all times throughout accreditation (Datalaw / PSRA 2025).',
] as const;

export const PORTFOLIO_DEADLINES = [
  {
    title: 'Before probationary PIN',
    body: 'Pass written exam (or prove LAA exemption) and pass Part A portfolio assessment. Supervising solicitor submits ADMIN 2 with evidence of passes.',
  },
  {
    title: 'First 6 months after DSCC registration',
    body: 'Pass at least one of Part B portfolio or CIT. If neither is passed within 6 months, PIN is suspended until one test is passed (PSRA 2025; Datalaw mirrors this).',
  },
  {
    title: '12-month probationary period',
    body: 'Pass all remaining tests (Part B and CIT) within 12 months of registration, or within the extended two-period structure if one test was missed at 6 months (PSRA 2025).',
  },
  {
    title: 'Portfolio case age (Datalaw)',
    body: 'Part A cases must be within three months of submission date. Full nine-case portfolio must be submitted within 12 months of the first case.',
  },
] as const;

export const PORTFOLIO_COMPETENCE_MAP = [
  {
    outcome: 'Assessment outcome 1 — Role of the rep',
    portfolioSection: 'Client details; initial contact; explaining your role (Code C Note 6D)',
    body: 'Show you understand authority to act, third-party instructions, and the rep&apos;s objectives at custody.',
  },
  {
    outcome: 'Assessment outcome 2 — Criminal process',
    portfolioSection: 'Case details; arrest/detention analysis',
    body: 'Record and test arrest under PACE s.24 and Code G; detention under s.37. Datalaw assessors expect challenge where grounds are weak.',
  },
  {
    outcome: 'Assessment outcome 3 — Crimes and defences',
    portfolioSection: 'Offence elements; advice section',
    body: 'Identify offence elements, potential defences, and tie advice to the allegation — not generic templates.',
  },
  {
    outcome: 'Assessment outcome 4 — Rules of evidence',
    portfolioSection: 'Disclosure analysis; interview strategy',
    body: 'Explain evidential significance of what was disclosed, missing, or said/not said in interview.',
  },
  {
    outcome: 'Assessment outcome 5 — Police station procedure',
    portfolioSection: 'Custody record; samples; identification; reviews',
    body: 'Cover PACE Code C procedure: detention clocks, reviews, appropriate adults, samples (PACE ss.61–63), identification (Code D) where relevant.',
  },
  {
    outcome: 'Assessment outcome 6 — Interview',
    portfolioSection: 'Interview section; interventions',
    body: 'Describe strategy (answer, no comment, prepared statement), interventions on improper questions, and whether strategy held.',
  },
  {
    outcome: 'Assessment outcome 7 — Ethics and professional conduct',
    portfolioSection: 'Reflection; conflicts; contract compliance',
    body: 'Reflect on performance; note DSCC contact rules (e.g. initial contact within 45 minutes under SCC — Datalaw assessor guidance).',
  },
] as const;

export const PORTFOLIO_CASE_SECTIONS = [
  {
    title: 'Client and case details',
    body: 'Anonymised client (e.g. &quot;Mr X&quot;), age, offence type, UFN, date, station. Never use real names or identifying details. State how you were instructed and your role (observe / lead / unsupervised).',
    assessor: 'Assessors cannot infer knowledge you do not record — write it down (Datalaw assessment board).',
  },
  {
    title: 'Arrest, detention, and delay',
    body: 'Where the client was arrested, test s.24/Code G necessity and s.37 detention grounds. Explain any delay (transfer, hospital, rest periods) and its effect on the custody clock.',
    assessor: 'Increasing failures where candidates omit initial telephone contact or fail to explain rest/delay (Datalaw).',
  },
  {
    title: 'Disclosure analysis',
    body: 'What the police disclosed (initial and further), what was missing, what you chased, and why it mattered for advice. Link to Code C para 11.1A and fairness.',
    assessor: 'Thin disclosure supporting no comment must be explained with CJPOA s.34 risks to the client.',
  },
  {
    title: 'Legal advice and strategy',
    body: 'Answer, no comment, or prepared statement — with reasons tied to disclosure, offence elements, and adverse-inference position. Record instructions clearly.',
    assessor: 'Generic pasted advice fails — every section must be case-specific.',
  },
  {
    title: 'The interview',
    body: 'Dynamics, representative interventions, client performance, and whether the strategy held. Note oppressive or misleading questions you challenged.',
    assessor: 'Show practical decision-making, not textbook summaries.',
  },
  {
    title: 'Reflection',
    body: 'What went well, what you would do differently, and what you learned. Supervisors should help identify gaps before submission.',
    assessor: 'Reflective voice matters more than length — assessors look for self-awareness (SRA external examiner themes).',
  },
] as const;

export const PORTFOLIO_BREADTH_MATRIX = [
  { category: 'Violence / public order', examples: 'Assault, ABH, affray, domestic incident' },
  { category: 'Dishonesty', examples: 'Theft, fraud, handling, burglary' },
  { category: 'Drugs / road traffic', examples: 'Possession, supply, drink/drug drive' },
  { category: 'Youth / vulnerability', examples: 'Juvenile with AA; mentally vulnerable adult' },
  { category: 'Identification', examples: 'Code D procedure; VIPER; street ID challenge' },
  { category: 'Adverse inference', examples: 'No comment or prepared statement with s.34 explanation' },
  { category: 'Samples / forensic', examples: 'Fingerprints, DNA, non-intimate samples' },
] as const;

export const PORTFOLIO_SUBMISSION_STEPS = [
  'Confirm case order (usually descending date order for Datalaw online submission).',
  'Part A: upload each case PDF with UFN, date, supervisor name and roll number. Cases 3–4 require supervisor feedback PDF (Datalaw).',
  'Await technical compliance pass on Part A before DSCC probationary application (Datalaw workflow).',
  'Part B: upload five cases with probationary PIN, UFN, and dates.',
  'Full portfolio enters multi-stage assessment — expect feedback rounds before final pass.',
  'Cardiff candidates: follow Cardiff handbook submission method and deadlines.',
] as const;

export const PORTFOLIO_FAIL_PATTERNS = [
  'Failing to record or test arrest/detention grounds (PACE ss.24, 37; Code G) — Datalaw assessment board.',
  'No record of initial telephone contact or unexplained delay during rest periods — Datalaw.',
  'Assessors inferring competence from unwritten assumptions — everything material must appear in the case study.',
  'Generic advice paragraphs copied between cases without case-specific analysis.',
  'Missing breadth across the nine cases (single offence type repeated).',
  'Weak reflection — no learning point or self-criticism.',
] as const;

export const PORTFOLIO_CHECKLIST = [
  'Nine cases total: 2 observe + 2 observed advising + 5 unsupervised',
  'Each case includes advice and a constable-led interview',
  'Client anonymised; UFN and dates correct',
  'Arrest/detention tested where relevant',
  'Disclosure chased and analysed',
  'Interview strategy explained with s.34 where applicable',
  'Supervisor feedback attached for Part A Stage 2 (Datalaw)',
  'Breadth of offences and issues across the portfolio',
  'Reflective learning in every case',
  'Submitted within provider deadline and case-age rules',
] as const;

export const PORTFOLIO_TIPS = [
  'Keep contemporaneous attendance notes — you cannot reconstruct disclosure weeks later.',
  'Plan breadth across nine cases from the start; do not leave identification or vulnerability to the last case.',
  'Apply supervisor feedback before resubmitting — first submissions often need amendment.',
  'Treat each case report as CIT preparation: explain what you would do and why.',
  'Use the golden rule (Datalaw): if an issue arises in the case, deal with it in the write-up.',
  'Extra real attendances beyond nine may help your skills, but only nine assessed cases go in the portfolio.',
] as const;

export const PORTFOLIO_MISTAKES = [
  'Treating portfolio minimums as &quot;6 + 10 attendances&quot; — the regulated structure is nine case studies (2+2+5)',
  'Starting Part A before passing the written exam (Datalaw requirement)',
  'Taking indictable-only or duty cases as probationary lead adviser',
  'Copy-pasting advice without case-specific disclosure analysis',
  'Submitting without supervisor sign-off or mandatory feedback documents',
  'Assuming assessors will infer PACE knowledge you did not write down',
] as const;

export const PORTFOLIO_FAQS = [
  {
    q: 'How many cases are in the PSRAS portfolio?',
    a: 'Nine case studies in total: Part A Stage 1 (two observed), Part A Stage 2 (two where you advise while observed), and Part B (five unsupervised). Each must include advice and a police interview (Datalaw; consistent with PSRA 2025 Part A structure).',
  },
  {
    q: 'Can I start Part A before passing the written exam?',
    a: 'Datalaw requires the written exam to be passed before Part A cases begin. Secure your supervising solicitor and firm support first, but sit or obtain exemption for the written stage before counting portfolio cases.',
  },
  {
    q: 'When do I get a probationary PIN?',
    a: 'After your assessment organisation passes Part A and you have passed or been exempted from the written exam, your supervising solicitor submits ADMIN 2 to the DSCC. The DSCC typically issues a PIN within 14 days of a complete application (PSRA 2025).',
  },
  {
    q: 'Must I finish the portfolio before the CIT?',
    a: 'Once probationary, Part B and CIT can be undertaken in either order (Datalaw). You must pass both within the probationary deadlines (PSRA 2025).',
  },
  {
    q: 'Can I use the same co-defendant case twice?',
    a: 'No — a co-defendant matter counts as one case study only (Datalaw).',
  },
  {
    q: 'Do Cardiff and Datalaw require the same number of cases?',
    a: 'Both assess the same SRA-regulated PSRAS qualification. Case counts align with the nine-case structure; always confirm templates and deadlines in your provider&apos;s current handbook.',
  },
  {
    q: 'What if I miss the 6-month or 12-month deadline?',
    a: 'Missing a deadline can suspend your PIN until tests are passed; extensions may be available for extenuating circumstances with evidence (PSRA 2025). Contact the DSCC and your supervisor immediately.',
  },
  {
    q: 'Can I change supervising solicitor mid-portfolio?',
    a: 'The same solicitor should supervise throughout. Changing supervisor requires DSCC permission except in exceptional circumstances (PSRA 2025).',
  },
] as const;

export const PORTFOLIO_RELATED = [
  { href: '/PrepareForWrittenExam', label: 'Prepare for the written exam', desc: 'Format, exemptions, syllabus, and study plan' },
  { href: '/PrepareForCIT', label: 'Prepare for the CIT', desc: 'Final role-play assessment' },
  { href: '/HowToBecomePoliceStationRep', label: 'Full PSRAS guide', desc: 'Complete accreditation route and timelines' },
  { href: '/FindSupervisingSolicitor', label: 'Find a supervising solicitor', desc: 'The main barrier to starting' },
  { href: '/PoliceDisclosureGuide', label: 'Disclosure guide', desc: 'What to record from the officer in the case' },
  { href: '/InterviewUnderCaution', label: 'Interview guide', desc: 'Interview strategy reference' },
] as const;

/** @deprecated Use PORTFOLIO_CASE_TABLE — kept for any legacy imports */
export const PORTFOLIO_PART_A = PORTFOLIO_CASE_TABLE.filter((r) => r.part.startsWith('Part A')).map(
  (r) => `${r.part}: ${r.cases} case(s) — ${r.role}`,
);

/** @deprecated Use PORTFOLIO_CASE_TABLE */
export const PORTFOLIO_PART_B = [
  'Part B — five unsupervised case studies (probationary PIN required).',
  'Each case: full reflective report with advice and interview attendance.',
  'Spread breadth of offences and issues across all nine portfolio cases.',
] as const;
