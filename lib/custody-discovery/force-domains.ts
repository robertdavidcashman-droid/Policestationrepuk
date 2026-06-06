/** Derive the primary .police.uk domain for a force name. */
const FORCE_DOMAIN_MAP: Record<string, string> = {
  'metropolitan police': 'met.police.uk',
  'city of london police': 'cityoflondon.police.uk',
  'british transport police': 'btp.police.uk',
  'avon and somerset constabulary': 'avonandsomerset.police.uk',
  'devon and cornwall police': 'devon-cornwall.police.uk',
  'thames valley police': 'thamesvalley.police.uk',
  'west midlands police': 'west-midlands.police.uk',
  'west yorkshire police': 'westyorkshire.police.uk',
  'south yorkshire police': 'southyorkshire.police.uk',
  'north yorkshire police': 'northyorkshire.police.uk',
  'greater manchester police': 'gmp.police.uk',
  'merseyside police': 'merseyside.police.uk',
  'northumbria police': 'northumbria.police.uk',
  'durham constabulary': 'durham.police.uk',
  'cleveland police': 'cleveland.police.uk',
  'humberside police': 'humberside.police.uk',
  'lincolnshire police': 'lincolnshire.police.uk',
  'nottinghamshire police': 'nottinghamshire.police.uk',
  'leicestershire police': 'leicestershire.police.uk',
  'staffordshire police': 'staffordshire.police.uk',
  'west mercia police': 'westmercia.police.uk',
  'warwickshire police': 'warwickshire.police.uk',
  'derbyshire constabulary': 'derbyshire.police.uk',
  'cheshire constabulary': 'cheshire.police.uk',
  'lancashire constabulary': 'lancashire.police.uk',
  'cumbria constabulary': 'cumbria.police.uk',
  'north wales police': 'northwales.police.uk',
  'dyfed-powys police': 'dyfed-powys.police.uk',
  'south wales police': 'south-wales.police.uk',
  'gwent police': 'gwent.police.uk',
  'sussex police': 'sussex.police.uk',
  'surrey police': 'surrey.police.uk',
  'hampshire constabulary': 'hampshire.police.uk',
  'dorset police': 'dorset.police.uk',
  'wiltshire police': 'wiltshire.police.uk',
  'gloucestershire constabulary': 'gloucestershire.police.uk',
  'kent police': 'kent.police.uk',
  'essex police': 'essex.police.uk',
  'suffolk constabulary': 'suffolk.police.uk',
  'norfolk constabulary': 'norfolk.police.uk',
  'cambridgeshire constabulary': 'cambridgeshire.police.uk',
  'bedfordshire police': 'bedfordshire.police.uk',
  'hertfordshire constabulary': 'herts.police.uk',
  'northamptonshire police': 'northants.police.uk',
};

function slugifyForce(name: string): string {
  return name
    .toLowerCase()
    .replace(/\bconstabulary\b/g, '')
    .replace(/\bpolice\b/g, '')
    .replace(/[^a-z0-9]+/g, '')
    .trim();
}

export function forceDomainForName(forceName: string): string {
  const key = forceName.toLowerCase().trim();
  if (FORCE_DOMAIN_MAP[key]) return FORCE_DOMAIN_MAP[key];

  const slug = slugifyForce(forceName);
  if (slug) {
    if (slug.includes('devon') && slug.includes('cornwall')) return 'devon-cornwall.police.uk';
    if (slug.includes('avon') && slug.includes('somerset')) return 'avonandsomerset.police.uk';
    return `${slug}.police.uk`;
  }
  return 'police.uk';
}
