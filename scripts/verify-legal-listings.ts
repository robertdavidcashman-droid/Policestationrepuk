/**
 * Re-verify all Legal Services Directory provider listings against public registers.
 *
 * Usage:
 *   npx tsx scripts/verify-legal-listings.ts              # dry-run summary
 *   npx tsx scripts/verify-legal-listings.ts --apply      # persist to KV
 *   npx tsx scripts/verify-legal-listings.ts --limit=20   # cap listings checked
 */
import 'dotenv/config';
import { deriveListingVerification } from '../lib/legal-directory/auto-verify';
import { computeListingVerification } from '../lib/legal-directory/verification-sources';
import { listAllListings, saveListing } from '../lib/legal-directory/storage';

const APPLY = process.argv.includes('--apply');
const LIMIT = Number(process.argv.find((a) => a.startsWith('--limit='))?.split('=')[1] || '0');

async function main() {
  const all = await listAllListings();
  const slice = LIMIT ? all.slice(0, LIMIT) : all;

  console.log(`Mode: ${APPLY ? 'APPLY' : 'dry-run'} | listings: ${slice.length}/${all.length}`);

  let verified = 0;
  let newlyVerified = 0;
  let updated = 0;

  for (const listing of slice) {
    if (listing.status === 'deleted') continue;

    const { sources, verification } = await deriveListingVerification({
      businessName: listing.businessName,
      contactPerson: listing.contactPerson,
      regulatoryBody: listing.regulatoryBody,
      regulatoryNumber: listing.regulatoryNumber,
    });

    const mergedSources = sources.length ? sources : listing.verificationSources ?? [];
    const derived = sources.length ? verification : computeListingVerification(mergedSources);

    const changed =
      listing.verificationStatus !== derived.status ||
      listing.dateVerified !== derived.dateVerified ||
      JSON.stringify(listing.verificationSources ?? []) !== JSON.stringify(mergedSources);

    if (derived.status === 'verified') verified++;
    if (derived.status === 'verified' && listing.verificationStatus !== 'verified') newlyVerified++;

    if (changed) {
      console.log(
        `  ${listing.businessName}: ${listing.verificationStatus} → ${derived.status}` +
          (derived.primarySource ? ` (${derived.primarySource.type})` : ''),
      );
      updated++;

      if (APPLY) {
        await saveListing({
          ...listing,
          verificationSources: mergedSources,
          verificationStatus: derived.status,
          dateVerified: derived.dateVerified,
          sourceUrl: derived.primarySource?.url || listing.sourceUrl,
        });
        await new Promise((r) => setTimeout(r, 50));
      }
    }
  }

  console.log(`\nVerified: ${verified} | newly verified: ${newlyVerified} | updated: ${updated}`);
  if (!APPLY) console.log('Dry-run. Re-run with --apply to persist.');
}

main().catch((err) => {
  console.error('[verify-legal-listings]', err);
  process.exit(1);
});
