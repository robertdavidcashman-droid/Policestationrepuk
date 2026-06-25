#!/usr/bin/env npx tsx
/**
 * Runs after `next build` on Vercel production deploys.
 * Submits the build-time sitemap to IndexNow (Bing, Yandex, etc.).
 * Failures are logged but do not fail the deployment.
 */
import { submitSitemapToIndexNow } from '../lib/indexnow-pipeline';
import { getSitemapUrlList } from '../lib/sitemap-build';
import { submitToBing } from '../lib/bing-submit';

async function main() {
  if (process.env.VERCEL_ENV !== 'production') {
    console.log('IndexNow postbuild: skip (not Vercel production)');
    return;
  }
  if (process.env.INDEXNOW_DISABLE === '1') {
    console.log('IndexNow postbuild: skip (INDEXNOW_DISABLE=1)');
    return;
  }

  const result = await submitSitemapToIndexNow({ source: 'build' });
  console.log(
    `IndexNow postbuild: ok (${result.status}) — ${result.submitted} URL(s) in ${result.batches} batch(es); key ${result.keyLocation}`,
  );

  const bing = await submitToBing(await getSitemapUrlList());
  if (bing.skipped) {
    console.log('Bing postbuild: skip (no BING_WEBMASTER_API_KEY; IndexNow covers Bing)');
  } else if (bing.ok) {
    console.log(`Bing postbuild: ok — ${bing.submitted} URL(s) in ${bing.batches} batch(es)`);
  } else {
    console.log(`Bing postbuild: non-fatal — ${bing.message}`);
  }
}

main().catch((err: unknown) => {
  console.error(
    'IndexNow postbuild failed (non-fatal):',
    err instanceof Error ? err.message : err,
  );
});
