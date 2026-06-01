export const PORTFOLIO_ON_THIS_PAGE = [
  { id: 'overview', label: 'Portfolio overview' },
  { id: 'part-a', label: 'Part A — observation' },
  { id: 'part-b', label: 'Part B — probationary practice' },
  { id: 'case-report', label: 'What goes in a case report' },
  { id: 'tips', label: 'Tips for success' },
  { id: 'mistakes', label: 'Common mistakes' },
  { id: 'related', label: 'Related guides' },
  { id: 'sources', label: 'Official sources' },
] as const;

export const PORTFOLIO_CASE_SECTIONS = [
  { title: 'Client and case details', body: 'Anonymised client (e.g. &quot;Mr X&quot;), age, offence, custody reference. Never use real names or identifying details.' },
  { title: 'Disclosure analysis', body: 'What the police disclosed, what was missing, what you chased, and why it mattered for advice.' },
  { title: 'Legal advice and strategy', body: 'Answer, no comment, or prepared statement — with reasons tied to disclosure and CJPOA s.34 if relevant.' },
  { title: 'The interview', body: 'Dynamics, interventions, client performance, and whether the strategy held.' },
  { title: 'Reflection', body: 'What went well, what you would do differently. Assessors look for self-awareness and learning.' },
] as const;

export const PORTFOLIO_TIPS = [
  'Keep contemporaneous notes at every attendance — you cannot reconstruct disclosure accurately weeks later.',
  'Seek breadth: violence, dishonesty, drugs, road traffic, domestic, youth, vulnerability, identification, adverse inference.',
  'Act on supervisor feedback before submitting — first submissions rarely pass without amendment.',
  'Check your assessment organisation handbook (Cardiff or Datalaw) for current minimum numbers and templates.',
  'Treat portfolio quality as CIT preparation — weak case reports mean weak scenario performance.',
] as const;

export const PORTFOLIO_MISTAKES = [
  'Rushing attendances to hit numbers without reflective write-ups',
  'Only doing one offence type (e.g. all shop theft)',
  'Copy-pasting advice sections without case-specific analysis',
  'Failing to document supervisor sign-off on each entry',
  'Submitting before disclosure and interview strategy are properly explained',
] as const;

export const PORTFOLIO_RELATED = [
  { href: '/HowToBecomePoliceStationRep', label: 'Full PSRAS guide', desc: 'Complete accreditation route and timelines' },
  { href: '/PrepareForCIT', label: 'Prepare for the CIT', desc: 'Final assessment topics and tips' },
  { href: '/FindSupervisingSolicitor', label: 'Find a supervising solicitor', desc: 'The main barrier to starting' },
  { href: '/PoliceDisclosureGuide', label: 'Disclosure guide', desc: 'What to record from the officer in the case' },
  { href: '/InterviewUnderCaution', label: 'Interview guide', desc: 'Interview strategy reference' },
] as const;

/** Minimums vary by provider — always verify current Cardiff/Datalaw handbooks. */
export const PORTFOLIO_PART_A = [
  'Minimum observed attendances with supervisor leading (check your handbook — often around 6).',
  'You take detailed notes; focus on procedure, disclosure, and advice.',
  'Supervisor signs each observation entry.',
] as const;

export const PORTFOLIO_PART_B = [
  'Minimum attendances where you lead advice and interview, supervised (often around 10+; many candidates need 15–25 for breadth).',
  'Must cover varied offence types and issues (vulnerability, identification, no comment, etc.).',
  'Each entry is a full reflective case report, signed by your supervisor.',
] as const;
