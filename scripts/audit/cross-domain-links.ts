#!/usr/bin/env npx tsx
/**
 * Validate reciprocal cross-links and UTM params across the Defence Legal network.
 * Usage: npm run audit:cross-domain-links
 */
import { auditCrossDomainLinks } from '../../lib/audit/cross-domain-links';

async function main() {
  const report = await auditCrossDomainLinks();
  console.log(JSON.stringify(report, null, 2));
  if (!report.ok) process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
