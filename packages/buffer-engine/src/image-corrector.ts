import { mkdirSync, writeFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import sharp from 'sharp';
import {
  BUFFER_MAX_IMAGE_BYTES,
  isJpegOrPngMagicBytes,
  probeBufferImageUrl,
  probeGoogleBusinessImageUrl,
} from './image-url';
import type { CorrectedImageResult } from './types';

export interface ImageCorrectorOptions {
  siteId: string;
  siteUrl: string;
  slug: string;
  sourceImageUrl?: string;
  publicDir?: string;
  fetchFn?: typeof fetch;
  preferPng?: boolean;
}

async function fetchImageBytes(url: string, fetchFn: typeof fetch): Promise<Buffer> {
  const res = await fetchFn(url, {
    redirect: 'follow',
    signal: AbortSignal.timeout(30_000),
  });
  if (!res.ok) throw new Error(`Failed to fetch image: HTTP ${res.status}`);
  return Buffer.from(await res.arrayBuffer());
}

async function transcodeToCompliant(
  input: Buffer,
  preferPng: boolean,
): Promise<{ buffer: Buffer; contentType: 'image/jpeg' | 'image/png' }> {
  let quality = 82;
  let width = 1600;

  for (let attempt = 0; attempt < 8; attempt++) {
    const pipeline = sharp(input).rotate().resize({ width, withoutEnlargement: true });
    const buffer = preferPng
      ? await pipeline.png({ compressionLevel: 9 }).toBuffer()
      : await pipeline.jpeg({ quality, mozjpeg: true }).toBuffer();

    if (buffer.length <= BUFFER_MAX_IMAGE_BYTES && isJpegOrPngMagicBytes(new Uint8Array(buffer))) {
      return {
        buffer,
        contentType: preferPng ? 'image/png' : 'image/jpeg',
      };
    }

    quality = Math.max(55, quality - 8);
    width = Math.max(800, Math.floor(width * 0.85));
  }

  const buffer = await sharp(input)
    .rotate()
    .resize({ width: 720, withoutEnlargement: true })
    .jpeg({ quality: 70, mozjpeg: true })
    .toBuffer();

  return { buffer, contentType: 'image/jpeg' };
}

/**
 * Ensure a post image is Buffer-compliant. Writes to public/images/buffer/{siteId}/{slug}.jpg
 * and returns the public URL.
 */
export async function ensureCompliantPostImage(
  options: ImageCorrectorOptions,
): Promise<CorrectedImageResult | null> {
  const fetchFn = options.fetchFn ?? fetch;
  const publicDir = options.publicDir ?? join(process.cwd(), 'public');
  const relPath = `images/buffer/${options.siteId}/${options.slug}.jpg`;
  const absPath = join(publicDir, relPath);
  const publicUrl = `${options.siteUrl.replace(/\/$/, '')}/${relPath}`;

  if (options.sourceImageUrl?.trim()) {
    const probe = await probeBufferImageUrl(options.sourceImageUrl, fetchFn, options.siteUrl);
    if (probe.ok) {
      return {
        publicUrl: options.sourceImageUrl.trim(),
        publicPath: relPath,
        contentType: probe.contentType?.includes('png') ? 'image/png' : 'image/jpeg',
        bytes: probe.contentLength ?? 0,
      };
    }
  }

  if (!options.sourceImageUrl?.trim()) return null;

  try {
    const raw = await fetchImageBytes(options.sourceImageUrl, fetchFn);
    const { buffer, contentType } = await transcodeToCompliant(raw, options.preferPng ?? false);
    mkdirSync(dirname(absPath), { recursive: true });
    writeFileSync(absPath, buffer);

    const verify = await probeBufferImageUrl(publicUrl, fetchFn, options.siteUrl);
    if (!verify.ok) return null;

    return {
      publicUrl,
      publicPath: relPath,
      contentType,
      bytes: buffer.length,
    };
  } catch {
    return null;
  }
}

export async function ensureCompliantGoogleBusinessImage(
  imageUrl: string,
  siteUrl: string,
  fetchFn: typeof fetch = fetch,
): Promise<string | undefined> {
  const probe = await probeGoogleBusinessImageUrl(imageUrl, fetchFn, siteUrl);
  if (probe.ok) return imageUrl;
  return undefined;
}

export function correctedImageExists(publicDir: string, siteId: string, slug: string): boolean {
  return existsSync(join(publicDir, 'images', 'buffer', siteId, `${slug}.jpg`));
}
