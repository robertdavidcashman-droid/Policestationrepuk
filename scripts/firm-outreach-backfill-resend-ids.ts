#!/usr/bin/env npx tsx
/**
 * Backfill resendMessageId on send records missing it (e.g. PSA agent-cover sends).
 * Matches Resend API email list by recipient + subject + sent time.
 *
 *   npx tsx scripts/firm-outreach-backfill-resend-ids.ts
 *   npx tsx scripts/firm-outreach-backfill-resend-ids.ts --apply
 */
import { config } from 'dotenv';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { Resend } from 'resend';

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: resolve(__dirname, '../.env.local') });
config();

const APPLY = process.argv.includes('--apply');
const MAX_DAYS = Number(process.env.FIRM_OUTREACH_BACKFILL_DAYS ?? '14');

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

async function main() {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  if (!apiKey) {
    console.error('[backfill] RESEND_API_KEY not set');
    process.exit(1);
  }

  const { listAllSends, saveSend } = await import('../lib/firm-outreach/storage');
  const resend = new Resend(apiKey);

  const sinceMs = Date.now() - MAX_DAYS * 24 * 60 * 60 * 1000;
  const missing = (await listAllSends()).filter(
    (s) => !s.resendMessageId && s.sentAt && Date.parse(s.sentAt) >= sinceMs,
  );

  console.log(`[backfill] ${missing.length} send(s) missing resendMessageId (last ${MAX_DAYS}d)`);

  const resendEmails: Array<{
    id: string;
    to: string[];
    subject: string;
    created_at: string;
    last_event: string;
  }> = [];

  let hasMore = true;
  let after: string | undefined;
  while (hasMore && resendEmails.length < 2000) {
    const page = await resend.emails.list(after ? { after } : undefined);
    if (page.error) {
      console.error('[backfill] Resend list failed:', page.error);
      process.exit(1);
    }
    const rows = page.data?.data ?? [];
    for (const row of rows) {
      if (Date.parse(row.created_at) < sinceMs) {
        hasMore = false;
        break;
      }
      resendEmails.push({
        id: row.id,
        to: row.to,
        subject: row.subject,
        created_at: row.created_at,
        last_event: row.last_event,
      });
    }
    hasMore = hasMore && (page.data?.has_more ?? false);
    after = rows.at(-1)?.id;
    if (!after || rows.length === 0) break;
  }

  console.log(`[backfill] fetched ${resendEmails.length} Resend email(s)`);

  let matched = 0;
  let updated = 0;

  for (const send of missing) {
    const sentMs = Date.parse(send.sentAt!);
    const hit = resendEmails.find((r) => {
      if (r.subject !== send.subject) return false;
      if (!r.to.some((t) => normalizeEmail(t) === normalizeEmail(send.email))) return false;
      const delta = Math.abs(Date.parse(r.created_at) - sentMs);
      return delta <= 10 * 60 * 1000;
    });

    if (!hit) continue;
    matched++;
    console.log(
      `[backfill] match ${send.id} ${send.email} -> ${hit.id} (${send.campaignId})`,
    );

    if (APPLY) {
      send.resendMessageId = hit.id;
      await saveSend(send);
      updated++;
    }
  }

  console.log(
    JSON.stringify(
      { ok: true, dryRun: !APPLY, missing: missing.length, matched, updated },
      null,
      2,
    ),
  );
}

main().catch((err) => {
  console.error('[backfill] failed:', err);
  process.exit(1);
});
