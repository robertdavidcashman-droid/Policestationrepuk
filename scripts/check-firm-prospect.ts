import { config } from 'dotenv';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: resolve(__dirname, '../.env.local') });

async function main() {
  const name = process.argv[2] ?? 'Kingsley Napley';
  const { listAllProspectIds, getProspect } = await import('../lib/firm-outreach/storage');
  const { websiteIndicatesCrimePractice } = await import('../lib/firm-outreach/crime-website-verify');
  const ids = await listAllProspectIds();
  for (const id of ids) {
    const p = await getProspect(id);
    if (!p?.firmName?.toLowerCase().includes(name.toLowerCase())) continue;
    const crime = p.websiteUrl ? await websiteIndicatesCrimePractice(p.websiteUrl) : false;
    console.log(JSON.stringify({ firmName: p.firmName, status: p.status, sources: p.sources, websiteUrl: p.websiteUrl, excludedReason: p.excludedReason, crimeWebsiteVerified: p.crimeWebsiteVerified, websiteCheck: crime, email: p.email }, null, 2));
  }
}

main();
