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
  { n: 3, title: 'Pass the written test', body: 'Two-hour exam (four of five questions, 50% pass — Datalaw). Exemptions per PSRA 2025. See Written Exam guide.' },
  { n: 4, title: 'Register as probationary', body: 'After written pass and Part A portfolio pass — ADMIN 2 to DSCC; probationary PIN issued.' },
  { n: 5, title: 'Complete portfolio', body: 'Nine case studies total: Part A (2+2 observed) and Part B (5 unsupervised).' },
  { n: 6, title: 'Pass the CIT', body: 'Audio role-play assessment — Content, Confidence, Control (50% each per scenario).' },
  { n: 7, title: 'Full accreditation', body: 'Added to the Register as fully accredited; freelance work becomes possible.' },
] as const;

export const HOW_TO_BECOME_RELATED = [
  { href: '/HowToBecomePoliceStationRep', label: 'Complete 2026 PSRAS guide', desc: 'In-depth stages, costs, timelines, FAQs' },
  { href: '/PrepareForWrittenExam', label: 'Written exam guide', desc: 'Format, exemptions, study plan' },
  { href: '/FindSupervisingSolicitor', label: 'Find a supervising solicitor', desc: 'How to approach firms' },
  { href: '/BuildPortfolioGuide', label: 'Portfolio guide', desc: 'Nine case studies — Part A and Part B' },
  { href: '/PrepareForCIT', label: 'CIT guide', desc: 'Role-play assessment prep' },
  { href: '/GettingStarted', label: 'Getting started', desc: 'Onboarding path for new candidates' },
] as const;
