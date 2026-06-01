/**
 * Common offences reference for police station representatives.
 *
 * Case citations are imported from lib/case-law-registry.ts only.
 * Do not add free-text case citations here — register and verify first.
 */

import { caseRefsByIds, toCaseLawRef, getVerifiedCase } from '@/lib/case-law-registry';

export interface CaseLawRef {
  citation: string;
  name: string;
  holding: string;
  url?: string;
}

export interface OffenceGuideEntry {
  id: string;
  title: string;
  statute: string;
  legislationUrl: string;
  triable: string;
  maxPenalty: string;
  sentencingGuidelineUrl: string;
  sentencingNote: string;
  actusReus: string[];
  mensRea: string[];
  keyCases: CaseLawRef[];
  commonDefences: string[];
  stationNotes: string;
}

export interface DefenceGuideEntry {
  id: string;
  title: string;
  summary: string;
  keyCases: CaseLawRef[];
  stationNotes: string;
}

export const CRIMINAL_LAW_PRINCIPLES = {
  actusReus:
    'The prohibited conduct — what the defendant did or failed to do. For most offences this must be voluntary (see automatism). Causation may be required where the charge includes a result (e.g. "occasioning" ABH).',
  mensRea:
    'The mental element — what the prosecution must prove about the defendant\'s state of mind. This varies by offence: intention, recklessness (subjective foresight of risk), knowledge, or dishonesty. Some offences are strict-liability as to part of the actus reus (e.g. simple possession in certain drug cases).',
  burdenOfProof: {
    text: 'The prosecution must prove every element of the offence beyond reasonable doubt. The defendant bears no burden to prove innocence.',
    case: toCaseLawRef(getVerifiedCase('woolmington-v-dpp')!),
  },
};

export const GENERAL_DEFENCES: DefenceGuideEntry[] = [
  {
    id: 'self-defence',
    title: 'Self-defence and prevention of crime',
    summary:
      'A person may use reasonable force to defend themselves or another, or to prevent crime (Criminal Justice and Immigration Act 2008, s.76). The force used must be reasonable in the circumstances as the defendant honestly believed them to be (even if mistaken). Excessive force is not a complete defence.',
    keyCases: caseRefsByIds(['palmer', 'gladstone-williams']),
    stationNotes:
      'Take detailed instructions on what the client perceived (threat, weapon, size of attacker, escape routes). The police account and CCTV may differ — your client\'s honest belief is the starting point for advice.',
  },
  {
    id: 'intoxication',
    title: 'Intoxication',
    summary:
      'Voluntary intoxication is not a defence to basic-intent offences but may negate specific intent for offences requiring purpose/intent (e.g. s.18 GBH). Involuntary intoxication may support a denial of mens rea where the defendant lacked capacity to form the required mental element.',
    keyCases: caseRefsByIds(['majewski']),
    stationNotes:
      'Establish what the client consumed, when, and whether any medication or spiking may make intoxication involuntary. Intoxication rarely helps on common assault or s.47; it may matter for s.18 or dishonesty-based offences.',
  },
  {
    id: 'duress',
    title: 'Duress and duress of circumstances',
    summary:
      'Duress (by threats) and duress of circumstances can excuse offences where the defendant reasonably believed death or serious injury would follow if they did not comply, and a person of reasonable firmness would have acted similarly. Not available for murder.',
    keyCases: caseRefsByIds(['hasan']),
    stationNotes:
      'Take full instructions on threats, who made them, and whether the client had realistic alternatives (including going to the police).',
  },
  {
    id: 'insanity-automatism',
    title: 'Insanity and automatism',
    summary:
      'Insanity (M\'Naghten rules) applies where a defect of reason from disease of the mind caused the defendant not to know the nature of the act or that it was wrong. Automatism covers involuntary acts where there is no voluntary act.',
    keyCases: [],
    stationNotes:
      'If mental health, learning disability, or a medical episode is raised, explore whether capacity to form mens rea is in issue and whether an appropriate adult should have been present.',
  },
  {
    id: 'consent',
    title: 'Consent',
    summary:
      'Consent is a defence to common assault/battery where the contact is within the ordinary scope of everyday life or falls within recognised exceptions (sport, surgery, etc.). Consent is not a defence to ABH or GBH unless a recognised exception applies.',
    keyCases: caseRefsByIds(['brown', 'collins-v-wilcock']),
    stationNotes:
      'Consent arguments arise in pub fights, sport, and medical/procedure contexts. Clarify whether the client says they were attacked first or that contact was agreed.',
  },
];

export const COMMON_OFFENCES: OffenceGuideEntry[] = [
  {
    id: 'common-assault',
    title: 'Common assault and battery',
    statute: 'Criminal Justice Act 1988, s.39 (common assault); battery at common law',
    legislationUrl: 'https://www.legislation.gov.uk/ukpga/1988/52/section/39',
    triable: 'Summary only',
    maxPenalty: '6 months\' custody (s.39); higher maxima for racially/religiously aggravated variants and assault on an emergency worker under separate statutes',
    sentencingGuidelineUrl:
      'https://www.sentencingcouncil.org.uk/guidelines/common-assault-racially-or-religiously-aggravated-common-assault-battery-common-assault-on-emergency-worker/',
    sentencingNote:
      'Sentencing Council definitive guideline effective 1 July 2021. Category by culpability and harm; offence range for basic common assault: discharge to 26 weeks\' custody.',
    actusReus: [
      'Assault: cause the victim to apprehend immediate unlawful personal violence (threat only — no touch required).',
      'Battery: intentional or reckless application of unlawful force to another (even slight — e.g. spitting, grabbing).',
      'Force must be unlawful — lawful authority or valid consent negates the actus reus.',
    ],
    mensRea: [
      'Intention to cause apprehension of immediate violence (assault), or intention/recklessness as to applying force (battery).',
      'Recklessness means the defendant foresaw the risk and went ahead anyway (subjective test).',
    ],
    keyCases: caseRefsByIds(['fagan-v-mpc', 'collins-v-wilcock', 'r-v-venna']),
    commonDefences: ['Self-defence (s.76 CJIA 2008)', 'Consent (within lawful bounds)', 'Prevention of crime', 'Lawful arrest/resistance issues'],
    stationNotes:
      'Very common at custody. Check CCTV/BWV, whether a weapon is alleged, and whether emergency-worker or racial/religious aggravation is in play (different maxima). Spitting at someone is battery even without injury.',
  },
  {
    id: 'abh',
    title: 'Assault occasioning actual bodily harm (ABH)',
    statute: 'Offences Against the Person Act 1861, s.47',
    legislationUrl: 'https://www.legislation.gov.uk/ukpga/1861/100/section/47',
    triable: 'Either way',
    maxPenalty: '5 years\' custody',
    sentencingGuidelineUrl:
      'https://www.sentencingcouncil.org.uk/guidelines/assault-occasioning-actual-bodily-harm-racially-or-religiously-aggravated-assault-occasioning-actual-bodily-harm/',
    sentencingNote:
      'Sentencing Council ABH guideline (effective 1 July 2021). Starting points depend on culpability/harm category; more serious cases reach custodial starting points of 1–4 years on Crown Court trial.',
    actusReus: [
      'An assault or battery (see above) that causes actual bodily harm.',
      'ABH means more than trivial or transient harm — bruising, cuts, lost teeth, recognisable psychiatric injury (not mere fear/distress).',
      'Causation: the assault must have caused the harm (operating and substantial cause).',
    ],
    mensRea: [
      'Same mens rea as for the underlying assault or battery only — no need to intend or foresee ABH.',
      'If the prosecution proves intentional/reckless assault and ABH resulted, s.47 is made out.',
    ],
    keyCases: caseRefsByIds(['savage-parmenter', 'chan-fook', 'donovan']),
    commonDefences: ['Deny assault/battery', 'Self-defence', 'Causation break (novus actus)', 'Consent (rare for ABH — see R v Brown)'],
    stationNotes:
      'Police often charge s.47 where there are visible injuries. Ask for medical records/photos and whether the client admits any contact. Consider whether s.39 would suffice on the facts (charging standard).',
  },
  {
    id: 'gbh-s20',
    title: 'Unlawful wounding / inflicting GBH (s.20)',
    statute: 'Offences Against the Person Act 1861, s.20',
    legislationUrl: 'https://www.legislation.gov.uk/ukpga/1861/100/section/20',
    triable: 'Either way',
    maxPenalty: '5 years\' custody',
    sentencingGuidelineUrl:
      'https://www.sentencingcouncil.org.uk/guidelines/unlawful-wounding-grievous-bodily-harm/',
    sentencingNote:
      'Same guideline covers s.18 and s.20; s.20 is treated as lower culpability than s.18. Category ranges from high-level community orders to several years\' custody for the most serious s.20 cases.',
    actusReus: [
      'Wound: break in the continuity of the whole skin (both layers); or inflict/cause grievous bodily harm.',
      'GBH means really serious harm — includes serious psychiatric injury and serious permanent disability.',
    ],
    mensRea: [
      'Intention or recklessness as to causing some physical harm — need not be GBH-level harm.',
      '"Maliciously" requires subjective foresight of some harm (Cunningham recklessness), not Caldwell recklessness.',
    ],
    keyCases: caseRefsByIds(['savage-parmenter', 'cunningham']),
    commonDefences: ['Deny causation', 'Self-defence', 'No foresight/intent for any harm (accident)', 'Intoxication (limited — basic intent)'],
    stationNotes:
      'Distinguish from s.18 — s.20 does not require intent to cause GBH. Knife/glass cases often charged s.18; explore whether instructions support only recklessness as to minor harm.',
  },
  {
    id: 'gbh-s18',
    title: 'Wounding / GBH with intent (s.18)',
    statute: 'Offences Against the Person Act 1861, s.18',
    legislationUrl: 'https://www.legislation.gov.uk/ukpga/1861/100/section/18',
    triable: 'Indictable only',
    maxPenalty: 'Life imprisonment',
    sentencingGuidelineUrl:
      'https://www.sentencingcouncil.org.uk/guidelines/wounding-with-intent-causing-grievous-bodily-harm-with-intent/',
    sentencingNote:
      'Most serious non-fatal violence guideline. Starting points often in the range of 4–12+ years depending on category; life maximum reflects Parliament\'s view of gravity.',
    actusReus: [
      'Wound or cause grievous bodily harm (as for s.20).',
    ],
    mensRea: [
      'Specific intent: intention to cause GBH, or intention to resist/prevent lawful arrest and GBH results.',
      'Recklessness is not enough for the main limb — the prosecution must prove purpose to cause really serious harm.',
    ],
    keyCases: caseRefsByIds(['savage-parmenter']),
    commonDefences: ['Deny intent for GBH (only s.20 if recklessness as to some harm)', 'Self-defence', 'Deny identification', 'Voluntary intoxication may negate specific intent if supported by facts'],
    stationNotes:
      'Indictable-only — client will appear in Crown Court if charged. Focus instructions on whether any weapon use was aimed at causing really serious injury or merely to scare/escape.',
  },
  {
    id: 'theft',
    title: 'Theft',
    statute: 'Theft Act 1968, s.1',
    legislationUrl: 'https://www.legislation.gov.uk/ukpga/1968/60/section/1',
    triable: 'Either way (most general theft)',
    maxPenalty: '7 years\' custody (s.1)',
    sentencingGuidelineUrl: 'https://www.sentencingcouncil.org.uk/guidelines/theft-offences/',
    sentencingNote:
      'Sentencing Council theft guideline (effective 1 February 2016). General theft: offence range discharge to 6 years; shop theft has its own sub-category with lower starting points.',
    actusReus: [
      'Dishonest appropriation of property belonging to another.',
      'Appropriation: any assumption of the rights of an owner (including where the owner consented if obtained by deception).',
      'Property: money, goods, land, things in action, etc. (s.4).',
    ],
    mensRea: [
      'Dishonesty (Ivey test): (1) ascertain the defendant\'s actual belief about the facts; (2) was the conduct dishonest by the objective standards of ordinary decent people?',
      'Intention to permanently deprive (or treat as own to dispose of) — borrowing may suffice if for the period and in circumstances making it equivalent to an outright taking (s.6).',
    ],
    keyCases: caseRefsByIds(['ivey', 'gomez', 'lloyd']),
    commonDefences: ['Honest belief in legal right', 'Honest belief owner would consent', 'No intention to permanently deprive', 'No dishonesty on Ivey test'],
    stationNotes:
      'Check value, whether shop/theft-from-person sub-categories apply, and any CCTV. "I was going to pay" / "I thought it was mine" goes to dishonesty and permanent deprivation — take clear instructions.',
  },
  {
    id: 'burglary',
    title: 'Burglary',
    statute: 'Theft Act 1968, s.9',
    legislationUrl: 'https://www.legislation.gov.uk/ukpga/1968/60/section/9',
    triable: 'Either way (non-dwelling s.9(1)(b)); indictable-only (dwelling s.9(1)(b) with person present — check current triability); either way for many dwelling burglaries',
    maxPenalty: '14 years\' custody (dwelling); 10 years (other buildings)',
    sentencingGuidelineUrl: 'https://www.sentencingcouncil.org.uk/guidelines/burglary-offence/',
    sentencingNote:
      'Revised burglary guideline effective 1 July 2022. Dwelling burglary carries higher starting points; third domestic burglary triggers minimum sentencing provisions (Sentencing Code).',
    actusReus: [
      'Enter any building or part of a building as a trespasser.',
      'With intent to steal, inflict GBH, or do unlawful damage (s.9(1)(a)); OR having entered as trespasser, steal/attempt GBH/unlawful damage (s.9(1)(b)).',
      'Building includes inhabited vehicles/vessels (s.9(4)).',
    ],
    mensRea: [
      'Knowledge or recklessness as to trespass at time of entry.',
      'For s.9(1)(a): intent at time of entry; for s.9(1)(b): mens rea for the ulterior offence when inside.',
    ],
    keyCases: caseRefsByIds(['walkington', 'collins-burglary']),
    commonDefences: ['No trespass (permission to enter)', 'No intent for ulterior offence (s.9(1)(a))', 'Deny entry / identification', 'Inside building but not as trespasser'],
    stationNotes:
      'Establish whether dwelling/non-dwelling, time of day, occupants present, and value of goods. Distinction from simple theft — trespass element is key.',
  },
  {
    id: 'robbery',
    title: 'Robbery',
    statute: 'Theft Act 1968, s.8',
    legislationUrl: 'https://www.legislation.gov.uk/ukpga/1968/60/section/8',
    triable: 'Indictable only',
    maxPenalty: 'Life imprisonment',
    sentencingGuidelineUrl: 'https://www.sentencingcouncil.org.uk/guidelines/robbery/',
    sentencingNote:
      'Robbery guideline effective 1 April 2016. Street/less sophisticated robberies: starting points from high-level community orders to several years; weapon use and injury push categories up sharply.',
    actusReus: [
      'Theft (s.1) plus force or threat of force immediately before or at time of doing so, or immediately after to secure the stolen goods.',
      'Force need not be substantial — a push or snatch with force can suffice.',
    ],
    mensRea: [
      'Mens rea for theft (dishonesty + intention to permanently deprive) plus intention to use force or recklessness as to whether force would be used.',
    ],
    keyCases: caseRefsByIds(['gomez']),
    commonDefences: ['Deny theft (honest belief, no appropriation)', 'No force or threat of force', 'Deny identification', 'Duress (rare)'],
    stationNotes:
      'Often charged where mugging or shop theft involves a struggle. Clarify sequence: was property taken first, then force used to escape? That may still be robbery if force was to retain goods.',
  },
  {
    id: 'criminal-damage',
    title: 'Criminal damage',
    statute: 'Criminal Damage Act 1971, s.1',
    legislationUrl: 'https://www.legislation.gov.uk/ukpga/1971/48/section/1',
    triable: 'Either way (unless endanger life — indictable)',
    maxPenalty: '10 years\' custody (s.1(1)); life if endangering life (s.1(2))',
    sentencingGuidelineUrl:
      'https://www.sentencingcouncil.org.uk/guidelines/criminal-damage-criminal-damage-arising-from-a-hate-crime/',
    sentencingNote:
      'Guideline effective 1 October 2019. Low-value damage often non-custodial; arson/endanger-life and hate-crime variants significantly increase starting points.',
    actusReus: [
      'Destroy or damage property belonging to another (or own property with intent/endangerment as per s.1(2)–(3)).',
      'Damage need not be permanent — temporary impairment can suffice.',
    ],
    mensRea: [
      'Intention or recklessness as to destroying or damaging property.',
      'Recklessness is subjective: did the defendant foresee the risk and take it anyway (R v G)?',
    ],
    keyCases: caseRefsByIds(['r-v-g']),
    commonDefences: ['Lawful excuse (s.5 — e.g. belief owner would consent)', 'Accident (no recklessness)', 'Deny causation', 'Self-defence of property (limited)'],
    stationNotes:
      'Common in domestic, pub, and vehicle cases. £5,000+ value or arson triggers more serious handling. Ask whether client admits damage or only presence.',
  },
  {
    id: 'possession-drugs',
    title: 'Possession of a controlled drug',
    statute: 'Misuse of Drugs Act 1971, s.5(1)',
    legislationUrl: 'https://www.legislation.gov.uk/ukpga/1971/38/section/5',
    triable: 'Either way (Class A/B); summary for some Class C',
    maxPenalty: '7 years\' custody (Class A); 5 years (Class B); 2 years (Class C) — maxima vary by class',
    sentencingGuidelineUrl:
      'https://www.sentencingcouncil.org.uk/guidelines/drug-offences-possession-of-a-controlled-drug-possession-of-a-controlled-drug-with-intent-to-supply/',
    sentencingNote:
      'Drug offences guideline. Simple possession: typically fine to community order for small quantities; prior convictions and Class A push sentences up. Separate categories for PWITS.',
    actusReus: [
      'Possession of a substance controlled under the Act.',
      'Possession = custody or control — need not be on person (e.g. in home, car).',
    ],
    mensRea: [
      'Knowledge of possession of some substance (not necessarily knowledge of exact drug or quantity in all circumstances).',
      'In vehicle/house cases, knowledge/control must be linked to the defendant — mere proximity may not suffice.',
    ],
    keyCases: caseRefsByIds(['warner', 'kennedy-no-2']),
    commonDefences: ['No knowledge of possession', 'Drugs belong to another / planted', 'Not in custody or control', 'Lawful prescription (specific substances)'],
    stationNotes:
      'Confirm drug class, weight, and whether PWITS charged. Text messages, scales, and multiple wraps point to supply. "Joint enterprise" / holding for friend needs careful instructions.',
  },
  {
    id: 'public-order',
    title: 'Public order offences (s.4, s.4A, s.5 POA 1986)',
    statute: 'Public Order Act 1986, ss.4, 4A, 5',
    legislationUrl: 'https://www.legislation.gov.uk/ukpga/1986/64/contents',
    triable: 's.4/s.4A either way; s.5 summary only',
    maxPenalty: 's.4: 3 years; s.4A: 3 years; s.5: fine only (level 3)',
    sentencingGuidelineUrl: 'https://www.sentencingcouncil.org.uk/guidelines/public-order-offences/',
    sentencingNote:
      'Public order guideline covers s.4, s.4A, s.5 and related offences. s.5 is at the lowest end; fear/provocation with violence alleged under s.4 carries custody starting points.',
    actusReus: [
      's.4: use towards another threatening, abusive or insulting words/behaviour with intent to cause fear of immediate unlawful violence, or so as to cause such fear.',
      's.4A: use threatening/abusive/insulting words/behaviour with intent to cause harassment/alarm/distress, or so as to cause HAD.',
      's.5: use threatening/abusive/insulting words/behaviour or disorderly behaviour within hearing/sight of person likely to be caused HAD (no intent required for the result).',
    ],
    mensRea: [
      's.4: intent for first limb; recklessness as to causing fear for second limb.',
      's.4A: intent or recklessness as to causing HAD.',
      's.5: no mens rea as to causing HAD — but must intend/use the words/behaviour (or be reckless for disorderly behaviour).',
    ],
    keyCases: caseRefsByIds(['brutus-cozens']),
    commonDefences: ['Reasonable excuse', 'No threatening/abusive/insulting character', 'Not within sight/hearing of likely victim (s.5)', 'Freedom of expression (Art 10) in context'],
    stationNotes:
      'Often linked to pub/domestic incidents and football. Check BWV for exact words, whether s.5 sufficient vs s.4, and if racial/religious aggravation applies (separate statutes).',
  },
  {
    id: 'fraud',
    title: 'Fraud by false representation',
    statute: 'Fraud Act 2006, s.1 (by false representation); s.2',
    legislationUrl: 'https://www.legislation.gov.uk/ukpga/2006/35/section/2',
    triable: 'Either way (s.1 fraud); indictable-only for some conspiracy/large-scale fraud',
    maxPenalty: '10 years\' custody (s.1)',
    sentencingGuidelineUrl:
      'https://www.sentencingcouncil.org.uk/guidelines/fraud-bribery-and-money-laundering-offences/',
    sentencingNote:
      'Fraud guideline categorises by culpability and harm (primarily financial loss). Low-value fraud: community orders; large-scale: starting points of several years.',
    actusReus: [
      'Dishonestly make a false representation (express or implied).',
      'Representation is false if untrue or misleading and the maker knows that or is reckless as to whether it is.',
      'Representation made to a device/system can suffice (s.2(5)).',
    ],
    mensRea: [
      'Dishonesty (Ivey test).',
      'Intent to make a gain for self/another or cause loss to another (or risk of loss).',
    ],
    keyCases: caseRefsByIds(['ivey']),
    commonDefences: ['Honest belief representation true', 'No intent to gain/cause loss', 'Not dishonest on Ivey test', 'Civil dispute not criminal fraud'],
    stationNotes:
      'Increasingly common — benefits, online sales, business disputes. Obtain documents (contracts, messages, bank records) and explore whether it is a civil contract dispute rather than criminal fraud.',
  },
];

export const OFFENCES_GUIDE_SOURCES = [
  {
    label: 'Sentencing Council — definitive guidelines index',
    href: 'https://www.sentencingcouncil.org.uk/sentencing-guidelines/',
  },
  {
    label: 'CPS — Offences against the Person (charging standard)',
    href: 'https://www.cps.gov.uk/prosecution-guidance/offences-against-person-incorporating-charging-standard',
  },
  {
    label: 'CPS — Theft Act offences legal guidance',
    href: 'https://www.cps.gov.uk/legal-guidance/theft-act-offences',
  },
  {
    label: 'CPS — Public Order offences legal guidance',
    href: 'https://www.cps.gov.uk/legal-guidance/public-order-offences',
  },
  {
    label: 'CPS — Fraud Act 2006 legal guidance',
    href: 'https://www.cps.gov.uk/legal-guidance/fraud-act-2006-offences',
  },
  {
    label: 'CPS — Misuse of Drugs Act legal guidance',
    href: 'https://www.cps.gov.uk/legal-guidance/misuse-drugs-act-1971-0',
  },
  {
    label: 'legislation.gov.uk',
    href: 'https://www.legislation.gov.uk/',
  },
  {
    label: 'BAILII — free UK case law',
    href: 'https://www.bailii.org/',
  },
];
