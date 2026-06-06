/**
 * Audit Legal Services Directory data for duplicate LAA imports and KV shadow listings.
 *
 * Usage:
 *   npx tsx scripts/audit-legal-directory.ts
 */
import { config } from 'dotenv';
import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import {
  auditKvListings,
  auditLaaJsonRecords,
  type KvListingAuditResult,
  type LaaJsonAuditResult,
} from '../lib/legal-directory/laa-dedupe';
import type { LaaProviderRecord } from '../lib/legal-directory/laa-seed';
import { listAllListings } from '../lib/legal-directory/storage';

config({ path: resolve(dirname(fileURLToPath(import.meta.url)), '../.env.local') });
config();

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const JSON_PATH = resolve(ROOT, 'data/laa-crime-providers.json');
const OUT_JSON = resolve(ROOT, 'data/reports/legal-directory-audit.json');
const OUT_MD = resolve(ROOT, 'data/reports/legal-directory-audit.md');

function loadJsonRecords(): LaaProviderRecord[] {
  try {
    return JSON.parse(readFileSync(JSON_PATH, 'utf-8')) as LaaProviderRecord[];
  } catch {
    console.warn(`[audit] Could not read ${JSON_PATH}`);
    return [];
  }
}

function markdownReport(jsonAudit: LaaJsonAuditResult, kvAudit: KvListingAuditResult | null): string {
  const lines = [
    '# Legal Services Directory audit',
    '',
    `Generated: ${new Date().toISOString()}`,
    '',
    '## Static LAA JSON',
    '',
    '| Metric | Count |',
    '|--------|------:|',
    `| Total records | ${jsonAudit.totalRecords} |`,
    `| Unique offices (firm + postcode) | ${jsonAudit.uniqueOffices} |`,
    `| Duplicate office groups | ${jsonAudit.duplicateOfficeGroups} |`,
    `| Shadow rows (no town, paired duplicate) | ${jsonAudit.shadowRows.length} |`,
    `| Multi-town / same-postcode conflicts | ${jsonAudit.multiTownConflicts.length} |`,
    '',
  ];

  if (jsonAudit.multiTownConflicts.length) {
    lines.push('### Multi-town conflicts', '');
    for (const c of jsonAudit.multiTownConflicts) {
      lines.push(`- **${c.firmName}** (${c.postcode}): ${c.towns.join(' vs ')}`);
    }
    lines.push('');
  }

  lines.push('## KV listings', '');
  if (!kvAudit) {
    lines.push('_KV not configured — skipped._', '');
  } else {
    lines.push(
      '| Metric | Count |',
      '|--------|------:|',
      `| Total listings | ${kvAudit.totalListings} |`,
      `| Approved listings | ${kvAudit.approvedListings} |`,
      `| User-submitted (non-LAA) | ${kvAudit.userSubmitted} |`,
      `| Shadow duplicates (removable) | ${kvAudit.shadowDuplicates.length} |`,
      `| Claimed shadows (manual review) | ${kvAudit.claimedShadows.length} |`,
      '',
    );
    if (kvAudit.shadowDuplicates.length) {
      lines.push('### Sample shadow duplicates', '');
      for (const pair of kvAudit.shadowDuplicates.slice(0, 10)) {
        lines.push(
          `- Shadow \`${pair.shadow.id}\` → keep \`${pair.canonical.id}\` (${pair.canonical.businessName}, ${pair.canonical.postcode})`,
        );
      }
      lines.push('');
    }
  }

  const clean =
    jsonAudit.shadowRows.length === 0 &&
    jsonAudit.multiTownConflicts.length === 0 &&
    (!kvAudit || kvAudit.shadowDuplicates.length === 0);

  lines.push(clean ? '**Status: clean** — no shadow duplicates detected.' : '**Status: action required** — see counts above.');
  lines.push('');
  return lines.join('\n');
}

async function main() {
  const jsonRecords = loadJsonRecords();
  const jsonAudit = auditLaaJsonRecords(jsonRecords);

  let kvAudit: KvListingAuditResult | null = null;
  try {
    const listings = await listAllListings();
    kvAudit = auditKvListings(listings);
  } catch (err) {
    console.warn('[audit] KV listing audit skipped:', err instanceof Error ? err.message : err);
  }

  const payload = {
    generatedAt: new Date().toISOString(),
    json: jsonAudit,
    kv: kvAudit,
  };

  mkdirSync(dirname(OUT_JSON), { recursive: true });
  writeFileSync(OUT_JSON, JSON.stringify(payload, null, 2) + '\n');
  writeFileSync(OUT_MD, markdownReport(jsonAudit, kvAudit));

  console.log('[audit] JSON records:', jsonAudit.totalRecords, '→ unique offices:', jsonAudit.uniqueOffices);
  console.log('[audit] Shadow rows in JSON:', jsonAudit.shadowRows.length);
  console.log('[audit] Multi-town conflicts:', jsonAudit.multiTownConflicts.length);
  if (kvAudit) {
    console.log('[audit] KV approved listings:', kvAudit.approvedListings);
    console.log('[audit] KV shadow duplicates:', kvAudit.shadowDuplicates.length);
  } else {
    console.log('[audit] KV audit skipped (not configured)');
  }
  console.log(`[audit] wrote ${OUT_JSON}`);
  console.log(`[audit] wrote ${OUT_MD}`);
}

main().catch((err) => {
  console.error('[audit] failed:', err);
  process.exit(1);
});
