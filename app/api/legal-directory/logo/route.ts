import crypto from 'node:crypto';
import { put } from '@vercel/blob';
import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

const MAX_BYTES = 512 * 1024;
const ALLOWED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);

/**
 * Upload a firm logo for the Legal Services Directory (JPEG/PNG/WebP, max 512KB).
 * Requires BLOB_READ_WRITE_TOKEN in production.
 */
export async function POST(request: Request) {
  if (!process.env.BLOB_READ_WRITE_TOKEN?.trim()) {
    return NextResponse.json(
      { error: 'Logo uploads are not configured on this environment.' },
      { status: 503 },
    );
  }

  const form = await request.formData();
  const file = form.get('file');
  if (!(file instanceof File)) {
    return NextResponse.json({ error: 'Missing file field.' }, { status: 400 });
  }

  if (!ALLOWED_TYPES.has(file.type)) {
    return NextResponse.json({ error: 'Logo must be JPEG, PNG, or WebP.' }, { status: 400 });
  }

  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: 'Logo must be 512KB or smaller.' }, { status: 400 });
  }

  const ext = file.type === 'image/png' ? 'png' : file.type === 'image/webp' ? 'webp' : 'jpg';
  const pathname = `legal-directory/logos/${Date.now()}-${crypto.randomUUID().slice(0, 8)}.${ext}`;

  try {
    const blob = await put(pathname, file, {
      access: 'public',
      contentType: file.type,
      addRandomSuffix: false,
    });
    return NextResponse.json({ ok: true, url: blob.url });
  } catch (err) {
    console.error('[legal-directory/logo]', err);
    return NextResponse.json({ error: 'Upload failed.' }, { status: 500 });
  }
}
