import { NextResponse } from 'next/server';
import { runAiReviewBatch } from '@/lib/custody-discovery/ai-review-backlog';
import { reviewFindingWithAi } from '@/lib/custody-discovery/review-pipeline';
import { requireAdmin } from '@/lib/admin-auth';

export const dynamic = 'force-dynamic';
export const maxDuration = 300;

export async function POST(request: Request) {
  const auth = await requireAdmin();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const body = (await request.json()) as {
    action?: 'batch' | 'single';
    findingId?: string;
    force?: boolean;
    limit?: number;
  };

  if (body.action === 'single' && body.findingId) {
    const result = await reviewFindingWithAi(body.findingId, { force: body.force });
    if (!result) {
      return NextResponse.json({ error: 'Finding not found' }, { status: 404 });
    }
    return NextResponse.json({ ok: true, result });
  }

  const limit = Math.min(50, Math.max(1, body.limit ?? 25));
  const batch = await runAiReviewBatch({ limit, force: body.force });
  return NextResponse.json({ ok: true, batch });
}
