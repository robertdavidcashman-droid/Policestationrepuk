/** Topic-specific section content for external-site SEO packages. UK English, general information only. */

export const SITE_META = {
  policestationagent: {
    domain: 'policestationagent.com',
    baseUrl: 'https://www.policestationagent.com',
    name: 'Police Station Agent',
    operator: 'Robert Cashman / Defence Legal Services',
    audience: 'criminal defence firms and clients needing police station representation in Kent and Medway',
    ctas: ['Call Robert Cashman', 'WhatsApp Now', 'Email Instructions', 'Request Police Station Cover'],
    crossLinks: [
      { label: 'Police station rep directory', url: 'https://policestationrepuk.org/directory' },
      { label: 'Attendance note tools', url: 'https://custodynote.com' },
    ],
  },
  psrtrain: {
    domain: 'psrtrain.com',
    baseUrl: 'https://psrtrain.com',
    name: 'PSR Train',
    operator: 'PSR Train',
    audience: 'trainee and accredited police station representatives and criminal practitioners',
    ctas: ['Register Interest', 'Download Training Guide', 'Book Training', 'Join Course Updates'],
    crossLinks: [
      { label: 'Register on the rep directory', url: 'https://policestationrepuk.org/Register' },
      { label: 'Custody note workflow', url: 'https://custodynote.com' },
    ],
  },
  custodynote: {
    domain: 'custodynote.com',
    baseUrl: 'https://custodynote.com',
    name: 'CustodyNote',
    operator: 'CustodyNote',
    audience: 'criminal solicitors, duty solicitors, and police station representatives',
    ctas: ['Try CustodyNote', 'Join Waitlist', 'Request Demo', 'Download Template'],
    crossLinks: [
      { label: 'Police station training', url: 'https://psrtrain.com' },
      { label: 'Rep directory', url: 'https://policestationrepuk.org/directory' },
    ],
  },
};

const DISCLAIMER =
  'General information only. Not legal advice on specific facts. No guarantee of outcome. For advice on your circumstances, instruct a qualified criminal defence lawyer.';

/** @returns {{ intro: string, sections: { h2: string, body: string }[], faq: { q: string, a: string }[] }} */
export function topicContent(siteKey, slug, title, keyword) {
  const base = TOPICS[slug] ?? defaultTopic(title, keyword, siteKey);
  return base;
}

function defaultTopic(title, keyword, siteKey) {
  const aud =
    siteKey === 'policestationagent'
      ? 'criminal defence firms'
      : siteKey === 'psrtrain'
        ? 'police station representatives in training'
        : 'criminal practitioners preparing attendance notes';
  return {
    intro: `${title} is a practical topic for ${aud} working in England and Wales. This guide explains professional context, preparation, and documentation — without case-specific advice.`,
    sections: [
      {
        h2: 'Professional context under PACE',
        body: `Police station work in England and Wales is governed by the Police and Criminal Evidence Act 1984 (PACE) and the Codes of Practice. Whether you are advising on ${keyword}, the same principles apply: identify the client's status, review disclosure, take clear instructions, and record advice accurately. The instructing firm retains conduct of the case; the representative's role is to protect the client's rights and provide a reliable account of what occurred.`,
      },
      {
        h2: 'Preparation before attendance',
        body: `Before attendance, gather the DSCC reference, custody record details, offence summary, and any prior convictions the firm holds. Confirm billing route and who will approve interview strategy. If the client is a youth or may be vulnerable, note this early — it affects appropriate adult requirements and interview safeguards.`,
      },
      {
        h2: 'At the police station',
        body: `On arrival, review the custody record, confirm legal representation is recorded, and request disclosure sufficient to advise. Take time for a private consultation. Advice on interview strategy (answered interview, prepared statement, or no comment) depends on the evidence and instructions — not on generic templates.`,
      },
      {
        h2: 'Documentation and handover',
        body: `Attendance notes should be structured, timed, and written for the supervising solicitor and court if needed. Record advice given, the client's decision, and any significant events in the interview. A clear handover reduces risk for the firm and the client.`,
      },
      {
        h2: 'When to escalate',
        body: `Escalate to a supervising solicitor where disclosure is inadequate, bail conditions are disputed, the client lacks capacity, or an interview is proposed without sufficient preparation time. Out-of-hours attendances still require the same professional standards.`,
      },
    ],
    faq: [
      { q: 'Is this legal advice?', a: 'No. This is general professional information for practitioners and firms.' },
      { q: 'Does this apply across the UK?', a: 'This material focuses on England and Wales police station practice.' },
      { q: 'Can outcomes be guaranteed?', a: 'No practitioner can guarantee a particular outcome at a police station.' },
    ],
  };
}

const TOPICS = {
  'what-happens-police-station-interview': {
    intro:
      'A police station interview under caution is a formal investigative step. Clients and instructing firms often need a plain explanation of the process before attendance — not case-specific advice.',
    sections: [
      {
        h2: 'What happens when someone is interviewed under caution',
        body: `After arrest or voluntary attendance, the police may conduct a recorded interview under caution. The caution explains that answers may be used in evidence. The suspect has the right to free legal advice at the police station. A solicitor or accredited police station representative attends, reviews disclosure, takes instructions in private, and advises on whether to answer questions, put forward a prepared statement, or go no comment.`,
      },
      {
        h2: 'Voluntary interview vs custody interview',
        body: `Voluntary interviews may take place at a police station without arrest. The same caution and recording standards often apply. Clients sometimes assume voluntary means informal — firms should explain that legal representation remains important and that attendance is not necessarily "optional" in a practical sense.`,
      },
      {
        h2: 'Role of the legal representative',
        body: `The representative protects the client's rights, ensures PACE compliance, and provides a clear record for the instructing firm. They do not decide guilt or innocence. Advice is based on disclosure, instructions, and law — including adverse inference considerations where a no comment interview is proposed.`,
      },
      {
        h2: 'After the interview',
        body: `The client may be released under investigation (RUI), bailed with or without conditions, charged, or released without charge. The attendance note and any handover to the firm should set out next steps and bail dates clearly.`,
      },
      {
        h2: 'Instructing cover in Kent and Medway',
        body: `Firms needing police station attendance cover should provide custody details, client name, offence, and billing route as early as possible. Robert Cashman / Defence Legal Services accepts instructions for Kent and Medway custody suites — contact via the site for availability.`,
      },
    ],
    faq: [
      { q: 'Should everyone answer police questions?', a: 'No single approach suits every case. Advice depends on disclosure and instructions from a qualified lawyer.' },
      { q: 'Is a voluntary interview less serious?', a: 'It can still be used in evidence. Legal advice before attendance is prudent.' },
      { q: 'Who can attend with the client?', a: 'A solicitor or accredited police station representative; youths and vulnerable persons may require an appropriate adult.' },
    ],
  },
  'how-to-write-police-station-attendance-note': {
    intro:
      'A police station attendance note is the primary record of what occurred, what was advised, and what the client decided. Good notes protect the client, the firm, and the professional.',
    sections: [
      {
        h2: 'Purpose of the attendance note',
        body: `The note supports billing, handover to the supervising solicitor, and future court proceedings. It should be written so another lawyer can understand the case without guessing. Include times, locations, names where known, and references to the custody record and DSCC number.`,
      },
      {
        h2: 'Structure that works in practice',
        body: `Many practitioners use: attendance details; custody record summary; disclosure received; private consultation; advice given; interview record (if any); outcome (bail/RUI/charge); handover points. Each section should be dated and timed.`,
      },
      {
        h2: 'Interview recording in notes',
        body: `You are not required to transcribe every word. Record significant questions, the client's responses or "no comment", interventions, and breaks. Note any concerns about PACE compliance or welfare.`,
      },
      {
        h2: 'Common gaps to avoid',
        body: `Missing advice summaries, unclear bail conditions, or failure to record who authorised strategy create risk. If advice changed after further disclosure, say so explicitly.`,
      },
      {
        h2: 'Tools and templates',
        body: `Structured templates and workflow tools (such as CustodyNote) can speed consistent note-taking without replacing professional judgment. Templates should match your firm's file standards.`,
      },
    ],
    faq: [
      { q: 'How long should a note be?', a: 'Long enough to be complete; avoid unnecessary repetition.' },
      { q: 'Should I record everything verbatim?', a: 'Usually no — focus on material events and advice.' },
      { q: 'When should the note be finished?', a: 'As soon as practicable after attendance; same day where possible.' },
    ],
  },
  'how-to-become-police-station-representative': {
    intro:
      'Becoming an accredited police station representative in England and Wales involves training, assessment, and registration with a criminal defence organisation. This is a career path into freelance and employed police station work.',
    sections: [
      {
        h2: 'What a police station representative does',
        body: `Accredited representatives advise and assist clients at police stations under the supervision of a solicitor. Work includes reviewing custody records, advising on interview strategy, and attending interviews. It is demanding, often out-of-hours work with serious consequences for clients.`,
      },
      {
        h2: 'Accreditation route (PSRAS)',
        body: `The Police Station Representatives Accreditation Scheme (PSRAS) is the standard pathway. Candidates complete training, a portfolio, and a critical incident test. Requirements evolve — check current Law Society and accreditation body guidance before starting.`,
      },
      {
        h2: 'Skills you will need',
        body: `Clear communication, calm under pressure, accurate note-taking, and understanding of PACE and evidence basics. Client care and professionalism matter as much as legal knowledge at this stage.`,
      },
      {
        h2: 'Finding work after accreditation',
        body: `Many reps join firm panels, work freelance, or list on directories such as PoliceStationRepUK. Maintaining availability, clear communication, and reliable attendance notes helps secure repeat instructions.`,
      },
      {
        h2: 'Training resources',
        body: `Practical training on PACE interviews, caution, youth and vulnerable suspects, and note-taking supports accreditation preparation. Structured courses and mock scenarios reduce common early mistakes.`,
      },
    ],
    faq: [
      { q: 'Do I need a law degree?', a: 'Not necessarily for PSRAS; check current scheme requirements.' },
      { q: 'Can reps conduct cases in court?', a: 'Police station accreditation is separate from higher rights of audience.' },
      { q: 'Is work mainly out of hours?', a: 'A significant proportion is evenings, nights, and weekends.' },
    ],
  },
};

export function expandSections(sections) {
  return sections
    .map(
      (s) =>
        `## ${s.h2}\n\n${s.body}\n\n` +
        `Practitioners should keep notes contemporaneous and seek supervising solicitor input where case complexity exceeds accreditation scope. ` +
        `Check the custody record, PACE clock, and welfare updates on arrival. ` +
        `Confirm the instructing firm’s billing route and named contact before interview. ` +
        `Where the client is a youth or may be vulnerable, record appropriate adult and safeguard steps clearly. ` +
        `References to PACE, DSCC, and custody records should be checked against live material at attendance — local custody practice can vary.`,
    )
    .join('\n');
}

export function wordCount(text) {
  return text.split(/\s+/).filter(Boolean).length;
}
