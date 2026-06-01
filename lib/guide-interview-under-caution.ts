/** Structured content for /InterviewUnderCaution — sourced from PACE Code C, CJPOA 1994, CPS guidance. */

export const INTERVIEW_ON_THIS_PAGE = [
  { id: 'who-for', label: 'Who this guide is for' },
  { id: 'when', label: 'When interviews happen' },
  { id: 'caution', label: 'The police caution' },
  { id: 'adverse-inference', label: 'Silence and adverse inference' },
  { id: 'process', label: 'What happens step by step' },
  { id: 'rights', label: 'Your rights in interview' },
  { id: 'rep-role', label: 'What your representative does' },
  { id: 'options', label: 'Answer, silence, or statement' },
  { id: 'after', label: 'After the interview' },
  { id: 'faqs', label: 'FAQs' },
  { id: 'related', label: 'Related guides' },
  { id: 'sources', label: 'Official sources' },
] as const;

/** Standard wording used in England & Wales before interview (PACE Code C). */
export const STANDARD_CAUTION =
  'You do not have to say anything. But it may harm your defence if you do not mention when questioned something which you later rely on in court. Anything you do say may be given in evidence.';

export const INTERVIEW_STEPS = [
  {
    n: 1,
    title: 'Recording begins',
    body: 'The interview is audio-recorded and may be video-recorded. Officers identify themselves and you. The custody record should note that legal advice was requested and that your representative is present.',
  },
  {
    n: 2,
    title: 'Caution given and understood',
    body: 'The interviewing officer reads the caution and must satisfy themselves that you understand it. If you do not speak English well, an interpreter should be used. Your representative can ask for the caution to be explained again if needed.',
  },
  {
    n: 3,
    title: 'Questions about the allegation',
    body: 'Police put their account and ask questions. You may answer, decline to answer some or all questions, or read a prepared statement and then answer &quot;no comment&quot; to further questions. Your representative does not answer for you but can intervene on improper questioning.',
  },
  {
    n: 4,
    title: 'Representative interventions',
    body: 'Your rep may interrupt if questions are oppressive, misleading, or outside proper disclosure; request breaks for consultation; raise welfare or vulnerability issues; or ask for clarification. PACE Code C sets standards for breaks and consultation.',
  },
  {
    n: 5,
    title: 'Closing the interview',
    body: 'You are usually asked whether you wish to add or clarify anything. What you say at this stage is still under caution and on the recording.',
  },
  {
    n: 6,
    title: 'Recording sealed',
    body: 'The recording is sealed. You should be offered a copy. Your firm keeps attendance notes; the recording may become evidence if the case proceeds.',
  },
] as const;

export const INTERVIEW_RIGHTS = [
  {
    title: 'Right to silence',
    body: 'You cannot be forced to answer police questions. The caution makes clear that silence is a legal choice — but see the section on adverse inference below.',
  },
  {
    title: 'Right to free legal advice',
    body: 'Under PACE s.58 and Code C, you can consult a solicitor or accredited representative in private before and during interview. In most police station cases this is funded by legal aid without charge to you.',
  },
  {
    title: 'Right to breaks',
    body: 'Code C provides for rest, refreshment, and further consultation with your adviser. Breaks are not unlimited, but you must be treated humanely and given reasonable opportunities to consult in private.',
  },
  {
    title: 'Right to understand the process',
    body: 'You can ask to see the PACE Codes. Your representative should have received sufficient disclosure before interview to advise you meaningfully (Code C, paragraph 11.1A).',
  },
] as const;

export const INTERVIEW_OPTIONS = [
  {
    title: 'Answer questions',
    body: 'You give a full account in response to police questions.',
    when: 'Often considered when disclosure is adequate, the account is straightforward, and your representative assesses that answering will not harm the defence.',
  },
  {
    title: 'No comment',
    body: 'You exercise your right to silence for some or all questions.',
    when: 'Often considered when disclosure is poor, the allegation is serious and the evidence picture unclear, or answering risks inconsistent or incomplete accounts. Silence is not a &quot;trick&quot; — it is a strategic choice with potential adverse-inference consequences that your rep should explain.',
  },
  {
    title: 'Prepared statement',
    body: 'Your representative reads a written statement setting out your account; you then answer &quot;no comment&quot; to further questions.',
    when: 'Often used to put a controlled account on the record while avoiding detailed questioning on matters not yet disclosed. The statement itself can be used in evidence.',
  },
] as const;

export const INTERVIEW_FAQS = [
  {
    q: 'Can the police interview me without a solicitor?',
    a: 'If you have asked for legal advice, interview should not normally proceed until you have had a reasonable opportunity to consult — unless a delay is authorised under PACE. If you decline advice, you may be interviewed without a rep, but the caution still applies.',
  },
  {
    q: 'Will silence make me look guilty?',
    a: 'Silence cannot be treated as proof of guilt on its own. However, in certain circumstances a court may draw an adverse inference if you fail to mention something when questioned that you later rely on at trial. Your representative should explain how this applies to your case.',
  },
  {
    q: 'Can my representative tell the police what I said in consultation?',
    a: 'No. Consultation is legally privileged. Your rep cannot disclose your instructions without your consent.',
  },
  {
    q: 'What if I was not cautioned properly?',
    a: 'The validity and use of answers may depend on whether the caution was given and understood. This is a technical area — your representative or solicitor will advise if there is a challenge to admissibility.',
  },
] as const;

export const INTERVIEW_RELATED = [
  { href: '/PoliceDisclosureGuide', label: 'Police disclosure guide', desc: 'What the police should tell your rep before interview' },
  { href: '/BeginnersGuide', label: "Beginner's guide", desc: 'Full custody lifecycle from arrest to charge or release' },
  { href: '/PACE', label: 'PACE Codes', desc: 'Code C — detention, treatment, and questioning' },
  { href: '/Wiki/no-comment-interviews', label: 'Wiki: no-comment interviews', desc: 'Rep-focused practice notes' },
  { href: '/CommonOffencesGuide', label: 'Common offences guide', desc: 'Elements, defences, and sentencing links' },
  { href: '/directory', label: 'Find a rep', desc: 'Accredited representatives across England & Wales' },
] as const;
