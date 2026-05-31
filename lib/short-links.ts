/**
 * Short paths for easy linking — `/go/kent`, vanity redirects, and the /links hub.
 */

/** `/go/{alias}` → internal path (county aliases match data/counties.json slugs). */
export const GO_COUNTY_ALIASES: Record<string, string> = {
  kent: '/directory/kent',
  london: '/directory/london',
  essex: '/directory/essex',
  manchester: '/directory/greater-manchester',
  'greater-manchester': '/directory/greater-manchester',
  'west-midlands': '/directory/west-midlands',
  birmingham: '/directory/west-midlands',
  'west-yorkshire': '/directory/west-yorkshire',
  leeds: '/directory/west-yorkshire',
  surrey: '/directory/surrey',
  sussex: '/directory/sussex',
  hampshire: '/directory/hampshire',
  norfolk: '/directory/norfolk',
  suffolk: '/directory/suffolk',
  berkshire: '/directory/berkshire',
  hertfordshire: '/directory',
  merseyside: '/directory/merseyside',
  liverpool: '/directory/merseyside',
  lancashire: '/directory/lancashire',
  nottinghamshire: '/directory/nottinghamshire',
  'south-yorkshire': '/directory/south-yorkshire',
  'avon-and-somerset': '/directory/avon-and-somerset',
  bristol: '/directory/avon-and-somerset',
  'devon-and-cornwall': '/directory/devon-and-cornwall',
};

/** Other `/go/{key}` shortcuts. */
export const GO_SHORTCUTS: Record<string, string> = {
  find: '/directory',
  reps: '/directory',
  rep: '/directory',
  directory: '/directory',
  stations: '/StationsDirectory',
  register: '/register',
  join: '/WhatsApp',
  whatsapp: '/WhatsApp',
  blog: '/Blog',
  wiki: '/Wiki',
  links: '/links',
  train: '/PrepareForCIT',
  custodynote: '/CustodyNote',
};

export function resolveGoLink(key: string): string | null {
  const k = key.trim().toLowerCase();
  if (!k) return null;
  return GO_SHORTCUTS[k] ?? GO_COUNTY_ALIASES[k] ?? null;
}

export const GO_COUNTY_LABELS: { alias: string; label: string }[] = [
  { alias: 'kent', label: 'Kent reps' },
  { alias: 'london', label: 'London reps' },
  { alias: 'essex', label: 'Essex reps' },
  { alias: 'manchester', label: 'Greater Manchester reps' },
  { alias: 'west-midlands', label: 'West Midlands reps' },
  { alias: 'west-yorkshire', label: 'West Yorkshire reps' },
  { alias: 'surrey', label: 'Surrey reps' },
  { alias: 'sussex', label: 'Sussex reps' },
  { alias: 'hampshire', label: 'Hampshire reps' },
  { alias: 'norfolk', label: 'Norfolk reps' },
  { alias: 'suffolk', label: 'Suffolk reps' },
  { alias: 'merseyside', label: 'Merseyside reps' },
  { alias: 'lancashire', label: 'Lancashire reps' },
];
