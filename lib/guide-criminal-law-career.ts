export const CAREER_ON_THIS_PAGE = [
  { id: 'who-for', label: 'Who this guide is for' },
  { id: 'work', label: 'What criminal lawyers do' },
  { id: 'legal-aid', label: 'Legal aid context' },
  { id: 'routes', label: 'Qualification routes' },
  { id: 'psrass', label: 'Police station rep route (PSRAS)' },
  { id: 'experience', label: 'Gaining experience' },
  { id: 'do-dont', label: 'Do and don&apos;t' },
  { id: 'faqs', label: 'FAQs' },
  { id: 'related', label: 'Related guides' },
  { id: 'sources', label: 'Official sources' },
] as const;

export const CAREER_ROUTES = [
  {
    title: 'SQE route (principal solicitor path)',
    body: 'Degree or equivalent → SQE1 (functioning legal knowledge) → SQE2 (practical skills) → two years qualifying work experience (QWE) → SRA character and suitability → admission. Criminal law and litigation appear in SQE assessments. See <a href="https://www.sra.org.uk/become-solicitor/sqe/" target="_blank" rel="noopener noreferrer" class="font-semibold underline">SRA SQE guidance</a>.',
  },
  {
    title: 'Solicitor apprenticeship (England only)',
    body: 'Paid apprenticeship combining work and SQE qualification over approximately six years. Not currently available in Wales. See <a href="https://www.lawsociety.org.uk/career-advice/becoming-a-solicitor/qualifying-without-a-degree/apprenticeships" target="_blank" rel="noopener noreferrer" class="font-semibold underline">Law Society apprenticeship guidance</a>.',
  },
  {
    title: 'CILEX / Chartered Legal Executive',
    body: 'Alternative regulated pathway into legal practice including criminal work. Distinct from the solicitor route but can lead to further qualification. See <a href="https://www.cilex.org.uk/" target="_blank" rel="noopener noreferrer" class="font-semibold underline">CILEX</a>.',
  },
  {
    title: 'LPC / training contract (transitional only)',
    body: 'The LPC route is transitional for those who started before SQE reforms. New entrants should assume SQE unless they fall within SRA transitional arrangements.',
  },
] as const;

export const CAREER_DO = [
  'Research routes from official SRA, Law Society, and CILEX sources — not forums alone',
  'Get hands-on experience early: paralegal work, court visits, volunteering, police station exposure',
  'Network at CLSA, LCCSA, and Law Society events — many roles are never advertised',
  'Be realistic about legal aid pay and unsocial hours',
  'Tailor applications to firms that actually do criminal legal aid work',
] as const;

export const CAREER_DONT = [
  'Misrepresent qualifications or experience — the profession is small',
  'Assume passing exams automatically leads to a job',
  'Send generic applications without researching the firm',
  'Ignore CILEX and apprenticeship routes',
  'Pay for expensive courses before securing firm sponsorship where possible',
] as const;

export const CAREER_FAQS = [
  {
    q: 'Do I need a law degree to become a criminal solicitor?',
    a: 'No for the SQE route — you need a degree or equivalent, but it need not be in law. PSRAS similarly does not require a law degree.',
  },
  {
    q: 'What is the difference between a criminal solicitor and a barrister?',
    a: 'Solicitors manage cases, do police station work, and conduct most magistrates&apos; court advocacy. Barristers are specialist advocates, usually instructed for Crown Court trials. Solicitors can obtain higher rights of audience.',
  },
  {
    q: 'How long does qualification take?',
    a: 'SQE routes often take four to six years total depending on QWE timing. PSRAS accreditation is often 12–18 months once you have a supervising firm.',
  },
  {
    q: 'What is a police station representative?',
    a: 'A non-solicitor accredited through PSRAS to advise at custody. A common entry point into criminal defence. See our <a href="/HowToBecomePoliceStationRep" class="font-semibold underline">PSRAS guide</a>.',
  },
  {
    q: 'Is criminal law well paid?',
    a: 'Most criminal defence is legal-aid funded with modest fees compared to commercial law. Police station work uses fixed fees under the Standard Crime Contract. See our <a href="/PoliceStationRates" class="font-semibold underline">rates guide</a>.',
  },
] as const;

export const CAREER_RELATED = [
  { href: '/HowToBecomePoliceStationRep', label: 'PSRAS accreditation guide', desc: 'Become a police station rep in 12–18 months' },
  { href: '/WhatDoesRepDo', label: 'What does a rep do?', desc: 'Police station role explained' },
  { href: '/DutySolicitorVsRep', label: 'Duty solicitor vs rep', desc: 'Compare career paths' },
  { href: '/GetWork', label: 'Get work guide', desc: 'Finding criminal defence roles' },
  { href: '/Firms', label: 'Law firms directory', desc: 'Find firms to apply to' },
] as const;
