/**
 * One-shot: email Steven Gilbert after correcting his listing.
 * Loads .env.local then Resend (via lib/email).
 *
 *   npx tsx scripts/send-steven-gilbert-listing-notice.ts
 */
import path from 'node:path';
import { config } from 'dotenv';

config({ path: path.join(process.cwd(), '.env.local') });

async function main() {
  const { sendRepListingUpdateNotice } = await import('../lib/email');
  const ok = await sendRepListingUpdateNotice({
    toEmail: 'sdglegalservices@outlook.com',
    repName: 'Steven',
    profileUrl: 'https://policestationrepuk.com/rep/steven-gilbert-sdglegal',
    listingEmail: 'sdglegalservices@outlook.com',
    websiteHostname: 'sdglegalservices.co.uk',
    websiteHref: 'https://sdglegalservices.co.uk',
    phoneDisplay: '07759 348024',
  });
  console.log(ok ? 'Email sent.' : 'Not sent — set RESEND_API_KEY in .env.local');
  process.exit(ok ? 0 : 1);
}

main();
