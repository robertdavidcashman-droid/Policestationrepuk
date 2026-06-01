export const DSVR_ON_THIS_PAGE = [
  { id: 'who-for', label: 'Who this guide is for' },
  { id: 'key-difference', label: 'The key difference' },
  { id: 'comparison', label: 'Side-by-side comparison' },
  { id: 'duty-solicitor', label: 'What is a duty solicitor?' },
  { id: 'accredited-rep', label: 'What is an accredited rep?' },
  { id: 'together', label: 'How they work together' },
  { id: 'career', label: 'Which career path?' },
  { id: 'faqs', label: 'FAQs' },
  { id: 'related', label: 'Related guides' },
  { id: 'sources', label: 'Official sources' },
] as const;

export const DSVR_COMPARISON = [
  { aspect: 'Qualification', solicitor: 'SQE/LPC route + admission; Police Station Qualification (PSQ) or CLAS for duty work', rep: 'PSRAS: written test, portfolio, Critical Incidents Test (CIT)' },
  { aspect: 'Regulation', solicitor: 'Solicitors Regulation Authority (SRA)', rep: 'PSRAS (SRA-authorised scheme; Cardiff University & Datalaw assess)' },
  { aspect: 'Police station advice', solicitor: 'Full representation at custody', rep: 'Full representation at custody (supervised)' },
  { aspect: 'Duty rota', solicitor: 'Can be named on the duty solicitor rota (subject to contract & PSQ/CLAS)', rep: 'Not on the duty rota; attends when instructed by a firm or duty solicitor' },
  { aspect: 'Court work', solicitor: 'Magistrates&apos; and Crown Court (with appropriate rights)', rep: 'Police station only' },
  { aspect: 'Typical timeline', solicitor: 'Several years via SQE/apprenticeship', rep: 'Often 12–18 months from enrolment to full accreditation' },
  { aspect: 'Employment', solicitor: 'Employed, partner, or consultant at a crime firm', rep: 'Often freelance, covering multiple firms on rota' },
] as const;

export const DSVR_FAQS = [
  {
    q: 'Does the suspect get worse advice from a rep than a solicitor?',
    a: 'At the police station, accredited representatives are assessed to the same competency standard for custody work. Both must meet PSRAS or solicitor qualification requirements. Complex cases may still be attended by a duty solicitor.',
  },
  {
    q: 'Can a rep become a solicitor later?',
    a: 'Yes, but you would need to complete the solicitor qualification route (SQE or transitional LPC) and qualifying work experience. Many reps remain specialists in police station work.',
  },
  {
    q: 'Why do firms use representatives instead of solicitors?',
    a: 'Reps allow firms to cover more stations and hours cost-effectively. The supervising solicitor retains professional responsibility. This is standard in legal-aid criminal defence.',
  },
  {
    q: 'Can I request a solicitor instead of a rep?',
    a: 'You can ask for your own named solicitor. If the firm sends an accredited rep, that is how they deliver the service. For duty solicitor cases, the duty firm decides who attends — you cannot insist on a solicitor rather than a rep.',
  },
] as const;

export const DSVR_RELATED = [
  { href: '/WhatDoesRepDo', label: 'What does a rep do?', desc: 'Day-to-day role at the police station' },
  { href: '/HowToBecomePoliceStationRep', label: 'How to become a rep', desc: 'PSRAS accreditation route' },
  { href: '/CriminalLawCareerGuide', label: 'Criminal law careers', desc: 'SQE, CILEX, and solicitor routes' },
  { href: '/DSCCRegistrationGuide', label: 'DSCC registration', desc: 'Duty solicitor and rep register requirements' },
  { href: '/BeginnersGuide', label: "Beginner's guide", desc: 'How custody advice works for suspects' },
] as const;
