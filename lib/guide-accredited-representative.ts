export const ACCREDITED_ON_THIS_PAGE = [
  { id: 'what', label: 'What is an accredited representative?' },
  { id: 'psrass', label: 'PSRAS and assessment organisations' },
  { id: 'register', label: 'Police Station Register' },
  { id: 'probationary', label: 'Probationary vs fully accredited' },
  { id: 'ongoing', label: 'Ongoing requirements' },
  { id: 'faqs', label: 'FAQs' },
  { id: 'related', label: 'Related guides' },
  { id: 'sources', label: 'Official sources' },
] as const;

export const ACCREDITED_FAQS = [
  {
    q: 'Who accredits police station representatives?',
    a: 'The Police Station Representatives Accreditation Scheme (PSRAS) is authorised by the SRA. Cardiff University and Datalaw are the assessment organisations. The Legal Aid Agency maintains the Police Station Register via the Defence Solicitor Call Centre (DSCC).',
  },
  {
    q: 'What is the difference between probationary and fully accredited?',
    a: 'After the written test, you are added to the Register as a probationary representative and must work under direct supervision. After portfolio sign-off and passing the CIT, you become fully accredited and can work with reduced supervision subject to firm and contract rules.',
  },
  {
    q: 'Can I work freelance once accredited?',
    a: 'Fully accredited reps often work freelance for multiple SCC firms. You still need a firm to instruct you and carry you on their contract. Probationary reps cannot freelance independently.',
  },
  {
    q: 'Do I need to re-accredit?',
    a: 'You remain on the Register subject to firm engagement, contract compliance, and DSCC/LAA requirements. Firms must notify changes. Check current SCC 2025 and PSRAS guidance for standing eligibility rules.',
  },
] as const;

export const ACCREDITED_RELATED = [
  { href: '/HowToBecomePoliceStationRep', label: 'How to become a rep', desc: 'Full step-by-step PSRAS route' },
  { href: '/BuildPortfolioGuide', label: 'Portfolio guide', desc: 'Part A and Part B evidence' },
  { href: '/PrepareForCIT', label: 'CIT preparation', desc: 'Final assessment guide' },
  { href: '/DSCCRegistrationGuide', label: 'DSCC registration', desc: 'Register forms and engaged requirements' },
  { href: '/GetWork', label: 'Get work', desc: 'Finding instructions after accreditation' },
] as const;
