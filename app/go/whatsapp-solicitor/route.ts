import { NextResponse } from 'next/server';
import { markProspectWaClick } from '@/lib/firm-outreach/storage';
import { WHATSAPP_SOLICITOR_JOIN_URL } from '@/lib/site-navigation';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const ref = url.searchParams.get('ref')?.trim();
  if (ref) {
    await markProspectWaClick(ref).catch(() => undefined);
  }

  const join = new URL(WHATSAPP_SOLICITOR_JOIN_URL);
  if (ref) {
    const text = join.searchParams.get('text') ?? '';
    join.searchParams.set('text', `${text} Ref%3A%20${ref}`);
  }

  return NextResponse.redirect(join.toString(), 302);
}
