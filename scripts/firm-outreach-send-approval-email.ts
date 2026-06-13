#!/usr/bin/env npx tsx
/** Send today's outreach approval request email (dry-run KV/Resend check). */
import { config } from 'dotenv';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: resolve(__dirname, '../.env.local') });
config({ path: resolve(__dirname, '../.env.vercel.production') });
config();

async function main() {
  const force = process.argv.includes('--force');
  const { sendOutreachApprovalRequestEmail } = await import(
    '../lib/firm-outreach/outreach/approval-request-email'
  );
  const result = await sendOutreachApprovalRequestEmail({ force });
  console.log('[firm-outreach approval]', JSON.stringify(result, null, 2));
  process.exit(result.sent ? 0 : 1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
