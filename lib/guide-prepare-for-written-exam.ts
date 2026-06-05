/** Structured content for /PrepareForWrittenExam — verified against Datalaw written exam guide, PSRA 2025, SRA standards. */

export const WRITTEN_EXAM_ON_THIS_PAGE = [
  { id: 'what', label: 'What is the written exam?' },
  { id: 'journey', label: 'Where it sits in PSRAS' },
  { id: 'exemptions', label: 'Exemptions' },
  { id: 'format', label: 'Assessment format' },
  { id: 'syllabus', label: 'Examination topics' },
  { id: 'standards', label: 'SRA competence areas' },
  { id: 'study-plan', label: 'Study plan' },
  { id: 'open-book', label: 'Open-book rules' },
  { id: 'reading', label: 'Suggested reading' },
  { id: 'exam-day', label: 'Exam day tips' },
  { id: 'pitfalls', label: 'Common pitfalls' },
  { id: 'after', label: 'After you pass' },
  { id: 'faqs', label: 'FAQs' },
  { id: 'related', label: 'Related guides' },
  { id: 'sources', label: 'Official sources' },
] as const;

export const WRITTEN_EXAM_FORMAT = [
  { label: 'Duration', value: 'Two hours (Datalaw published format)' },
  { label: 'Questions', value: 'Five questions set; answer any four (25 marks each). A fifth answer is not marked' },
  { label: 'Pass mark', value: 'At least 50% overall (50 marks out of 100)' },
  { label: 'Sitting', value: 'Monthly sittings — dates on provider timetable (Datalaw / Cardiff)' },
] as const;

export const WRITTEN_EXAM_EXEMPTIONS = [
  {
    group: 'Automatic exemptions (PSRA 2025)',
    items: [
      'Qualified solicitors',
      'Barristers',
      'LPC completers',
      'BPTC / Bar Professional Training Course completers',
      'CILEX Fellows or Members who passed Level 6 Professional Higher Diploma in Law including Criminal Law and Litigation papers',
    ],
  },
  {
    group: 'Not exempt (PSRA 2025)',
    items: [
      'Individuals who have only passed the Solicitors Qualifying Examination (SQE) — PSRA 2025 states no exemption for &quot;Solicitors Qualifying Exemption&quot; alone',
      'Paralegals without LPC/BPTC/CILEX criminal litigation papers',
      'Law degrees without LPC/BPTC/SQE qualification as solicitor',
    ],
  },
  {
    group: 'How to confirm',
    items: [
      'Contact the Legal Aid Agency if unsure (Datalaw advises LAA confirmation)',
      'Provide exemption evidence to your assessment organisation before skipping the written stage',
    ],
  },
] as const;

export const WRITTEN_EXAM_TOPICS = [
  {
    title: 'Substantive criminal law',
    body: 'Elements of common offences encountered at custody: theft, assault, public order, drugs, motoring. Identify defences and evidential issues at a practical level.',
    study: 'Common Offences Guide; Blackstone&apos;s Police Operational Handbook; legislation.gov.uk offence sections',
  },
  {
    title: 'Treatment of persons in custody',
    body: 'PACE Code C — detention, reviews, welfare, appropriate adults, medical treatment, rest periods, custody record.',
    study: 'PACE Code C (2023); site /PACE guide',
  },
  {
    title: 'Conduct of police interviews',
    body: 'Caution, right to silence, adverse inference (CJPOA ss.34–38), prepared statements, representative interventions, Code C interview standards.',
    study: 'Interview Under Caution guide; CJPOA; CPS adverse inferences guidance',
  },
  {
    title: 'Evidential significance of facts and silence',
    body: 'What matters for advice: disclosed facts, missing disclosure, inferences, identification evidence, confessions, hearsay basics at station stage.',
    study: 'Police Disclosure Guide; CPIA disclosure duties overview',
  },
  {
    title: 'Police powers outside the station',
    body: 'Stop and search (Code A), arrest (s.24 PACE, Code G), entry/search powers relevant to initial detention context.',
    study: 'PACE ss.1–24; Codes A and G',
  },
  {
    title: 'The criminal process',
    body: 'From arrest through charge, bail/RUI, mode of trial, first appearance — enough to advise at the station and explain next steps.',
    study: 'Criminal Procedure Rules overview; pre-charge bail guidance (PCSC Act 2022)',
  },
] as const;

export const WRITTEN_EXAM_STANDARDS = [
  'Outcome 1 — Role, ethics, and vulnerable groups at the police station',
  'Outcome 2 — Criminal process from arrest to sentence',
  'Outcome 3 — Common crimes and defences',
  'Outcome 4 — Rules of evidence relevant at custody',
  'Outcome 5 — Police station procedure (detention, disclosure, samples, identification)',
  'Outcome 6 — Interview advice and conduct',
  'Outcome 7 — Professional conduct and contract awareness',
] as const;

export const WRITTEN_EXAM_STUDY_PLAN = [
  { week: 'Week 1', focus: 'PACE Act ss.1–76 and Code C — detention, reviews, consultation, interview' },
  { week: 'Week 2', focus: 'CJPOA ss.34–38; caution and adverse inference; read Interview Under Caution guide' },
  { week: 'Week 3', focus: 'Code D identification; ss.61–63 samples; Code A stop/search where relevant' },
  { week: 'Week 4', focus: 'Substantive offences — work through Common Offences Guide; offence elements flashcards' },
  { week: 'Week 5', focus: 'SRA Standards outcomes 1–7 — one outcome per day; write model answers' },
  { week: 'Week 6', focus: 'Timed practice: four questions in two hours using open-book materials only as permitted' },
] as const;

export const WRITTEN_EXAM_OPEN_BOOK = [
  'Datalaw: open-book — textbooks, printed guidelines, and Datalaw online materials purchased from Datalaw',
  'Materials may be highlighted or underlined but not annotated with written notes added for the exam',
  'Time is limited — do not rely on searching every answer from scratch during the two hours',
  'Cardiff: confirm open-book rules in Cardiff handbook — may differ on permitted materials',
] as const;

export const WRITTEN_EXAM_READING = [
  { title: 'Blackstone&apos;s Police Operational Handbook', note: 'Recommended by Datalaw candidates — PNLD operational law' },
  { title: 'Defending Suspects at Police Stations (Ed Cape)', note: 'Practitioner standard text' },
  { title: 'Advising a Suspect at the Police Station (Anthony Edwards)', note: 'Station advice focus' },
  { title: 'Police Station Skills for Legal Advisors (Eric Shepherd)', note: 'Skills-based' },
  { title: 'Law Society Criminal Practitioner Newsletter Special Edition No. 63 (Prof Ed Cape)', note: 'Cited by Datalaw as valuable reading' },
  { title: 'SRA Standards of competence (police station)', note: 'Assessment benchmark — read online free' },
] as const;

export const WRITTEN_EXAM_TIPS = [
  'Answer only four questions — identify your strongest four in the first five minutes',
  'Allocate ~30 minutes per question; leave 10 minutes to review',
  'Structure answers: issue → law → application to facts → conclusion',
  'Cite PACE Code paragraphs and statutory sections — shows Content marks',
  'Explain what you would tell the client in plain English, not just black-letter law',
  'Book the exam only when you have a supervising firm lined up — pass starts the clock toward portfolio work',
] as const;

export const WRITTEN_EXAM_PITFALLS = [
  'Assuming SQE pass alone exempts you — PSRA 2025 does not exempt SQE-only candidates; verify with LAA',
  'Answering all five questions — the fifth is ignored and wastes time',
  'Spending half the exam searching textbooks instead of writing structured answers',
  'Ignoring the rep&apos;s practical role — exam tests advising clients, not academic essays',
  'Skipping Code C detention/review rules — high-frequency exam topics',
  'Sitting the exam before securing supervision — you cannot begin Part A until passed (Datalaw)',
] as const;

export const WRITTEN_EXAM_AFTER = [
  'Receive results via email per provider timetable (Datalaw / Cardiff)',
  'Begin Part A portfolio cases only after written pass confirmed (Datalaw)',
  'Submit Part A for assessment; upon pass, supervising solicitor applies for probationary PIN (ADMIN 2)',
  'Resits: check provider regulations for resit fees and caps — do not assume unlimited attempts',
] as const;

export const WRITTEN_EXAM_FAQS = [
  {
    q: 'Must I pass the written exam before the portfolio?',
    a: 'Yes — Datalaw requires written exam pass before Part A cases begin. PSRA 2025 requires written pass (or exemption) before DSCC probationary registration alongside Part A pass.',
  },
  {
    q: 'What is the pass mark?',
    a: 'Datalaw: at least 50% overall (four questions × 25 marks). Confirm Cardiff pass rules in their handbook if you assess with Cardiff.',
  },
  {
    q: 'Am I exempt if I have a law degree?',
    a: 'A law degree alone does not exempt you. Exemptions are listed in PSRA 2025: solicitors, barristers, LPC, BPTC, and specified CILEX qualifications. SQE-only is not listed as exempt.',
  },
  {
    q: 'Am I exempt if I passed SQE 1 and 2?',
    a: 'PSRA 2025 states there is no exemption for individuals who have passed the &quot;Solicitors Qualifying Exemption&quot; alone. Until you are admitted as a solicitor (or hold LPC/BPTC/CILEX exemption), assume you must sit the written exam — confirm with the LAA.',
  },
  {
    q: 'Is the exam open book?',
    a: 'Datalaw: yes, with restrictions on annotation. Bring permitted texts; practice timed answers so you do not over-research in the exam room.',
  },
  {
    q: 'How often can I sit?',
    a: 'Monthly sittings on provider timetables. Resit rules and fees are in provider regulations — download the current timetable.',
  },
  {
    q: 'Does the written exam test the same material as the CIT?',
    a: 'Both assess against SRA Standards of competence, but the written exam is knowledge/application on paper; the CIT is oral role-play. Written pass is a prerequisite; CIT tests live advice skills.',
  },
] as const;

export const WRITTEN_EXAM_RELATED = [
  { href: '/BuildPortfolioGuide', label: 'Portfolio guide', desc: 'Part A and Part B after written pass' },
  { href: '/PrepareForCIT', label: 'CIT guide', desc: 'Final role-play assessment' },
  { href: '/HowToBecomePoliceStationRep', label: 'Full PSRAS guide', desc: 'Complete accreditation roadmap' },
  { href: '/FindSupervisingSolicitor', label: 'Find a supervising solicitor', desc: 'Secure firm support before you start' },
  { href: '/PACE', label: 'PACE Codes', desc: 'Core exam reference' },
  { href: '/CommonOffencesGuide', label: 'Common Offences Guide', desc: 'Substantive law revision' },
] as const;
