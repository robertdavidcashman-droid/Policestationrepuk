import { readFileSync, writeFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');

const COUNTY_MAP = {
  'essex': 'Essex',
  'kent': 'Kent',
  'london': 'London',
  'greater london': 'London',
  'west yorkshire': 'West Yorkshire',
  'west midlands': 'West Midlands',
  'lancashire': 'Lancashire',
  'surrey': 'Surrey',
  'hampshire': 'Hampshire',
  'hertfordshire': 'Hertfordshire',
  'sussex': 'Sussex',
  'west sussex': 'Sussex',
  'middlesex': 'Middlesex',
  'middx': 'Middlesex',
  'greater manchester': 'Greater Manchester',
  'cheshire': 'Cheshire',
  'leicestershire': 'Leicestershire',
  'northamptonshire': 'Northamptonshire',
  'bedfordshire': 'Bedfordshire',
  'devon': 'Devon',
  'tyne and wear': 'Tyne and Wear',
  'staffordshire': 'Staffordshire',
  'lincolnshire': 'Lincolnshire',
  'south yorkshire': 'South Yorkshire',
  'berkshire': 'Berkshire',
  'shropshire': 'Shropshire',
  'norfolk': 'Norfolk',
  'suffolk': 'Suffolk',
  'northumberland': 'Northumberland',
  'buckinghamshire': 'Buckinghamshire',
  'gloucestershire': 'Gloucestershire',
  'yorkshire': 'Yorkshire',
  'bradford': 'West Yorkshire',
  'nottinghamshire': 'Nottinghamshire',
  'merseyside': 'Merseyside',
  'crawley': 'Sussex',
  'co durham': 'County Durham',
  'powys': 'Powys',
  'cardiff': 'Cardiff',
  'county': '',
  'gb': '',
  'uk': '',
  'united kingdom': '',
};

const reps = JSON.parse(readFileSync(resolve(ROOT, 'data/reps.json'), 'utf-8'));
const stations = JSON.parse(readFileSync(resolve(ROOT, 'data/stations.json'), 'utf-8'));

console.log(`Loaded ${reps.length} reps, ${stations.length} stations\n`);

// Normalize counties on reps
let unknownCountyBefore = 0;
let unknownCountyAfter = 0;
let normalizedCount = 0;

reps.forEach(r => {
  const original = r.county;
  const key = (original || '').toLowerCase().trim();

  if (!key || key === 'unknown') {
    unknownCountyBefore++;
  }

  if (COUNTY_MAP[key] !== undefined) {
    r.county = COUNTY_MAP[key];
    if (r.county !== original) normalizedCount++;
  }

  if (!r.county) {
    unknownCountyAfter++;
  }
});

console.log(`Normalized ${normalizedCount} county values`);
console.log(`Unknown county: ${unknownCountyBefore} before -> ${unknownCountyAfter} after\n`);

// Deduplicate stations by station_name + force
const stationKeys = new Set();
const dedupedStations = [];
let dupeCount = 0;

stations.forEach(s => {
  const key = `${s.name.toLowerCase().trim()}|${(s.forceName || '').toLowerCase().trim()}|${(s.postcode || '').toLowerCase().trim()}`;
  if (!stationKeys.has(key)) {
    stationKeys.add(key);
    dedupedStations.push(s);
  } else {
    dupeCount++;
  }
});

console.log(`Deduplicated stations: ${stations.length} -> ${dedupedStations.length} (removed ${dupeCount} dupes)\n`);

// Rebuild counties
const countySet = new Set();
reps.forEach(r => { if (r.county) countySet.add(r.county); });
const countyNames = [...countySet].sort();

/** Counties that must survive regeneration even when repCount is zero. */
const CANONICAL_COUNTIES = [
  { name: 'Hertfordshire', slug: 'hertfordshire' },
];

const counties = countyNames.map(name => {
  const countyReps = reps.filter(r => r.county === name);
  const countyStationNames = new Set();
  countyReps.forEach(r => r.stations.forEach(s => countyStationNames.add(s)));
  return {
    name,
    slug: name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
    repCount: countyReps.length,
    stationCount: countyStationNames.size,
  };
});

for (const canon of CANONICAL_COUNTIES) {
  if (!counties.some((c) => c.slug === canon.slug)) {
    counties.push({ name: canon.name, slug: canon.slug, repCount: 0, stationCount: 0 });
  }
}
counties.sort((a, b) => a.name.localeCompare(b.name));

// Coverage report
console.log('=== NORMALIZED DATA COVERAGE ===');
console.log(`Total Reps:     ${reps.length} (${reps.filter(r => r.county).length} with county)`);
console.log(`Total Stations: ${dedupedStations.length}`);
console.log(`Total Counties: ${counties.length}`);
console.log('');

console.log('Reps per county (normalized):');
const repsByCounty = {};
reps.forEach(r => {
  const c = r.county || '(no county)';
  repsByCounty[c] = (repsByCounty[c] || 0) + 1;
});
Object.entries(repsByCounty).sort((a, b) => b[1] - a[1]).forEach(([county, count]) => {
  console.log(`  ${county}: ${count}`);
});

// Write cleaned data
writeFileSync(resolve(ROOT, 'data/reps.json'), JSON.stringify(reps, null, 2));
console.log(`\nWrote data/reps.json (${reps.length} records)`);

writeFileSync(resolve(ROOT, 'data/stations.json'), JSON.stringify(dedupedStations, null, 2));
console.log(`Wrote data/stations.json (${dedupedStations.length} records)`);

writeFileSync(resolve(ROOT, 'data/counties.json'), JSON.stringify(counties, null, 2));
console.log(`Wrote data/counties.json (${counties.length} records)`);

console.log('\n=== NORMALIZATION COMPLETE ===');
