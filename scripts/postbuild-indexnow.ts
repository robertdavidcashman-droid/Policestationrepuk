#!/usr/bin/env npx tsx
/**
 * Runs after `next build` on Vercel production deploys.
 * Submits the build-time sitemap to IndexNow (Bing, Yandex, etc.).
 * Failures are logged but do not fail the deployment.
 */
import { submitSitemapToIndexNow } from '../lib/indexnow-pipeline';

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
}

main().catch((err: unknown) => {
  console.error(
    'IndexNow postbuild failed (non-fatal):',
    err instanceof Error ? err.message : err,
  );
});
