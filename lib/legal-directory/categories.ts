/**
 * Legal Services Directory — provider categories.
 * Monetisation: featured/promoted placements can be wired per categorySlug later.
 */

export interface LegalDirectoryCategory {
  slug: string;
  label: string;
  providerType: string;
  seoTitle: string;
  seoDescription: string;
  intro: string;
}

export const LEGAL_DIRECTORY_CATEGORIES: LegalDirectoryCategory[] = [
  {
    slug: 'solicitors',
    label: 'Criminal Defence Solicitors',
    providerType: 'Criminal defence solicitor',
    seoTitle: 'Criminal Defence Solicitors Directory',
    seoDescription:
      'Find criminal defence solicitors across England and Wales. Free directory listings for firms taking police station, magistrates and Crown Court work.',
    intro:
      'Solicitors and firms specialising in criminal defence, police station attendance, and related advocacy. Verify SRA status before instructing.',
  },
  {
    slug: 'barristers-chambers',
    label: "Barristers' Chambers",
    providerType: "Barristers' chambers",
    seoTitle: "Criminal Barristers' Chambers Directory",
    seoDescription:
      "Directory of barristers' chambers handling criminal law, police station work, and trials across England and Wales.",
    intro:
      "Sets of barristers practising criminal law. Check BSB authorisation and clerks' details before instructing.",
  },
  {
    slug: 'barristers',
    label: 'Barristers',
    providerType: 'Barrister',
    seoTitle: 'Criminal Barristers Directory',
    seoDescription:
      'Individual criminal barristers listed by area and specialism. Information only — verify BSB registration.',
    intro: 'Self-employed barristers undertaking criminal defence and related work.',
  },
  {
    slug: 'police-station-representatives',
    label: 'Police Station Representatives',
    providerType: 'Police station representative',
    seoTitle: 'Police Station Representatives Directory',
    seoDescription:
      'Accredited police station representatives and agents for criminal defence firms across England and Wales.',
    intro:
      'Representatives attending police stations under PSRAS or equivalent accreditation. Confirm accreditation before instructing.',
  },
  {
    slug: 'expert-witnesses',
    label: 'Expert Witnesses',
    providerType: 'Expert witness',
    seoTitle: 'Criminal Expert Witnesses Directory',
    seoDescription:
      'Expert witnesses for criminal proceedings — forensic, medical, digital, and specialist disciplines.',
    intro: 'Experts instructed for criminal cases. Confirm CV, accreditation, and court experience.',
  },
  {
    slug: 'interpreters',
    label: 'Interpreters & Translators',
    providerType: 'Interpreter / translator',
    seoTitle: 'Court Interpreters & Translators Directory',
    seoDescription:
      'Interpreters and translators for police station interviews, conferences, and court hearings.',
    intro: 'Language professionals for custody and court. Check MOJ / NRPSI or equivalent where relevant.',
  },
  {
    slug: 'process-servers',
    label: 'Process Servers',
    providerType: 'Process server',
    seoTitle: 'Legal Process Servers Directory',
    seoDescription: 'Process servers for criminal and civil proceedings in England and Wales.',
    intro: 'Agents serving court documents and related tasks.',
  },
  {
    slug: 'private-investigators',
    label: 'Private Investigators',
    providerType: 'Private investigator',
    seoTitle: 'Private Investigators — Criminal Defence Directory',
    seoDescription:
      'Investigators supporting criminal defence teams — surveillance, enquiries, and case preparation.',
    intro: 'Investigation services for defence teams. Confirm licensing and insurance.',
  },
  {
    slug: 'legal-costs',
    label: 'Legal Costs Draftsmen',
    providerType: 'Legal costs draftsman',
    seoTitle: 'Legal Costs Draftsmen Directory',
    seoDescription: 'Costs draftsmen and costs lawyers for criminal billing and assessments.',
    intro: 'Specialists in legal costs for criminal matters.',
  },
  {
    slug: 'transcription',
    label: 'Transcription Providers',
    providerType: 'Transcription provider',
    seoTitle: 'Legal Transcription Providers Directory',
    seoDescription: 'Transcription of interviews, hearings, and conferences for criminal cases.',
    intro: 'Audio and video transcription for criminal proceedings.',
  },
  {
    slug: 'prison-law',
    label: 'Prison Law',
    providerType: 'Prison law specialist',
    seoTitle: 'Prison Law Specialists Directory',
    seoDescription: 'Solicitors and representatives specialising in prison law and parole matters.',
    intro: 'Advisers on prison law, parole, and related proceedings.',
  },
  {
    slug: 'motoring-law',
    label: 'Motoring Law',
    providerType: 'Motoring offence specialist',
    seoTitle: 'Motoring Offence Specialists Directory',
    seoDescription: 'Solicitors and advocates for motoring offences and road traffic criminal work.',
    intro: 'Specialists in drink-drive, dangerous driving, and related offences.',
  },
  {
    slug: 'appeals',
    label: 'Appeals',
    providerType: 'Appeals specialist',
    seoTitle: 'Criminal Appeals Specialists Directory',
    seoDescription: 'Solicitors and barristers focusing on criminal appeals and miscarriage of justice work.',
    intro: 'Teams handling appeals to the Crown Court, Court of Appeal, and beyond.',
  },
  {
    slug: 'forensic-experts',
    label: 'Forensic Experts',
    providerType: 'Forensic expert',
    seoTitle: 'Forensic Experts Directory — Criminal Law',
    seoDescription: 'Forensic scientists and experts for criminal defence and prosecution teams.',
    intro: 'Forensic analysis across disciplines — DNA, pathology, chemistry, and more.',
  },
  {
    slug: 'digital-evidence',
    label: 'Digital Evidence Experts',
    providerType: 'Digital evidence specialist',
    seoTitle: 'Digital Evidence Specialists Directory',
    seoDescription: 'Digital forensics and cell site experts for criminal cases.',
    intro: 'Specialists in phones, computers, and digital exhibits.',
  },
  {
    slug: 'youth-court',
    label: 'Youth Court',
    providerType: 'Youth court specialist',
    seoTitle: 'Youth Court Specialists Directory',
    seoDescription: 'Providers specialising in youth justice and youth court representation.',
    intro: 'Solicitors, barristers, and reps focused on defendants under 18.',
  },
  {
    slug: 'serious-crime',
    label: 'Serious Crime',
    providerType: 'Serious crime specialist',
    seoTitle: 'Serious Crime Defence Directory',
    seoDescription: 'Firms and counsel for serious crime, murder, and complex trials.',
    intro: 'High-harm and complex criminal matters.',
  },
  {
    slug: 'fraud',
    label: 'Fraud',
    providerType: 'Fraud specialist',
    seoTitle: 'Fraud Defence Specialists Directory',
    seoDescription: 'Criminal fraud, economic crime, and financial crime defence providers.',
    intro: 'Specialists in fraud, money laundering, and corporate crime.',
  },
  {
    slug: 'sexual-offences',
    label: 'Sexual Offences',
    providerType: 'Sexual offence defence specialist',
    seoTitle: 'Sexual Offences Defence Directory',
    seoDescription: 'Providers experienced in sexual offences defence work.',
    intro: 'Sensitive cases requiring specialist experience and safeguarding awareness.',
  },
  {
    slug: 'domestic-abuse',
    label: 'Domestic Abuse Defence',
    providerType: 'Domestic abuse defence specialist',
    seoTitle: 'Domestic Abuse Defence Directory',
    seoDescription: 'Providers handling domestic abuse allegations in criminal proceedings.',
    intro: 'Defence work involving domestic abuse allegations and related orders.',
  },
  {
    slug: 'cybercrime',
    label: 'Cybercrime',
    providerType: 'Cybercrime specialist',
    seoTitle: 'Cybercrime Defence Directory',
    seoDescription: 'Cybercrime and computer misuse defence specialists.',
    intro: 'Offences involving computers, hacking, and online conduct.',
  },
  {
    slug: 'mental-health-intermediaries',
    label: 'Mental Health / Intermediaries / Vulnerable Clients',
    providerType: 'Mental health / intermediary specialist',
    seoTitle: 'Intermediaries & Vulnerable Client Specialists Directory',
    seoDescription:
      'Intermediaries, mental health specialists, and advisers for vulnerable defendants.',
    intro: 'Support for vulnerable adults and children in the criminal process.',
  },
  {
    slug: 'other',
    label: 'Other Legal Services',
    providerType: 'Other criminal justice service',
    seoTitle: 'Other Criminal Justice Services Directory',
    seoDescription:
      'Other criminal justice-related service providers not listed in a specific category.',
    intro: 'Additional providers supporting criminal defence and justice work.',
  },
];

const BY_SLUG = new Map(LEGAL_DIRECTORY_CATEGORIES.map((c) => [c.slug, c]));

export function getCategoryBySlug(slug: string): LegalDirectoryCategory | undefined {
  return BY_SLUG.get(slug);
}

export function categorySlugFromProviderType(providerType: string): string {
  const lower = providerType.toLowerCase();
  const match = LEGAL_DIRECTORY_CATEGORIES.find(
    (c) =>
      c.providerType.toLowerCase() === lower ||
      c.label.toLowerCase() === lower ||
      c.slug === lower,
  );
  return match?.slug ?? 'other';
}

export const CATEGORY_SLUGS = LEGAL_DIRECTORY_CATEGORIES.map((c) => c.slug);
