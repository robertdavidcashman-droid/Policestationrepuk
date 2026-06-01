export const REP_DO_ON_THIS_PAGE = [
  { id: 'who-for', label: 'Who this guide is for' },
  { id: 'overview', label: 'Overview of the role' },
  { id: 'tasks', label: 'Key tasks and responsibilities' },
  { id: 'attendance', label: 'A typical attendance' },
  { id: 'limits', label: 'What reps cannot do' },
  { id: 'faqs', label: 'FAQs' },
  { id: 'related', label: 'Related guides' },
  { id: 'sources', label: 'Official sources' },
] as const;

export const REP_DO_TASKS = [
  {
    title: 'Initial consultation',
    body: 'Speak to the client in private, take instructions, explain rights and the caution, and agree interview strategy. Consultation is legally privileged.',
  },
  {
    title: 'Reviewing disclosure',
    body: 'Obtain and analyse what the police say they hold before interview (PACE Code C, paragraph 11.1A). Identify gaps and chase further detail where needed.',
  },
  {
    title: 'Interview support',
    body: 'Sit with the client during the recorded interview, take notes, intervene on improper questioning, and request breaks for further consultation.',
  },
  {
    title: 'Custody monitoring',
    body: 'Check the custody record, detention authorisation, rights, reviews, and welfare issues (interpreter, appropriate adult, vulnerability).',
  },
  {
    title: 'Liaison',
    body: 'Communicate with custody staff, the officer in the case, and the supervising solicitor. Report outcomes and charging or bail decisions.',
  },
  {
    title: 'Attendance notes',
    body: 'Produce a clear attendance note for the firm — disclosure, advice, interview summary, outcome — for billing and handover to court lawyers.',
  },
] as const;

export const REP_DO_STEPS = [
  { n: 1, title: 'Instruction', body: 'Notification from the Defence Solicitor Call Centre (DSCC) or your instructing firm, often at short notice and unsocial hours.' },
  { n: 2, title: 'Travel to custody', body: 'Attend the custody suite promptly. Firms and contracts expect timely attendance; delays should be recorded.' },
  { n: 3, title: 'Custody record review', body: 'Check detention times, rights, grounds for detention, and any vulnerability flags before seeing the client.' },
  { n: 4, title: 'Disclosure', body: 'Speak to the officer in the case about the allegation and evidence. Record what was and was not disclosed.' },
  { n: 5, title: 'Private consultation', body: 'Take full instructions and advise on answer, no comment, or prepared statement.' },
  { n: 6, title: 'Interview', body: 'Support the client in the recorded interview under caution.' },
  { n: 7, title: 'Post-interview', body: 'Advise on charge, bail, release, or further interview. Update the supervising solicitor.' },
  { n: 8, title: 'Reporting', body: 'Complete the attendance note and any billing fields required by the firm&apos;s legal aid contract.' },
] as const;

export const REP_DO_LIMITS = [
  'Represent clients in the magistrates&apos; or Crown Court (that requires a solicitor or barrister)',
  'Provide unsupervised advice — accredited reps work under solicitor supervision and an LAA crime contract',
  'Conduct litigation or issue court proceedings',
  'Accept instructions directly from the public without a firm (clients request legal aid advice via the police; firms allocate cover)',
] as const;

export const REP_DO_FAQS = [
  {
    q: 'What is a police station representative?',
    a: 'An accredited legal adviser who attends police custody under the Police Station Representatives Accreditation Scheme (PSRAS). They advise suspects at the police station under PACE, supervised by a solicitor whose firm holds a Standard Crime Contract.',
  },
  {
    q: 'Can a police station rep attend court?',
    a: 'No. Court representation requires a solicitor or barrister. Reps prepare the police station record for the firm&apos;s court lawyers.',
  },
  {
    q: 'Is police station advice free?',
    a: 'In most police station cases, legal advice is available free under the legal aid scheme regardless of income. The police must explain how to access advice (PACE s.58; Code C).',
  },
  {
    q: 'What is the difference between a rep and a duty solicitor?',
    a: 'A duty solicitor is a qualified solicitor on the duty rota. An accredited rep is a non-solicitor qualified through PSRAS. Both can advise at the police station; only solicitors (and barristers) represent in court. See our <a href="/DutySolicitorVsRep" class="font-semibold underline">comparison guide</a>.',
  },
  {
    q: 'How do I become a police station representative?',
    a: 'Through PSRAS: enrol with Cardiff University or Datalaw, pass the written test, complete a supervised portfolio, and pass the Critical Incidents Test (CIT). You need an SCC firm to supervise you. See our <a href="/HowToBecomePoliceStationRep" class="font-semibold underline">full 2026 guide</a>.',
  },
] as const;

export const REP_DO_RELATED = [
  { href: '/BeginnersGuide', label: "Beginner's guide", desc: 'Custody lifecycle from arrest to charge or release' },
  { href: '/InterviewUnderCaution', label: 'Interview under caution', desc: 'The caution, rights, and interview options' },
  { href: '/DutySolicitorVsRep', label: 'Duty solicitor vs rep', desc: 'Qualifications and how they work together' },
  { href: '/HowToBecomePoliceStationRep', label: 'How to become a rep', desc: 'Full PSRAS accreditation route' },
  { href: '/GetWork', label: 'Get work guide', desc: 'Finding instructions after accreditation' },
  { href: '/directory', label: 'Find a rep', desc: 'Accredited representatives nationwide' },
] as const;
