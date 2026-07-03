#!/usr/bin/env npx tsx
/** One-off: show today's automatic decisions (rejects/duplicates/publishes). */
import { config } from 'dotenv';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: resolve(__dirname, '../.env.vercel.pull'), quiet: true });
config({ path: resolve(__dirname, '../.env.vercel.production'), quiet: true });
config({ path: resolve(__dirname, '../.env.local'), override: true, quiet: true });

async function main() {
  const { getAllFindings, loadAllApprovedNumbers } = await import(
    '../lib/custody-discovery/storage'
  );
  const today = new Date().toISOString().slice(0, 10);
  const findings = await getAllFindings();

  const changedToday = findings.filter(
    (f) =>
      f.updatedAt.startsWith(today) &&
      (f.status === 'rejected' || f.status === 'duplicate' || f.autoPublishedAt?.startsWith(today)),
  );
  for (const f of changedToday) {
    console.log(
      `${f.status.toUpperCase().padEnd(9)} ${f.custodySuiteName} (${f.forceName}) ${f.possiblePhoneNumber} · ${f.sourceDomain}`,
    );
    console.log(`          ${f.notes.split('\n')[0]}`);
  }

  const approved = await loadAllApprovedNumbers();
  const verifiedToday = [...approved.values()].filter(
    (a) => a.lastVerifiedAt.startsWith(today) || a.approvedAt.startsWith(today),
  );
  console.log(`\nApproved records touched today: ${verifiedToday.length}`);
  for (const a of verifiedToday) {
    console.log(
      `  ${a.custodySuiteId} ${a.phoneNumber} · approvedBy ${a.approvedBy} · ${a.verificationStatus} · last audit: ${a.auditLog?.at(-1)?.action ?? '—'}`,
    );
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
