#!/usr/bin/env npx tsx
/**
 * Manual trigger for the daily Buffer blog scheduler.
 * Usage: npm run buffer:schedule
 *        CRON_SECRET=... curl -H "x-cron-secret: $CRON_SECRET" http://localhost:3000/api/cron/buffer-blog-posts
 */
import { runBufferBlogScheduler } from '../lib/buffer/scheduler';

async function main() {
  const result = await runBufferBlogScheduler();
  console.log(JSON.stringify(result, null, 2));
  if (!result.ok) process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
