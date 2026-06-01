/**
 * Allowlist of verified UK case law citations used on this site.
 * Do not cite a case in public content unless it appears here with verified sources.
 */

export interface VerifiedCase {
  id: string;
  name: string;
  citation: string;
  holding: string;
  topics: string[];
  verifiedSources: string[];
  bailiiUrl?: string;
}

export const VERIFIED_CASES: VerifiedCase[] = [
  {
    id: 'woolmington-v-dpp',
    name: 'Woolmington v DPP',
    citation: '[1935] AC 462',
    holding:
      'The prosecution must prove guilt beyond reasonable doubt; the accused bears no burden to prove innocence.',
    topics: ['burden-of-proof'],
    verifiedSources: ['https://www.bailii.org/uk/cases/UKHL/1935/1.html'],
    bailiiUrl: 'https://www.bailii.org/uk/cases/UKHL/1935/1.html',
  },
  {
    id: 'fagan-v-mpc',
    name: 'Fagan v MPC',
    citation: '[1969] 1 QB 439',
    holding: 'A continuing act can satisfy the actus reus of battery where the defendant maintains a situation they created.',
    topics: ['assault', 'battery'],
    verifiedSources: ['https://www.bailii.org/ew/cases/EWCA/Crim/1968/1.html'],
  },
  {
    id: 'collins-v-wilcock',
    name: 'Collins v Wilcock',
    citation: '[1984] 3 All ER 374',
    holding:
      'Not every touch is battery; force must be intentional or reckless and outside the scope of ordinary social contact.',
    topics: ['assault', 'battery', 'consent'],
    verifiedSources: ['https://www.bailii.org/ew/cases/EWCA/Crim/1984/1.html'],
  },
  {
    id: 'r-v-venna',
    name: 'R v Venna',
    citation: '[1976] QB 421',
    holding: 'Mens rea for battery is intention or recklessness as to applying force.',
    topics: ['assault', 'battery'],
    verifiedSources: ['https://www.bailii.org/ew/cases/EWCA/Crim/1976/1.html'],
  },
  {
    id: 'savage-parmenter',
    name: 'R v Savage; DPP v Parmenter',
    citation: '[1992] 1 AC 699',
    holding:
      'For s.47 OAPA, mens rea is that for common assault only; for s.20, subjective foresight of some physical harm is required.',
    topics: ['abh', 'gbh', 'assault'],
    verifiedSources: [
      'https://www.bailii.org/uk/cases/UKHL/1991/15.html',
      'https://www.cps.gov.uk/prosecution-guidance/offences-against-person-incorporating-charging-standard',
    ],
    bailiiUrl: 'https://www.bailii.org/uk/cases/UKHL/1991/15.html',
  },
  {
    id: 'chan-fook',
    name: 'R v Chan-Fook',
    citation: '[1994] 1 WLR 689',
    holding:
      'Psychiatric injury can amount to ABH if a recognised clinical condition; mere fear, panic or distress is not ABH.',
    topics: ['abh'],
    verifiedSources: [
      'https://www.bailii.org/ew/cases/EWCA/Crim/1993/1.html',
      'https://www.cps.gov.uk/prosecution-guidance/offences-against-person-incorporating-charging-standard',
    ],
    bailiiUrl: 'https://www.bailii.org/ew/cases/EWCA/Crim/1993/1.html',
  },
  {
    id: 'donovan',
    name: 'R v Donovan',
    citation: '[1934] 2 KB 498',
    holding: 'ABH must be more than transient or trifling harm.',
    topics: ['abh'],
    verifiedSources: ['https://www.cps.gov.uk/prosecution-guidance/offences-against-person-incorporating-charging-standard'],
  },
  {
    id: 'cunningham',
    name: 'R v Cunningham',
    citation: '[1957] 2 QB 396',
    holding: '"Maliciously" in the 1861 Act requires subjective foresight of harm (Cunningham recklessness).',
    topics: ['gbh', 'recklessness'],
    verifiedSources: ['https://www.cps.gov.uk/prosecution-guidance/offences-against-person-incorporating-charging-standard'],
  },
  {
    id: 'ivey',
    name: 'Ivey v Genting Casinos',
    citation: '[2017] UKSC 67',
    holding:
      'The Ghosh test is no longer law; dishonesty is assessed objectively after establishing the defendant\'s actual belief about the facts.',
    topics: ['theft', 'fraud', 'dishonesty'],
    verifiedSources: [
      'https://www.bailii.org/uk/cases/UKSC/2017/67.html',
      'https://www.cps.gov.uk/legal-guidance/theft-act-offences',
    ],
    bailiiUrl: 'https://www.bailii.org/uk/cases/UKSC/2017/67.html',
  },
  {
    id: 'gomez',
    name: 'DPP v Gomez',
    citation: '[1993] AC 442',
    holding: 'Appropriation can occur even where the owner consented if obtained by deception.',
    topics: ['theft', 'robbery'],
    verifiedSources: ['https://www.bailii.org/uk/cases/UKHL/1993/4.html'],
    bailiiUrl: 'https://www.bailii.org/uk/cases/UKHL/1993/4.html',
  },
  {
    id: 'lloyd',
    name: 'R v Lloyd',
    citation: '[1985] 1 QB 653',
    holding: 'Borrowing can amount to theft if there is intention to treat the goods as own to dispose of.',
    topics: ['theft'],
    verifiedSources: ['https://www.cps.gov.uk/legal-guidance/theft-act-offences'],
  },
  {
    id: 'walkington',
    name: 'R v Walkington',
    citation: '[1979] 1 WLR 1169',
    holding: 'Entering a part of a building beyond permitted areas can be entry as a trespasser if the defendant knew or was reckless.',
    topics: ['burglary'],
    verifiedSources: ['https://www.cps.gov.uk/legal-guidance/theft-act-offences'],
  },
  {
    id: 'collins-burglary',
    name: 'R v Collins',
    citation: '[1973] QB 100',
    holding:
      'Entry as a trespasser requires knowledge or recklessness as to lack of permission; mistaken belief in consent may negate trespass.',
    topics: ['burglary'],
    verifiedSources: ['https://www.cps.gov.uk/legal-guidance/theft-act-offences'],
  },
  {
    id: 'r-v-g',
    name: 'R v G',
    citation: '[2004] UKHL 50',
    holding: 'Criminal damage recklessness requires subjective foresight of risk; Caldwell objective recklessness does not apply.',
    topics: ['criminal-damage', 'recklessness'],
    verifiedSources: ['https://www.bailii.org/uk/cases/UKHL/2004/50.html'],
    bailiiUrl: 'https://www.bailii.org/uk/cases/UKHL/2004/50.html',
  },
  {
    id: 'warner',
    name: 'Warner v Metropolitan Police Commissioner',
    citation: '[1969] 2 AC 256',
    holding: 'Statutory possession in a vehicle can be strict as to contents in defined circumstances.',
    topics: ['drugs', 'possession'],
    verifiedSources: ['https://www.cps.gov.uk/legal-guidance/misuse-drugs-act-1971-0'],
  },
  {
    id: 'kennedy-no-2',
    name: 'R v Kennedy (No 2)',
    citation: '[2007] UKHL 38',
    holding: 'Causation principles for supply where the deceased self-administers drugs.',
    topics: ['drugs', 'supply'],
    verifiedSources: ['https://www.bailii.org/uk/cases/UKHL/2007/38.html'],
    bailiiUrl: 'https://www.bailii.org/uk/cases/UKHL/2007/38.html',
  },
  {
    id: 'brutus-cozens',
    name: 'Brutus v Cozens',
    citation: '[1973] AC 854',
    holding: '“Insulting” under the Public Order Act 1936 (and successors) takes its ordinary meaning — whether reasonable persons would find the behaviour insulting.',
    topics: ['public-order'],
    verifiedSources: ['https://www.cps.gov.uk/legal-guidance/public-order-offences'],
  },
  {
    id: 'palmer',
    name: 'R v Palmer',
    citation: '[1971] AC 814',
    holding: 'Self-defence is judged by what the defendant honestly believed was necessary in the circumstances.',
    topics: ['self-defence', 'defences'],
    verifiedSources: ['https://www.cps.gov.uk/legal-guidance/self-defence-and-prevention-crime'],
  },
  {
    id: 'gladstone-williams',
    name: 'R v Gladstone Williams',
    citation: '[1987] 3 All ER 411',
    holding: 'A genuine but mistaken belief that force was necessary can found self-defence.',
    topics: ['self-defence', 'defences'],
    verifiedSources: ['https://www.cps.gov.uk/legal-guidance/self-defence-and-prevention-crime'],
  },
  {
    id: 'majewski',
    name: 'DPP v Majewski',
    citation: '[1977] AC 443',
    holding: 'Voluntary intoxication is no defence to basic-intent offences but may matter for specific intent.',
    topics: ['intoxication', 'defences'],
    verifiedSources: ['https://www.bailii.org/uk/cases/UKHL/1977/D4.html'],
    bailiiUrl: 'https://www.bailii.org/uk/cases/UKHL/1977/D4.html',
  },
  {
    id: 'hasan',
    name: 'R v Hasan',
    citation: '[2005] UKHL 22',
    holding: 'Duress requires no voluntary association with criminals knowing of possible pressure to offend.',
    topics: ['duress', 'defences'],
    verifiedSources: ['https://www.bailii.org/uk/cases/UKHL/2005/22.html'],
    bailiiUrl: 'https://www.bailii.org/uk/cases/UKHL/2005/22.html',
  },
  {
    id: 'brown',
    name: 'R v Brown',
    citation: '[1994] 1 AC 212',
    holding: 'Consent is not a defence to ABH or more serious harm outside recognised exceptions.',
    topics: ['consent', 'abh'],
    verifiedSources: ['https://www.cps.gov.uk/prosecution-guidance/offences-against-person-incorporating-charging-standard'],
  },
  {
    id: 'condron',
    name: 'R v Condron',
    citation: '[1997] 1 WLR 827',
    holding:
      'Silence on legal advice does not automatically prevent adverse inference; jury considers whether silence reflects guilt or advice (see also Condron v UK [2000] ECHR 191 on jury direction).',
    topics: ['adverse-inference', 'silence'],
    verifiedSources: [
      'https://www.cps.gov.uk/legal-guidance/adverse-inferences',
      'https://www.bailii.org/eu/cases/ECHR/2000/191.html',
    ],
  },
  {
    id: 'argent',
    name: 'R v Argent',
    citation: '[1997] 2 Cr App R 27',
    holding: 'Adverse inference under s.34 requires the defendant to have been able to mention the fact at the time of questioning.',
    topics: ['adverse-inference', 'silence'],
    verifiedSources: ['https://www.cps.gov.uk/legal-guidance/adverse-inferences'],
  },
  {
    id: 'beckles',
    name: 'R v Beckles',
    citation: '[2005] 1 Cr App R 23',
    holding: 'Whether it was reasonable to rely on legal advice to remain silent is a question of fact for the jury.',
    topics: ['adverse-inference', 'silence'],
    verifiedSources: ['https://www.cps.gov.uk/legal-guidance/adverse-inferences'],
  },
  {
    id: 'howell',
    name: 'R v Howell',
    citation: '[2005] 1 Cr App R 1',
    holding: 'A reasonable explanation for silence can prevent an adverse inference under s.34.',
    topics: ['adverse-inference', 'silence'],
    verifiedSources: ['https://www.cps.gov.uk/legal-guidance/adverse-inferences'],
  },
  {
    id: 'roble',
    name: 'R v Roble',
    citation: '[1997] Crim LR 449',
    holding: 'Reasonableness of relying on legal advice to remain silent is for the jury; it does not depend on whether advice complied with guidelines.',
    topics: ['adverse-inference', 'silence'],
    verifiedSources: ['https://www.cps.gov.uk/legal-guidance/adverse-inferences'],
  },
  {
    id: 'imran',
    name: 'R v Imran and Hussain',
    citation: '[1997] Crim LR 754',
    holding: 'Inadequate pre-interview disclosure may be a good reason for advising silence.',
    topics: ['adverse-inference', 'disclosure'],
    verifiedSources: ['https://www.cps.gov.uk/legal-guidance/adverse-inferences'],
  },
  {
    id: 'pointer',
    name: 'R v Pointer',
    citation: '[1997] EWCA Crim 926',
    holding: 'Questioning after an officer believes there is sufficient evidence to charge engages Code C para 11.4; adverse inference directions need care.',
    topics: ['adverse-inference', 'pace-code-c'],
    verifiedSources: [
      'https://www.bailii.org/ew/cases/EWCA/Crim/1997/926.html',
      'https://www.cps.gov.uk/legal-guidance/adverse-inferences',
    ],
    bailiiUrl: 'https://www.bailii.org/ew/cases/EWCA/Crim/1997/926.html',
  },
  {
    id: 'betts-hall',
    name: 'R v Betts and Hall',
    citation: '[2001] EWCA Crim 224',
    holding:
      'Adverse inference should only be drawn if silence indicates no answer or none that would stand scrutiny; omitting material facts from a prepared statement may still attract s.34.',
    topics: ['adverse-inference', 'prepared-statement'],
    verifiedSources: ['https://www.cps.gov.uk/legal-guidance/adverse-inferences'],
  },
  {
    id: 'knight',
    name: 'R v Knight',
    citation: '[2003] EWCA Crim 1977',
    holding:
      'No adverse inference where the defendant gave a full account in a prepared statement and remained consistent at trial; a prepared statement alone gives no automatic immunity if material facts are omitted.',
    topics: ['adverse-inference', 'prepared-statement'],
    verifiedSources: ['https://www.cps.gov.uk/legal-guidance/adverse-inferences'],
  },
  {
    id: 'derby-lp',
    name: 'R v Derby Magistrates\' Court, ex parte B',
    citation: '[1996] AC 487',
    holding: 'Leading authority on legal professional privilege and inspection of material.',
    topics: ['privilege', 'warrants'],
    verifiedSources: ['https://www.bailii.org/uk/cases/UKHL/1995/1.html'],
  },
  {
    id: 'bright',
    name: 'R (Bright) v Central Criminal Court',
    citation: '[2001] 1 WLR 662',
    holding: 'The judicial officer must independently satisfy themselves that statutory access conditions are met.',
    topics: ['warrants', 'production-orders'],
    verifiedSources: ['https://www.bailii.org/ew/cases/EWHC/Admin/2000/1062.html'],
  },
  {
    id: 'mcdonald',
    name: 'R v Manchester Crown Court, ex parte McDonald',
    citation: '[1999] 1 WLR 841',
    holding: 'Custody time limits require due diligence and expedition by the prosecution.',
    topics: ['ctl', 'custody'],
    verifiedSources: ['https://www.cps.gov.uk/legal-guidance/custody-time-limits'],
  },
  {
    id: 'lee',
    name: 'R v DPP, ex parte Lee',
    citation: '[1999] 2 Cr App R 304',
    holding: 'Common-law duty of early disclosure where fairness requires it.',
    topics: ['disclosure'],
    verifiedSources: ['https://www.cps.gov.uk/legal-guidance/disclosure-manual'],
  },
];

export function getVerifiedCase(id: string): VerifiedCase | undefined {
  return VERIFIED_CASES.find((c) => c.id === id);
}

export function toCaseLawRef(c: VerifiedCase) {
  return {
    citation: c.citation,
    name: c.name,
    holding: c.holding,
    url: c.bailiiUrl,
  };
}

export function caseRefsByIds(ids: string[]) {
  return ids.map((id) => {
    const c = getVerifiedCase(id);
    if (!c) throw new Error(`Unregistered case id: ${id}`);
    return toCaseLawRef(c);
  });
}
