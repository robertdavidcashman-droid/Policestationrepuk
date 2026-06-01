export const HOW_TO_BECOME_SHORT_ON_THIS_PAGE = [
  { id: 'overview', label: 'Overview' },
  { id: 'reality', label: 'Reality check' },
  { id: 'route', label: 'The route at a glance' },
  { id: 'supervision', label: 'Supervision — the main barrier' },
  { id: 'providers', label: 'Assessment organisations' },
  { id: 'next', label: 'Your next steps' },
  { id: 'related', label: 'Related guides' },
  { id: 'sources', label: 'Official sources' },
] as const;

export const HOW_TO_BECOME_ROUTE = [
  { n: 1, title: 'Secure an SCC firm', body: 'A Standard Crime Contract firm must sponsor and supervise you before enrolment.' },
  { n: 2, title: 'Enrol with Cardiff or Datalaw', body: 'Pay enrolment fee and receive your PSRAS candidate handbook.' },
  { n: 3, title: 'Pass the written test', body: 'PACE, criminal procedure, ethics, adverse inference — unless exempt (see full guide).' },
  { n: 4, title: 'Register as probationary', body: 'Firm submits DSCC ADMIN 2; you attend under supervision.' },
  { n: 5, title: 'Complete portfolio', body: 'Part A observations and Part B lead attendances with signed case reports.' },
  { n: 6, title: 'Pass the CIT', body: 'Critical Incidents Test — simulated consultation and interview scenarios.' },
  { n: 7, title: 'Full accreditation', body: 'Added to the Register as fully accredited; freelance work becomes possible.' },
] as const;

export const HOW_TO_BECOME_RELATED = [
  { href: '/HowToBecomePoliceStationRep', label: 'Complete 2026 PSRAS guide', desc: 'In-depth stages, costs, timelines, FAQs' },
  { href: '/FindSupervisingSolicitor', label: 'Find a supervising solicitor', desc: 'How to approach firms' },
  { href: '/BuildPortfolioGuide', label: 'Portfolio guide', desc: 'Case reports and common mistakes' },
  { href: '/PrepareForCIT', label: 'CIT preparation', desc: 'Exam topics and tips' },
  { href: '/GettingStarted', label: 'Getting started', desc: 'Onboarding path for new candidates' },
] as const;
