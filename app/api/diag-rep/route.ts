import { NextResponse } from 'next/server';
import { getRepBySlug, getAllReps } from '@/lib/data';

// TEMPORARY: diagnostic endpoint to capture the actual error thrown when
// /rep/[slug] tries to render. Remove once root cause is identified.
export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const url = new URL(req.url);
  const slug = url.searchParams.get('slug') || 'some-fake-slug';
  const out: Record<string, unknown> = {
    kvHost: (process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL || '').replace(/^https?:\/\//, ''),
    requested: slug,
  };
  try {
    const all = await getAllReps();
    out.allReps = all.length;
    out.allRepEmails = all.map((r) => r.email);
  } catch (err) {
    out.getAllRepsError = err instanceof Error ? `${err.message}\n${err.stack}` : String(err);
  }
  try {
    const rep = await getRepBySlug(slug);
    out.repFound = !!rep;
    if (rep) {
      out.repName = rep.name;
      out.repEmail = rep.email;
    }
  } catch (err) {
    out.getRepBySlugError = err instanceof Error ? `${err.message}\n${err.stack}` : String(err);
  }
  return NextResponse.json(out, { status: 200 });
}
