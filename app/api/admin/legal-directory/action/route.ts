import { NextResponse } from 'next/server';
import {
  consumeLegalDirectoryAdminToken,
  peekLegalDirectoryAdminToken,
} from '@/lib/legal-directory/admin-action-token';
import {
  applyListingPatch,
  getListingById,
  saveListing,
} from '@/lib/legal-directory/storage';
import {
  sanitizeMultiline,
  sanitizeText,
  sanitizeUrl,
  validateDescription,
  containsScriptOrInjection,
} from '@/lib/legal-directory/sanitize';
import { notifyAdminListingChange } from '@/lib/legal-directory/email';

export const dynamic = 'force-dynamic';

async function readBody(request: Request): Promise<{
  token: string | null;
  action: string | null;
  changes: Record<string, unknown>;
}> {
  const ct = request.headers.get('content-type') ?? '';
  if (ct.includes('application/json')) {
    try {
      const body = (await request.json()) as {
        token?: unknown;
        action?: unknown;
        changes?: Record<string, unknown>;
      };
      return {
        token: typeof body.token === 'string' ? body.token : null,
        action: typeof body.action === 'string' ? body.action : null,
        changes: body.changes ?? {},
      };
    } catch {
      return { token: null, action: null, changes: {} };
    }
  }
  try {
    const form = await request.formData();
    const token = form.get('token');
    const action = form.get('action');
    return {
      token: typeof token === 'string' ? token : null,
      action: typeof action === 'string' ? action : null,
      changes: {},
    };
  } catch {
    return { token: null, action: null, changes: {} };
  }
}

function redirectToAdmin(request: Request, ok: boolean, detail?: string): NextResponse {
  const url = new URL('/admin/legal-directory', request.url);
  url.searchParams.set('action', ok ? 'done' : 'error');
  if (detail) url.searchParams.set('detail', detail);
  return NextResponse.redirect(url, { status: 303 });
}

export async function POST(request: Request) {
  const { token, action, changes } = await readBody(request);
  if (!token) {
    return request.headers.get('content-type')?.includes('application/json')
      ? NextResponse.json({ error: 'Missing token' }, { status: 400 })
      : redirectToAdmin(request, false, 'missing-token');
  }

  const peek = await peekLegalDirectoryAdminToken(token);
  if (!peek.ok) {
    return request.headers.get('content-type')?.includes('application/json')
      ? NextResponse.json({ error: peek.error }, { status: peek.status })
      : redirectToAdmin(request, false, 'invalid-token');
  }

  const listing = await getListingById(peek.payload.listingId);
  if (!listing || listing.status === 'deleted') {
    return request.headers.get('content-type')?.includes('application/json')
      ? NextResponse.json({ error: 'Listing not found' }, { status: 404 })
      : redirectToAdmin(request, false, 'not-found');
  }

  const resolvedAction = action ?? peek.payload.action;

  if (resolvedAction === 'delete') {
    if (peek.payload.action !== 'delete') {
      return NextResponse.json({ error: 'Invalid action for this token' }, { status: 400 });
    }
    const consumed = await consumeLegalDirectoryAdminToken(token);
    if (!consumed.ok) {
      return request.headers.get('content-type')?.includes('application/json')
        ? NextResponse.json({ error: consumed.error }, { status: consumed.status })
        : redirectToAdmin(request, false, 'token-used');
    }

    listing.status = 'deleted';
    listing.deletionRequestedAt = new Date().toISOString();
    await saveListing(listing);
    await notifyAdminListingChange(listing, 'deleted');

    return request.headers.get('content-type')?.includes('application/json')
      ? NextResponse.json({ ok: true, message: 'Listing deleted.' })
      : redirectToAdmin(request, true, 'deleted');
  }

  if (resolvedAction === 'amend') {
    if (peek.payload.action !== 'amend') {
      return NextResponse.json({ error: 'Invalid action for this token' }, { status: 400 });
    }

    const patch: Record<string, unknown> = {};
    if (changes.phone) patch.phone = sanitizeText(changes.phone, 40);
    if (changes.emergencyPhone) patch.emergencyPhone = sanitizeText(changes.emergencyPhone, 40);
    if (changes.businessName) patch.businessName = sanitizeText(changes.businessName, 200);
    if (changes.contactPerson) patch.contactPerson = sanitizeText(changes.contactPerson, 120);
    if (changes.websiteUrl) patch.websiteUrl = sanitizeUrl(changes.websiteUrl);
    if (changes.description) {
      const desc = sanitizeMultiline(changes.description, 4000);
      const err = validateDescription(desc);
      if (err) return NextResponse.json({ error: err }, { status: 400 });
      if (containsScriptOrInjection(desc)) {
        return NextResponse.json({ error: 'Invalid content.' }, { status: 400 });
      }
      patch.description = desc;
    }
    if (changes.areasCovered) patch.areasCovered = sanitizeMultiline(changes.areasCovered, 1500);
    if (changes.specialisms) patch.specialisms = sanitizeMultiline(changes.specialisms, 1000);
    if (changes.county) patch.county = sanitizeText(changes.county, 100);
    if (changes.availability24Hour !== undefined) {
      patch.availability24Hour =
        changes.availability24Hour === true || changes.availability24Hour === 'on';
    }

    const updated = await applyListingPatch(listing, patch);
    await notifyAdminListingChange(updated, 'updated');

    return NextResponse.json({
      ok: true,
      message: 'Listing updated and is live on the directory.',
    });
  }

  return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
}

export function GET() {
  return NextResponse.json(
    { error: 'Method not allowed — use the linked page to confirm.' },
    { status: 405, headers: { Allow: 'POST' } },
  );
}
