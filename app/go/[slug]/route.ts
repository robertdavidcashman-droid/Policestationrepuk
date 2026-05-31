import { NextResponse } from 'next/server';
import { resolveGoLink } from '@/lib/short-links';
import { SITE_URL } from '@/lib/seo-layer/config';

export const dynamic = 'force-dynamic';

/** Short links — e.g. `/go/kent` → `/directory/kent`, `/go/find` → `/directory`. */
export async function GET(
  _request: Request,
  context: { params: Promise<{ slug: string }> },
) {
  const { slug } = await context.params;
  const destination = resolveGoLink(slug);
  if (!destination) {
    return NextResponse.redirect(new URL('/directory', SITE_URL), 302);
  }
  return NextResponse.redirect(new URL(destination, SITE_URL), 308);
}
