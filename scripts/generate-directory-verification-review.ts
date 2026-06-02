/**
 * Generate directory-verification-review.md from station data and optional legal export.
 * npx tsx scripts/generate-directory-verification-review.ts
 */
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import type { PoliceStation } from '../lib/types';
import {
  isDialablePhone,
  loadStationVerification,
  stationVerificationKey,
} from '../lib/station-verification';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const OUT = resolve(ROOT, 'directory-verification-review.md');
const STATIONS_PATH = resolve(ROOT, 'data/stations.json');
const LEGAL_EXPORT = resolve(ROOT, 'data/reports/legal-directory-export.json');
const QUEUE_PATH = resolve(ROOT, 'data/reports/station-verification-queue.json');

const stations = JSON.parse(readFileSync(STATIONS_PATH, 'utf-8')) as PoliceStation[];
const verification = loadStationVerification();

const custodyNotPublic: string[] = [];
const unverifiedPhones: string[] = [];
const verifiedCustody: string[] = [];
const sourceDomains = new Set<string>();

for (const s of stations) {
  const rec = verification[stationVerificationKey(s)];
  if (!rec) continue;
  const url = rec.sourceUrl;
  if (url) {
    try {
      sourceDomains.add(new URL(url).hostname);
    } catch {
      /* ignore */
    }
  }
  const custody = rec.fields?.custodyPhone;
  if (custody?.status === 'not_publicly_listed') {
    custodyNotPublic.push(`${s.name} (${s.forceName ?? 'unknown force'})`);
  }
  if (custody?.status === 'verified' && isDialablePhone(s.custodyPhone)) {
    verifiedCustody.push(`${s.name}: ${s.custodyPhone}`);
  }
  if (rec.fields?.phone?.status === 'unverified') {
    unverifiedPhones.push(s.name);
  }
}

let queueSummary = '';
if (existsSync(QUEUE_PATH)) {
  const q = JSON.parse(readFileSync(QUEUE_PATH, 'utf-8')) as { summary: Record<string, unknown> };
  queueSummary = `\n## Priority queue\n\n\`\`\`json\n${JSON.stringify(q.summary, null, 2)}\n\`\`\`\n`;
}

let legalSection = '\n## Legal services directory\n\n_No export found. Run `npx tsx scripts/export-legal-directory-listings.ts` when KV is configured._\n';
if (existsSync(LEGAL_EXPORT)) {
  const exp = JSON.parse(readFileSync(LEGAL_EXPORT, 'utf-8')) as {
    listings: { businessName: string; verificationStatus: string; sourceUrl: string; dateVerified: string | null }[];
  };
  const verified = exp.listings.filter((l) => l.verificationStatus === 'verified');
  const unverified = exp.listings.filter((l) => l.verificationStatus === 'unverified');
  legalSection = `
## Legal services directory

- Listings exported: ${exp.listings.length}
- Verified: ${verified.length}
- Unverified: ${unverified.length}
`;
}

const md = `# Directory verification review

Generated: ${new Date().toISOString()}

## Scope

- **In scope:** Police station telephone/address/custody directory (\`data/stations.json\`), legal services directory (KV).
- **Out of scope:** Police station **representatives** directory (no changes).

## Station directory audit

| Metric | Count |
|--------|------:|
| Total stations | ${stations.length} |
| Verification records | ${Object.keys(verification).length} |
| Dialable main \`phone\` | ${stations.filter((s) => isDialablePhone(s.phone)).length} |
| Dialable \`custodyPhone\` | ${stations.filter((s) => isDialablePhone(s.custodyPhone)).length} |
| Custody marked not publicly listed (metadata) | ${custodyNotPublic.length} |
| Main phone marked unverified in metadata | ${unverifiedPhones.length} |

${queueSummary}

## Entries updated

Station verification sidecar (\`data/station-verification.json\`): **${Object.keys(verification).length}** records from automated batch pass (force contact sources; custody lines not invented).

## Custody numbers added (verified dialable)

${verifiedCustody.length === 0 ? '_None newly verified in this pass (existing seed/provenance only)._' : verifiedCustody.slice(0, 30).map((l) => `- ${l}`).join('\n') + (verifiedCustody.length > 30 ? `\n- … and ${verifiedCustody.length - 30} more` : '')}

## Custody not publicly available

${custodyNotPublic.length === 0 ? '_None flagged._' : custodyNotPublic.slice(0, 40).map((l) => `- ${l}`).join('\n') + (custodyNotPublic.length > 40 ? `\n- … and ${custodyNotPublic.length - 40} more` : '')}

## Source URLs used (domains)

${[...sourceDomains].sort().map((d) => `- ${d}`).join('\n') || '_None recorded yet._'}

## Possible duplicates

_Manual review: compare station names within same force in \`data/stations.json\`._

## Closed / moved / no longer custody

_No systematic closed-station flags in this pass. Flag via \`fields.custodyStatus\` in verification sidecar when confirmed._

## Manual review queue

- Stations with \`verificationStatus: unverified\` or \`partial\` in sidecar
- Any custody suite where a force publishes a dedicated desk number (update sidecar + optional \`stations.json\` after review)
- Legal listings left \`unverified\` until admin sets \`set_verification_provenance\`

${legalSection}

## Police station records checked

**${stations.length}** records catalogued; priority queue targets stations missing phone/custody data (see \`data/reports/station-verification-queue.json\`).
`;

writeFileSync(OUT, md);
console.log('Wrote', OUT);
