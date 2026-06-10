#!/usr/bin/env node
/**
 * Fail when blog article markdown links to sister sites without utm_source.
 * Usage: node scripts/audit/blog-partner-utm.mjs
 */
import { execSync } from 'node:child_process';

const PARTNER_PATTERN = 'custodynote\\.com|psrtrain\\.com|policestationagent\\.com';

try {
  const cmd = `rg -n "${PARTNER_PATTERN}" lib/blog -g 'articles-batch*.ts' || true`;
  const out = execSync(cmd, { encoding: 'utf8', shell: '/bin/bash' }).trim();
  if (!out) {
    console.log('blog-partner-utm: no partner URLs in blog articles');
    process.exit(0);
  }

  const bad = out
    .split('\n')
    .filter((line) => line.trim())
    .filter(
      (line) =>
        !line.includes('utm_source=') &&
        !line.includes('PSA_PUBLIC_HREF') &&
        !line.includes('POLICESTATIONAGENT') &&
        !line.includes('policestationagent-promo'),
    );

  if (bad.length > 0) {
    console.error('Blog articles with bare partner URLs:\n');
    console.error(bad.join('\n'));
    process.exit(1);
  }

  console.log('blog-partner-utm: OK');
} catch (err) {
  console.error(err);
  process.exit(1);
}
