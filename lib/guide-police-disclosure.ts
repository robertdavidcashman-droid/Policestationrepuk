/** Structured content for /PoliceDisclosureGuide — sourced from PACE Code C, CPIA 1996, CPS/AG disclosure guidance. */

export const DISCLOSURE_ON_THIS_PAGE = [
  { id: 'who-for', label: 'Who this guide is for' },
  { id: 'what', label: 'What is police disclosure?' },
  { id: 'types', label: 'Basic vs fuller disclosure' },
  { id: 'rights', label: 'Your rights to disclosure' },
  { id: 'rep-use', label: 'How reps use disclosure' },
  { id: 'refusal', label: 'If disclosure is inadequate' },
  { id: 'limits', label: 'Limits and CPIA context' },
  { id: 'faqs', label: 'FAQs' },
  { id: 'related', label: 'Related guides' },
  { id: 'sources', label: 'Official sources' },
] as const;

export const DISCLOSURE_TYPES = [
  {
    title: 'Initial / basic disclosure',
    items: [
      'Nature of the allegation and offence(s) under investigation',
      'Time, date, and location (where relevant)',
      'Identity of complainant or victim (subject to protection rules)',
      'Brief summary of what the police say the evidence shows',
    ],
  },
  {
    title: 'Further disclosure (when provided)',
    items: [
      'Witness accounts or summaries',
      'Descriptions of CCTV, BWV, or digital material',
      'Forensic or medical summaries',
      'Previous interview accounts or documents shown to you',
    ],
  },
] as const;

export const DISCLOSURE_REP_USES = [
  'Assess how strong the prosecution case appears at this stage',
  'Identify gaps, inconsistencies, or missing material worth chasing before interview',
  'Advise whether to answer questions, stay silent, or use a prepared statement',
  'Prepare you for the topics and style of questioning likely in interview',
  'Record inadequate disclosure for later challenge if adverse inference is raised',
] as const;

export const DISCLOSURE_IF_REFUSED = [
  'Ask the officer in the case to provide more detail and note the response',
  'Raise the issue with the custody sergeant if disclosure remains inadequate',
  'Advise silence or a limited prepared statement until enough is known to advise properly',
  'Ensure the custody record and attendance note record what was (and was not) disclosed',
] as const;

export const DISCLOSURE_FAQS = [
  {
    q: 'Are the police required to show me all their evidence before interview?',
    a: 'No. At the police station the legal adviser is entitled to sufficient information to advise you meaningfully (PACE Code C). That is not the same as full trial disclosure under the CPIA regime. Police may withhold some material if disclosure would prejudice the investigation.',
  },
  {
    q: 'Can I see disclosure myself?',
    a: 'Disclosure is normally given to your legal adviser, who then takes your instructions in private consultation. Your rep decides what you need to know to give informed instructions.',
  },
  {
    q: 'What is the difference between police disclosure and CPIA disclosure?',
    a: 'Police station disclosure supports immediate advice and interview strategy. CPIA governs ongoing prosecution disclosure in the magistrates\' and Crown Court. Material can emerge at different stages.',
  },
] as const;

export const DISCLOSURE_RELATED = [
  { href: '/InterviewUnderCaution', label: 'Interview under caution', desc: 'The caution, your rights, and interview options' },
  { href: '/BeginnersGuide', label: "Beginner's guide", desc: 'Custody lifecycle including the disclosure stage' },
  { href: '/PACE', label: 'PACE Codes', desc: 'Code C — paragraph 11.1A and interview procedure' },
  { href: '/Wiki/reading-disclosure', label: 'Wiki: reading disclosure', desc: 'Practice notes for representatives' },
  { href: '/directory', label: 'Find a rep', desc: 'Accredited representatives nationwide' },
] as const;
