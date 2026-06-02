/**
 * Verified force-level contact numbers for England & Wales police forces.
 * Sources: gov.uk/contact-police (101 nationally), force-published switchboard
 * lines where still in use, and FOI / force contact pages (2024–2026).
 *
 * Station-specific custody desk lines are rarely published nationally; when a
 * station only shows a force switchboard or legacy international line, we treat
 * the public contact as 101 (or the force non-emergency below).
 */

export interface OfficialForceContact {
  /** Standard UK non-emergency (almost always 101). */
  nonEmergency: string;
  /** Force switchboard / contact centre when published. */
  switchboard?: string;
  /** Legacy international line (UK callers should use 101 instead). */
  international?: string;
  source: string;
}

/** Normalised force name → official contacts. */
export const OFFICIAL_FORCE_CONTACTS: Record<string, OfficialForceContact> = {
  'Metropolitan Police': {
    nonEmergency: '101',
    switchboard: '020 7230 1212',
    source: 'met.police.uk / public contact',
  },
  'City of London Police': {
    nonEmergency: '101',
    switchboard: '020 7601 2222',
    source: 'cityoflondon.police.uk',
  },
  'British Transport Police': {
    nonEmergency: '0800 40 50 40',
    switchboard: '0800 40 50 40',
    source: 'btp.police.uk',
  },
  'Kent Police': {
    nonEmergency: '101',
    international: '01622 690690',
    source: 'kent.police.uk / KELSI 101 migration guidance',
  },
  'Thames Valley Police': {
    nonEmergency: '101',
    switchboard: '01865 841148',
    international: '01865 841148',
    source: 'thamesvalley.police.uk',
  },
  'Essex Police': {
    nonEmergency: '101',
    switchboard: '0300 333 4444',
    source: 'essex.police.uk',
  },
  'Greater Manchester Police': {
    nonEmergency: '101',
    switchboard: '0161 872 5050',
    source: 'gmp.police.uk',
  },
  'West Midlands Police': {
    nonEmergency: '101',
    switchboard: '0345 113 5000',
    source: 'west-midlands.police.uk',
  },
  'West Yorkshire Police': {
    nonEmergency: '101',
    switchboard: '0113 348 0060',
    source: 'westyorkshire.police.uk',
  },
  'South Wales Police': {
    nonEmergency: '101',
    switchboard: '01656 655555',
    source: 'south-wales.police.uk',
  },
  'Northumbria Police': {
    nonEmergency: '101',
    switchboard: '0191 375 2582',
    source: 'northumbria.police.uk',
  },
  'Merseyside Police': {
    nonEmergency: '101',
    switchboard: '0151 709 6010',
    source: 'merseyside.police.uk',
  },
  'Hampshire Constabulary': {
    nonEmergency: '101',
    switchboard: '01962 841534',
    source: 'hampshire.police.uk',
  },
  'Surrey Police': {
    nonEmergency: '101',
    switchboard: '01483 571212',
    source: 'surrey.police.uk / FOI custody guidance',
  },
  'Sussex Police': {
    nonEmergency: '101',
    switchboard: '101',
    source: 'sussex.police.uk',
  },
  'Lancashire Constabulary': {
    nonEmergency: '101',
    switchboard: '01772 614444',
    source: 'lancashire.police.uk',
  },
  'Nottinghamshire Police': {
    nonEmergency: '101',
    switchboard: '0115 967 0999',
    source: 'nottinghamshire.police.uk',
  },
  'Leicestershire Police': {
    nonEmergency: '101',
    switchboard: '0116 222 2222',
    source: 'leics.police.uk',
  },
  'Staffordshire Police': {
    nonEmergency: '101',
    switchboard: '01782 234234',
    source: 'staffordshire.police.uk',
  },
  'Devon and Cornwall Police': {
    nonEmergency: '101',
    switchboard: '0300 123 1212',
    source: 'devon-cornwall.police.uk',
  },
  'Avon and Somerset Constabulary': {
    nonEmergency: '101',
    switchboard: '101',
    source: 'avonandsomerset.police.uk',
  },
  'Ministry of Defence Police': {
    nonEmergency: '101',
    source: 'mod.police.uk',
  },
  'Civil Nuclear Constabulary': {
    nonEmergency: '03303 135400',
    source: 'cnc.police.uk',
  },
};

/** Forces that use 101 (or force-specific non-101) as the public non-emergency line. */
export function getOfficialContact(forceName: string | undefined): OfficialForceContact | null {
  if (!forceName?.trim()) return null;
  return OFFICIAL_FORCE_CONTACTS[forceName.trim()] ?? null;
}

/** Default non-emergency for territorial forces when unknown. */
export const DEFAULT_NON_EMERGENCY = '101';
