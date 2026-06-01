export const CIT_ON_THIS_PAGE = [
  { id: 'what', label: 'What is the CIT?' },
  { id: 'format', label: 'Assessment format' },
  { id: 'topics', label: 'High-yield topics' },
  { id: 'resources', label: 'Official study resources' },
  { id: 'tips', label: 'Exam day tips' },
  { id: 'pitfalls', label: 'Common pitfalls' },
  { id: 'related', label: 'Related guides' },
  { id: 'sources', label: 'Official sources' },
] as const;

export const CIT_TOPICS = [
  {
    title: 'Vulnerable suspects',
    body: 'PACE Code C requires an appropriate adult for juveniles and for mentally vulnerable adults. Spot subtle welfare flags in scenarios and insist on an AA before interview proceeds.',
    source: 'PACE Code C',
  },
  {
    title: 'Silence and adverse inference',
    body: 'CJPOA 1994 s.34 — understand when a court may draw an inference from failure to mention facts when questioned. Thin disclosure often supports no comment, but you must explain the risks to the client.',
    source: 'CJPOA 1994 s.34; CPS adverse inferences guidance',
  },
  {
    title: 'Identification',
    body: 'PACE Code D — VIPER/video identification vs street identification. Know when formal procedures are required and when to object to unfair identification.',
    source: 'PACE Code D',
  },
  {
    title: 'Samples and fingerprints',
    body: 'PACE ss.61–63 and Code D — non-intimate vs intimate samples, consent, and authorisation. Match the sample type to the offence and statutory power.',
    source: 'PACE 1984; Code D',
  },
  {
    title: 'Detention and reviews',
    body: 'Code C time limits, custody sergeant reviews, and grounds for continued detention. Know when to challenge unlawful detention.',
    source: 'PACE Code C',
  },
] as const;

export const CIT_TIPS = [
  'Read each scenario twice before advising — secondary issues (vulnerability, identification, samples) are often where marks are lost.',
  'Structure consultation advice: disclosure → law → options → instructions.',
  'Cite PACE Code provisions where relevant; assessors expect practical decisions, not essays.',
  'In interview simulations, intervene clearly on oppressive or misleading questions.',
  'Manage time — partial completion across scenarios fails the assessment.',
] as const;

export const CIT_PITFALLS = [
  'Missing a vulnerability or appropriate-adult issue',
  'Advising answer questions when disclosure is inadequate without explaining s.34 risk',
  'Ignoring identification procedure fairness (Code D)',
  'Theoretical answers without stating what you would actually do at the station',
  'Sitting the CIT before a varied portfolio of real attendances',
] as const;

export const CIT_RELATED = [
  { href: '/HowToBecomePoliceStationRep', label: 'Full PSRAS guide', desc: 'Written test, portfolio, and CIT stages' },
  { href: '/BuildPortfolioGuide', label: 'Portfolio guide', desc: 'Part A and Part B case reports' },
  { href: '/PACE', label: 'PACE Codes', desc: 'Codes A–H reference hub' },
  { href: '/Wiki/adverse-inference-section-34-guide', label: 'Wiki: s.34 adverse inference', desc: 'Rep-focused practice notes' },
  { href: '/InterviewUnderCaution', label: 'Interview under caution', desc: 'Client-facing interview guide' },
] as const;
