/**
 * Export approved legal directory listings for offline verification review.
 * npx tsx scripts/export-legal-directory-listings.ts
 */
import { writeFileSync, mkdirSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { listApprovedListings } from '../lib/legal-directory/storage';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const OUT = resolve(ROOT, 'data/reports/legal-directory-export.json');

async function main() {
  const listings = await listApprovedListings();
  const payload = {
    exportedAt: new Date().toISOString(),
    count: listings.length,
    listings: listings.map((l) => ({
      id: l.id,
      businessName: l.businessName,
      slug: l.slug,
      categorySlug: l.categorySlug,
      town: l.town,
      county: l.county,
      phone: l.phone,
      websiteUrl: l.websiteUrl,
      regulatoryBody: l.regulatoryBody,
      regulatoryNumber: l.regulatoryNumber,
      sourceUrl: l.sourceUrl,
      dateVerified: l.dateVerified,
      verificationStatus: l.verificationStatus,
      verified: l.verified,
    })),
  };
  mkdirSync(resolve(ROOT, 'data/reports'), { recursive: true });
  writeFileSync(OUT, JSON.stringify(payload, null, 2) + '\n');
  console.log(`Exported ${listings.length} listings to ${OUT}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
