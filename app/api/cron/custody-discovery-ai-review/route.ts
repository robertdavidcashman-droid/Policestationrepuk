import { NextResponse } from 'next/server';
import { runAiReviewBatch } from '@/lib/custody-discovery/ai-review-backlog';
import { isCronAuthorized } from '@/lib/cron-auth';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const maxDuration = 300;

function aiBatchLimit(): number {
  return Math.max(1, Number(process.env.CUSTODY_AI_BATCH_LIMIT ?? 12));
}

/**
 * AI-review backlog without running the crawl — keeps findings eligible for
 * the evening digest without competing with suite scanning for the 300s budget.
 *
 * Auth: Bearer ${CRON_SECRET} or x-cron-secret header.
 */
export async function GET(request: Request) {
  if (!isCronAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const aiReview = await runAiReviewBatch({ limit: aiBatchLimit() });
  return NextResponse.json({ ok: true, mode: 'ai-review-only', aiReview });
}
