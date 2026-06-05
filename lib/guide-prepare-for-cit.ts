/** Structured content for /PrepareForCIT — verified against Datalaw CIT guide, PSRA 2025, SRA standards. */

export const CIT_ON_THIS_PAGE = [
  { id: 'what', label: 'What is the CIT?' },
  { id: 'prerequisites', label: 'Prerequisites' },
  { id: 'format', label: 'Assessment format' },
  { id: 'marking', label: 'Marking scheme' },
  { id: 'flow', label: 'Scenario flow' },
  { id: 'syllabus', label: 'Study syllabus' },
  { id: 'answering', label: 'How to answer prompts' },
  { id: 'prep-plan', label: '4–6 week prep plan' },
  { id: 'exam-day', label: 'Exam day' },
  { id: 'tips', label: 'Exam tips' },
  { id: 'pitfalls', label: 'Common pitfalls' },
  { id: 'after', label: 'After the CIT' },
  { id: 'faqs', label: 'FAQs' },
  { id: 'related', label: 'Related guides' },
  { id: 'sources', label: 'Official sources' },
] as const;

export const CIT_FORMAT_CARDS = [
  {
    label: 'Delivery',
    value: 'Role-play under exam conditions — Datalaw presents scenarios on audio; you respond aloud and are recorded',
  },
  {
    label: 'Structure',
    value: 'Chronological police station attendance: telephone → custody → disclosure → consultation → interview → post-interview',
  },
  {
    label: 'Pass standard',
    value: 'At least 50% on Content, Confidence, and Control in each scenario (Datalaw regulations)',
  },
] as const;

export const CIT_MARKING_CRITERIA = [
  {
    criterion: 'Content',
    body: 'Legal, procedural, and factual accuracy — correct analysis of facts and application of law to those facts.',
    behaviours: 'Cite PACE Code provisions; identify vulnerability; explain s.34 where silence is advised; challenge unlawful procedure.',
  },
  {
    criterion: 'Confidence',
    body: 'Self-assurance in responding — clear, decisive advice without undue hesitation.',
    behaviours: 'Speak as the representative advising a real client; avoid reading out statute without application.',
  },
  {
    criterion: 'Control',
    body: 'Appropriate control in the scenario — managing police, client, and process.',
    behaviours: 'Insist on disclosure before interview; request appropriate adult; intervene on oppressive questioning; stay in role.',
  },
] as const;

export const CIT_SCENARIO_FLOW = [
  { stage: 'Initial telephone contact', detail: 'DSCC call, client, or third party — take instructions; confirm station and status' },
  { stage: 'Attendance at station', detail: 'Custody sergeant; custody record; volunteer vs detained; initial welfare checks' },
  { stage: 'Disclosure', detail: 'Obtain sufficient disclosure from officer in the case; chase missing material' },
  { stage: 'Consultation', detail: 'Private advice on caution, options, s.34, samples, identification, interview strategy' },
  { stage: 'PACE interview', detail: 'Interventions on improper questions; breaks; prepared statement or no comment' },
  { stage: 'Post-interview', detail: 'Bail, RUI, charge, representations; further client queries' },
] as const;

export const CIT_SYLLABUS_MODULES = [
  {
    title: 'Role and ethics',
    body: 'Authority to act; third-party instructions (Code C Annex B); conflicts; professional conduct (SRA Standards outcome 1). Code C Note 6D sets the solicitor/rep role at custody.',
    source: 'PACE Code C; SRA Standards of competence outcome 1',
    href: '/PACE',
  },
  {
    title: 'Vulnerable suspects and appropriate adults',
    body: 'Juveniles and mentally vulnerable adults require an appropriate adult before interview. Spot subtle welfare flags in scenarios and halt interview until AA present.',
    source: 'PACE Code C paras 1.4, 3.9–3.22, 11.15',
    href: '/Wiki/fitness-for-interview-custody',
  },
  {
    title: 'Detention, reviews, and time limits',
    body: 'Initial detention, superintendent extension, magistrates&apos; warrant for indictable-only; custody sergeant reviews at 6h then 9h intervals. Know when to challenge unlawful detention.',
    source: 'PACE 1984 ss.40–44; Code C',
    href: '/PACE',
  },
  {
    title: 'Disclosure and pre-interview advice',
    body: 'Code C para 11.1A — sufficient disclosure to advise. Fairness duty (R v DPP ex p Lee [1999] — cite CPS/disclosure guidance, not invented cases). Chase missing material before advising interview strategy.',
    source: 'PACE Code C; CPS Disclosure Manual',
    href: '/PoliceDisclosureGuide',
  },
  {
    title: 'Silence, prepared statements, and s.34',
    body: 'CJPOA 1994 s.34 — court may draw adverse inference if suspect fails to mention facts later relied on at trial when questioned under caution. Explain risks clearly; thin disclosure often supports no comment.',
    source: 'CJPOA 1994 s.34; CPS adverse inferences guidance',
    href: '/Wiki/adverse-inference-section-34-guide',
  },
  {
    title: 'Identification procedures',
    body: 'PACE Code D — VIPER, parade, group identification; street identification fairness. Know when formal procedures required and when to object.',
    source: 'PACE Code D',
    href: '/PACE',
  },
  {
    title: 'Samples and fingerprints',
    body: 'PACE ss.61–63 — non-intimate vs intimate samples; consent and authorisation. Match sample type to offence and statutory power.',
    source: 'PACE 1984; Code D',
    href: '/PACE',
  },
  {
    title: 'Bail and post-interview',
    body: 'Pre-charge bail under PCSC Act 2022 Sch. 4; RUI; charge and representations. Post-interview client queries on procedure.',
    source: 'PCSC Act 2022 Sch. 4; Home Office pre-charge bail guidance',
    href: '/Wiki/rui-vs-bail-guide',
  },
] as const;

/** Legacy export for tests */
export const CIT_TOPICS = CIT_SYLLABUS_MODULES.map((m) => ({
  title: m.title,
  body: m.body.replace(/&quot;/g, '"').replace(/&apos;/g, "'"),
  source: m.source,
}));

export const CIT_ANSWER_FRAMEWORK = [
  'Identify the issue in one sentence (e.g. &quot;My client is 15 — I need an appropriate adult before interview.&quot;)',
  'State the legal basis (e.g. &quot;Under PACE Code C paragraph 11.15…&quot;)',
  'Say what you would do (e.g. &quot;I would ask the custody sergeant to arrange an AA and refuse interview until one is present.&quot;)',
  'Explain to the client in plain language the options and consequences (including s.34 if advising silence)',
  'Stay in role — do not break character or address the assessor directly',
] as const;

export const CIT_PREP_PLAN = [
  { week: 'Week 1–2', focus: 'PACE Code C and Code D — read actively; summarise detention, disclosure, AA, interview rules' },
  { week: 'Week 3', focus: 'CJPOA ss.34–38 and CPS adverse-inference guidance; practice explaining silence to a lay client aloud' },
  { week: 'Week 4', focus: 'SRA Standards outcomes 1–7; map each to a mock scenario response' },
  { week: 'Week 5', focus: 'Timed audio practice — respond aloud to custody/disclosure/consultation prompts; record yourself' },
  { week: 'Week 6', focus: 'Full mock run under exam conditions; review marking criteria (Content / Confidence / Control)' },
] as const;

export const CIT_EXAM_DAY = [
  'Arrive early with ID; confirm whether assessment is in-person or controlled remote (check provider timetable).',
  'You need a probationary LAA PIN before attempting PSRAS CIT (Datalaw) — not the same as PSQ CIT for solicitors.',
  'Listen to each audio scenario fully before responding; secondary issues (vulnerability, ID) often carry marks.',
  'Speak clearly into the recorder; mumble loses Content marks.',
  'Stay in role-play throughout — breaking character scores zero on that question (Datalaw).',
  'Manage time across scenarios; incomplete responses fail even if earlier answers were strong.',
] as const;

export const CIT_TIPS = [
  'Read each scenario twice before advising — vulnerability and identification issues are often embedded mid-flow.',
  'Structure consultation advice: disclosure → law → options → instructions.',
  'Cite PACE Code paragraphs where relevant; assessors expect practical decisions, not essays.',
  'In interview segments, intervene clearly on oppressive or misleading questions.',
  'Marks weight information gathering from police and client plus advice given (Datalaw).',
  'Complete a varied portfolio before the CIT — weak case experience shows in scenario performance.',
] as const;

export const CIT_PITFALLS = [
  'Missing a vulnerability or appropriate-adult issue hidden in the scenario facts',
  'Advising answer questions when disclosure is inadequate without explaining CJPOA s.34 risk',
  'Ignoring identification fairness under Code D',
  'Breaking role-play or failing to engage with the audio scenario (zero marks — Datalaw)',
  'Theoretical answers without stating what you would actually do at the station',
  'Confusing PSRAS CIT with PSQ CIT (solicitor/barrister/CILEX route — different booking rules)',
] as const;

export const CIT_AFTER = [
  'Assessment organisation notifies pass/fail; resit rules are in provider regulations — check current resit fees on the timetable.',
  'Once CIT and Part B portfolio are both passed, you are fully accredited under PSRAS.',
  'Supervising solicitor notifies DSCC; upgrade from probationary to accredited representative on the Register.',
  'Permanent PSRAS PIN used for DSCC identification; firm claims fees via SaBC (INVC).',
] as const;

export const CIT_FAQS = [
  {
    q: 'Is the PSRAS CIT the same as the PSQ CIT?',
    a: 'No. PSQ CIT is for solicitors, barristers, and CILEX members on the duty solicitor qualification route. PSRAS CIT is for police station representative accreditation. Format is similar (role-play) but booking, PIN requirements, and regulations differ.',
  },
  {
    q: 'Do I need a PIN to sit the CIT?',
    a: 'Yes for PSRAS — Datalaw requires an LAA probationary PIN (issued after Part A and written exam/exemption pass). PSQ candidates without a PIN follow separate rules.',
  },
  {
    q: 'How is the CIT marked?',
    a: 'Datalaw assesses Content, Confidence, and Control — you must score at least 50% on each criterion in each scenario. Cardiff uses the same SRA-regulated scheme; confirm any Cardiff-specific weighting in their handbook.',
  },
  {
    q: 'Is the CIT live actors or audio?',
    a: 'Datalaw&apos;s published format uses audio scenarios with recorded verbal responses. Do not assume a live consultation room with actors unless your provider handbook says so — confirm with Cardiff if you assess there.',
  },
  {
    q: 'Can I sit the CIT before finishing Part B?',
    a: 'Once probationary, Part B and CIT can be taken in either order (Datalaw). Both must pass within PSRA probationary deadlines.',
  },
  {
    q: 'What pass rate should I expect?',
    a: 'Providers do not publish reliable pass-rate statistics suitable for candidates. Prepare using SRA standards, PACE Codes, and portfolio experience rather than assuming an easy pass.',
  },
] as const;

export const CIT_RELATED = [
  { href: '/PrepareForWrittenExam', label: 'Written exam guide', desc: 'First PSRAS assessment stage' },
  { href: '/BuildPortfolioGuide', label: 'Portfolio guide', desc: 'Nine case studies (Part A + Part B)' },
  { href: '/HowToBecomePoliceStationRep', label: 'Full PSRAS guide', desc: 'Written test, portfolio, and CIT stages' },
  { href: '/PACE', label: 'PACE Codes', desc: 'Codes A–H reference hub' },
  { href: '/Wiki/adverse-inference-section-34-guide', label: 'Wiki: s.34 adverse inference', desc: 'Rep-focused practice notes' },
  { href: '/InterviewUnderCaution', label: 'Interview under caution', desc: 'Client-facing interview guide' },
] as const;
