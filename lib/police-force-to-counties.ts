/**
 * Maps police force names (from station data) to directory county names.
 */
export const FORCE_TO_COUNTIES: Record<string, string[]> = {
  'avon and somerset': ['Somerset', 'Bristol'],
  bedfordshire: ['Bedfordshire'],
  cambridgeshire: ['Cambridgeshire'],
  cheshire: ['Cheshire'],
  'city of london': ['London', 'Middlesex'],
  cleveland: ['Cleveland'],
  cumbria: ['Cumbria'],
  derbyshire: ['Derbyshire'],
  'devon and cornwall': ['Devon', 'Cornwall'],
  dorset: ['Dorset'],
  durham: ['County Durham'],
  'dyfed-powys': ['Powys', 'Dyfed'],
  essex: ['Essex'],
  gloucestershire: ['Gloucestershire'],
  'greater manchester': ['Greater Manchester'],
  gwent: ['Gwent'],
  hampshire: ['Hampshire'],
  hertfordshire: ['Hertfordshire'],
  humberside: ['Humberside'],
  kent: ['Kent'],
  lancashire: ['Lancashire'],
  leicestershire: ['Leicestershire'],
  lincolnshire: ['Lincolnshire'],
  merseyside: ['Merseyside'],
  met: ['London', 'Middlesex'],
  metropolitan: ['London', 'Middlesex'],
  norfolk: ['Norfolk'],
  'north wales': ['North Wales'],
  'north yorkshire': ['North Yorkshire', 'Yorkshire'],
  northamptonshire: ['Northamptonshire'],
  northumbria: ['Northumberland', 'Tyne and Wear'],
  nottinghamshire: ['Nottinghamshire'],
  'south wales': ['South Wales'],
  'south yorkshire': ['South Yorkshire', 'Yorkshire'],
  staffordshire: ['Staffordshire'],
  suffolk: ['Suffolk'],
  surrey: ['Surrey'],
  sussex: ['Sussex'],
  'thames valley': ['Berkshire', 'Buckinghamshire', 'Oxfordshire'],
  warwickshire: ['Warwickshire'],
  'west mercia': ['Shropshire', 'Herefordshire', 'Worcestershire'],
  'west midlands': ['West Midlands'],
  'west yorkshire': ['West Yorkshire', 'Yorkshire'],
  wiltshire: ['Wiltshire'],
};

export function forceMatchesCounty(forceName: string, countyName: string): boolean {
  const forceKey = forceName.toLowerCase().replace(/\s*(police|constabulary)\s*/gi, '').trim();
  const mapped = FORCE_TO_COUNTIES[forceKey];
  if (mapped) return mapped.some((c) => c.toLowerCase() === countyName.toLowerCase());
  return (
    forceName.toLowerCase().includes(countyName.toLowerCase()) ||
    countyName.toLowerCase().includes(forceKey)
  );
}
