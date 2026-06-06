/**
 * Remove duplicate LAA shadow listings from KV (empty town + richer canonical twin).
 *
 * Dry-run by default. Pass --apply to delete unclaimed shadows.
 *
 * Usage:
 *   npx tsx scripts/clean-legal-directory-duplicates.ts
 *   npx tsx scripts/clean-legal-directory-duplicates.ts --apply
 */
import { config } from 'dotenv';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { auditKvListings } from '../lib/legal-directory/laa-dedupe';
import { isUnclaimedSeededListing } from '../lib/legal-directory/laa-seed';
import {
  getListingById,
  hardRemoveListingFromDirectory,
  listAllListings,
} from '../lib/legal-directory/storage';
import { getDirectoryStore } from '../lib/legal-directory/store';

config({ path: resolve(dirname(fileURLToPath(import.meta.url)), '../.env.local') });
config();

async function main() {
  const apply = process.argv.includes('--apply');
  const store = getDirectoryStore();

  if (apply && !store?.durable) {
    console.error(
      '[laa-clean] ABORT: Upstash KV not configured. Set UPSTASH_REDIS_REST_URL/TOKEN in .env.local.',
    );
    process.exit(1);
  }

  const listings = await listAllListings();
  const audit = auditKvListings(listings);

  console.log(`[laa-clean] mode: ${apply ? 'APPLY' : 'DRY-RUN'}`);
  console.log(`[laa-clean] approved listings: ${audit.approvedListings}`);
  console.log(`[laa-clean] removable shadow duplicates: ${audit.shadowDuplicates.length}`);
  console.log(`[laa-clean] claimed shadows (skipped): ${audit.claimedShadows.length}`);

  if (audit.claimedShadows.length) {
    for (const ref of audit.claimedShadows) {
      console.warn(`  ! claimed shadow — manual review: ${ref.id} (${ref.businessName})`);
    }
  }

  let removed = 0;
  for (const { shadow, canonical } of audit.shadowDuplicates) {
    const listing = await getListingById(shadow.id);
    if (!listing) continue;
    if (!isUnclaimedSeededListing(listing)) {
      console.warn(`  ! skip non-seed listing: ${shadow.id}`);
      continue;
    }

    console.log(
      `  ${apply ? 'remove' : 'would remove'} ${shadow.id} → keep ${canonical.id} (${canonical.businessName}, ${canonical.postcode})`,
    );

    if (apply) {
      await hardRemoveListingFromDirectory(listing);
      removed++;
      await new Promise((r) => setTimeout(r, 40));
    }
  }

  if (apply) {
    console.log(`[laa-clean] removed ${removed} shadow listing(s)`);
  } else if (audit.shadowDuplicates.length) {
    console.log('[laa-clean] dry-run complete. Re-run with --apply to delete shadows.');
  } else {
    console.log('[laa-clean] nothing to remove.');
  }
}

main().catch((err) => {
  console.error('[laa-clean] failed:', err);
  process.exit(1);
});
