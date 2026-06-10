#!/usr/bin/env node
/**
 * Fail CI when partner site hrefs omit utm_source= in app/components (excluding promo modules).
 * Usage: node scripts/audit/partner-utm-guard.mjs
 */
import { execSync } from 'node:child_process';

const PARTNER_PATTERN = 'custodynote\\.com|psrtrain\\.com|policestationagent\\.com';
const EXCLUDE_GLOBS = [
  '!*promo*',
  '!lib/utm.ts',
  '!lib/buffer/**',
  '!lib/assistant/**',
  '!lib/blog/**',
  '!lib/external-seo-redirects.ts',
  '!lib/site-navigation.ts',
  '!scripts/**',
  '!__tests__/**',
  '!docs/**',
  '!audit/**',
  '!data/**',
  '!content/**',
  '!app/api/**',
];

function lineHasPartnerHref(line) {
  return /href\s*=\s*["'{`][^"'`}]*(?:custodynote\.com|psrtrain\.com|policestationagent\.com)/i.test(line);
}

function hrefHasUtm(line) {
  return (
    line.includes('utm_source=') ||
    line.includes('POLICESTATIONAGENT_') ||
    line.includes('CUSTODYNOTE_') ||
    line.includes('PSRTRAIN_') ||
    line.includes('psaHref') ||
    line.includes('psrTrainHref') ||
    line.includes('cnHref') ||
    line.includes('PartnerOutboundLink')
  );
}

try {
  const cmd = `rg -n "${PARTNER_PATTERN}" app components lib --glob '${EXCLUDE_GLOBS.join("' --glob '")}' || true`;
  const out = execSync(cmd, { encoding: 'utf8', shell: '/bin/bash' }).trim();
  if (!out) {
    console.log('partner-utm-guard: no partner URLs in scoped paths');
    process.exit(0);
  }

  const bad = out
    .split('\n')
    .filter((line) => line.trim())
    .filter((line) => lineHasPartnerHref(line) && !hrefHasUtm(line));

  if (bad.length > 0) {
    console.error('Partner hrefs missing UTMs (use promo modules or appendUtm):\n');
    console.error(bad.join('\n'));
    process.exit(1);
  }

  console.log('partner-utm-guard: OK');
} catch (err) {
  console.error(err);
  process.exit(1);
}
