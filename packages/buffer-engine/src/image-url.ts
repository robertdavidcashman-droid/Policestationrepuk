import type { BufferChannelService } from './types';
import { existsSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

export const BUFFER_MAX_IMAGE_BYTES = 5 * 1024 * 1024;

const GOOGLE_BUSINESS_CONTENT_TYPES = new Set(['image/jpeg', 'image/png']);

export const GOOGLE_BUSINESS_RASTER_FALLBACK =
  'https://www.policestationagent.com/blog-images/blog-listing-0.jpg';

export const GBP_FEED_IDS = [
  'policestationrepuk',
  'custodynote',
  'psrtrain',
  'policestationagent',
] as const;

const ACCEPTED_CONTENT_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/heic',
  'image/heif',
]);

export interface BufferImageProbeResult {
  ok: boolean;
  contentType?: string;
  contentLength?: number;
  reason?: string;
}

export class BufferPostImageError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'BufferPostImageError';
  }
}

export function googleBusinessFeedFallbackUrl(feedId: string, siteUrl: string): string {
  return `${siteUrl.replace(/\/$/, '')}/images/buffer/gbp/${feedId}-default.jpg`;
}

export function buildGoogleBusinessFeedFallbacks(siteUrl: string): Record<string, string> {
  return Object.fromEntries(GBP_FEED_IDS.map((id) => [id, googleBusinessFeedFallbackUrl(id, siteUrl)]));
}

export function isGoogleBusinessImageContentType(contentType: string | null | undefined): boolean {
  if (!contentType) return false;
  const base = contentType.split(';')[0]?.trim().toLowerCase();
  return !!base && GOOGLE_BUSINESS_CONTENT_TYPES.has(base);
}

function publicFilePathFromSiteUrl(url: string, siteUrl: string): string | null {
  try {
    const siteHost = new URL(siteUrl.replace(/\/$/, '')).hostname;
    const parsed = new URL(url);
    if (parsed.hostname !== siteHost) return null;
    return join(process.cwd(), 'public', parsed.pathname);
  } catch {
    return null;
  }
}

export function probeLocalPublicImageUrl(
  url: string,
  siteUrl: string,
): BufferImageProbeResult | null {
  const localPath = publicFilePathFromSiteUrl(url, siteUrl);
  if (!localPath || !existsSync(localPath)) return null;

  const stat = statSync(localPath);
  if (stat.size > BUFFER_MAX_IMAGE_BYTES) {
    return { ok: false, contentLength: stat.size, reason: 'image too large' };
  }

  const bytes = readFileSync(localPath).subarray(0, 16);
  if (!isJpegOrPngMagicBytes(bytes)) {
    return { ok: false, reason: 'Google Business requires JPEG/PNG file bytes (magic-byte check failed)' };
  }

  const contentType = /\.png(\?|$)/i.test(url) ? 'image/png' : 'image/jpeg';
  return { ok: true, contentType, contentLength: stat.size };
}

export function isJpegOrPngMagicBytes(bytes: Uint8Array): boolean {
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    return true;
  }
  if (
    bytes.length >= 4 &&
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47
  ) {
    return true;
  }
  return false;
}

function isLocalSiteHost(hostname: string, siteUrl: string): boolean {
  try {
    return hostname === new URL(siteUrl.replace(/\/$/, '')).hostname;
  } catch {
    return false;
  }
}

function isExternalFeedHost(hostname: string): boolean {
  return /(?:^|\.)custodynote\.com$|(?:^|\.)psrtrain\.com$|(?:^|\.)policestationagent\.com$/i.test(
    hostname,
  );
}

export function googleBusinessImageCandidates(
  imageUrl: string,
  siteUrl: string,
  feedId?: string,
): string[] {
  const trimmed = imageUrl.trim();
  const out: string[] = [];
  const base = siteUrl.replace(/\/$/, '');
  const fallbacks = buildGoogleBusinessFeedFallbacks(siteUrl);

  let isLocal = false;
  let isExternal = false;
  try {
    const host = new URL(trimmed).hostname;
    isLocal = isLocalSiteHost(host, siteUrl);
    isExternal = isExternalFeedHost(host);
  } catch {
    if (trimmed.startsWith('/')) isLocal = true;
  }

  if (/\.(jpe?g|png)(\?|$)/i.test(trimmed) && (isLocal || !isExternal)) {
    out.push(trimmed);
  }

  if (isLocal && /\.webp(\?|$)/i.test(trimmed)) {
    out.push(trimmed.replace(/\.webp(\?.*)?$/i, '.jpg$1'));
    if (/-768\.webp(\?|$)/i.test(trimmed)) {
      out.push(trimmed.replace(/-768\.webp(\?.*)?$/i, '.jpg$1'));
      out.push(trimmed.replace(/-768\.webp(\?.*)?$/i, '-768.jpg$1'));
    } else {
      out.push(trimmed.replace(/\.webp(\?.*)?$/i, '-768.jpg$1'));
    }
    out.push(`${base}/social-preview.jpg`);
  }

  if (feedId && fallbacks[feedId]) {
    out.push(fallbacks[feedId]!);
  } else if (isLocal) {
    out.push(`${base}/social-preview.jpg`);
  }

  if (isExternal && feedId && fallbacks[feedId]) {
    const hosted = fallbacks[feedId]!;
    if (!out.includes(hosted)) out.unshift(hosted);
  }

  out.push(GOOGLE_BUSINESS_RASTER_FALLBACK);
  return [...new Set(out.filter(Boolean))];
}

function googleBusinessRejectReason(input: {
  status: number;
  contentType?: string;
  contentLength?: number;
  magicOk?: boolean;
}): string | undefined {
  if (input.status < 200 || input.status >= 300) return `HTTP ${input.status}`;
  if (!input.contentType || !isGoogleBusinessImageContentType(input.contentType)) {
    return `Google Business requires JPEG/PNG (got ${input.contentType ?? 'none'})`;
  }
  if (input.magicOk === false) {
    return 'Google Business requires JPEG/PNG file bytes (magic-byte check failed)';
  }
  if (input.contentLength != null && input.contentLength > BUFFER_MAX_IMAGE_BYTES) {
    const mb = (input.contentLength / (1024 * 1024)).toFixed(1);
    return `image too large (${mb}MB; Buffer limit 5MB)`;
  }
  return undefined;
}

async function verifyGoogleBusinessMagicBytes(url: string, fetchFn: typeof fetch): Promise<boolean> {
  const res = await fetchFn(url, {
    method: 'GET',
    redirect: 'follow',
    signal: AbortSignal.timeout(25_000),
    headers: { Range: 'bytes=0-15' },
  });
  if (!res.ok) return false;
  const buf = new Uint8Array(await res.arrayBuffer());
  return isJpegOrPngMagicBytes(buf);
}

export async function probeGoogleBusinessImageUrl(
  url: string,
  fetchFn: typeof fetch = fetch,
  siteUrl?: string,
): Promise<BufferImageProbeResult> {
  const trimmed = url?.trim();
  if (!trimmed) return { ok: false, reason: 'empty url' };

  if (siteUrl) {
    const local = probeLocalPublicImageUrl(trimmed, siteUrl);
    if (local) return local;
  }

  try {
    let res = await fetchFn(trimmed, {
      method: 'HEAD',
      redirect: 'follow',
      signal: AbortSignal.timeout(20_000),
    });

    let contentType = res.headers.get('content-type') ?? undefined;
    let contentLength = parseContentLength(res.headers.get('content-length') ?? null);

    if (res.ok && contentType && isGoogleBusinessImageContentType(contentType) && contentLength == null) {
      res = await fetchFn(trimmed, {
        method: 'GET',
        redirect: 'follow',
        signal: AbortSignal.timeout(25_000),
        headers: { Range: 'bytes=0-0' },
      });
      contentType = res.headers.get('content-type') ?? contentType;
      const rangeTotal = res.headers.get('content-range');
      const m = rangeTotal?.match(/\/(\d+)$/);
      if (m?.[1]) contentLength = parseInt(m[1], 10);
    }

    let magicOk: boolean | undefined;
    if (res.ok && contentType && isGoogleBusinessImageContentType(contentType)) {
      magicOk = await verifyGoogleBusinessMagicBytes(trimmed, fetchFn);
    }

    const reason = googleBusinessRejectReason({ status: res.status, contentType, contentLength, magicOk });
    if (reason) return { ok: false, contentType, contentLength, reason };
    return { ok: true, contentType, contentLength };
  } catch (err) {
    return { ok: false, reason: err instanceof Error ? err.message : 'probe failed' };
  }
}

export async function resolveGoogleBusinessImageUrl(
  imageUrl: string,
  fetchFn: typeof fetch = fetch,
  siteUrl: string,
  feedId?: string,
): Promise<string | undefined> {
  for (const candidate of googleBusinessImageCandidates(imageUrl, siteUrl, feedId)) {
    const probe = await probeGoogleBusinessImageUrl(candidate, fetchFn, siteUrl);
    if (probe.ok) return candidate;
  }
  return undefined;
}

export async function resolveGoogleBusinessImageUrlForPost(
  post: { feedId: string; imageUrl?: string },
  fetchFn: typeof fetch = fetch,
  siteUrl: string,
): Promise<string | undefined> {
  if (!post.imageUrl?.trim()) return undefined;
  return resolveGoogleBusinessImageUrl(post.imageUrl, fetchFn, siteUrl, post.feedId);
}

export function isBufferCompatibleContentType(contentType: string | null | undefined): boolean {
  if (!contentType) return false;
  const base = contentType.split(';')[0]?.trim().toLowerCase();
  return !!base && ACCEPTED_CONTENT_TYPES.has(base);
}

export function isRasterImagePath(url: string): boolean {
  try {
    const path = new URL(url).pathname.toLowerCase();
    if (/\.svg(\?|$)/i.test(path)) return false;
    return (
      /\.(png|jpe?g|webp|gif|heic|heif)(\?|$)/i.test(path) ||
      /opengraph-image/i.test(path) ||
      /\/images\/buffer\//i.test(path)
    );
  } catch {
    return false;
  }
}

export function parseContentLength(header: string | null): number | undefined {
  if (!header) return undefined;
  const n = parseInt(header, 10);
  return Number.isFinite(n) && n >= 0 ? n : undefined;
}

export function bufferImageRejectReason(input: {
  status: number;
  contentType?: string;
  contentLength?: number;
}): string | undefined {
  if (input.status < 200 || input.status >= 300) return `HTTP ${input.status}`;
  if (!input.contentType || !isBufferCompatibleContentType(input.contentType)) {
    return `unsupported content-type ${input.contentType ?? '(none)'}`;
  }
  if (input.contentLength != null && input.contentLength > BUFFER_MAX_IMAGE_BYTES) {
    const mb = (input.contentLength / (1024 * 1024)).toFixed(1);
    return `image too large (${mb}MB; Buffer limit 5MB)`;
  }
  return undefined;
}

export async function probeBufferImageUrl(
  url: string,
  fetchFn: typeof fetch = fetch,
  siteUrl?: string,
): Promise<BufferImageProbeResult> {
  const trimmed = url?.trim();
  if (!trimmed) return { ok: false, reason: 'empty url' };
  if (!isRasterImagePath(trimmed)) return { ok: false, reason: 'non-raster image path' };

  if (siteUrl) {
    const local = probeLocalPublicImageUrl(trimmed, siteUrl);
    if (local?.ok) return local;
  }

  try {
    let res = await fetchFn(trimmed, {
      method: 'HEAD',
      redirect: 'follow',
      signal: AbortSignal.timeout(20_000),
    });

    let contentType = res.headers.get('content-type') ?? undefined;
    let contentLength = parseContentLength(res.headers.get('content-length') ?? null);

    if (res.ok && contentType && isBufferCompatibleContentType(contentType) && contentLength == null) {
      res = await fetchFn(trimmed, {
        method: 'GET',
        redirect: 'follow',
        signal: AbortSignal.timeout(25_000),
        headers: { Range: 'bytes=0-0' },
      });
      contentType = res.headers.get('content-type') ?? contentType;
      const rangeTotal = res.headers.get('content-range');
      const m = rangeTotal?.match(/\/(\d+)$/);
      if (m?.[1]) contentLength = parseInt(m[1], 10);
    }

    const reason = bufferImageRejectReason({ status: res.status, contentType, contentLength });
    if (reason) return { ok: false, contentType, contentLength, reason };
    return { ok: true, contentType, contentLength };
  } catch (err) {
    return { ok: false, reason: err instanceof Error ? err.message : 'probe failed' };
  }
}

export async function resolveBufferImageUrl(
  candidates: Array<string | undefined | null>,
  fetchFn?: typeof fetch,
  siteUrl?: string,
): Promise<string | undefined> {
  for (const candidate of candidates) {
    if (!candidate?.trim()) continue;
    const probe = await probeBufferImageUrl(candidate, fetchFn, siteUrl);
    if (probe.ok) return candidate.trim();
  }
  return undefined;
}

export async function assertBufferPostImageReady(
  imageUrl: string | undefined | null,
  siteUrl: string,
  fetchFn: typeof fetch = fetch,
  options?: { channelService?: BufferChannelService; feedId?: string },
): Promise<string> {
  const trimmed = imageUrl?.trim();
  if (!trimmed) throw new BufferPostImageError('Buffer post requires a blog image URL');

  if (options?.channelService === 'googlebusiness') {
    const resolved = await resolveGoogleBusinessImageUrl(trimmed, fetchFn, siteUrl, options.feedId);
    if (!resolved) throw new BufferPostImageError('no Google Business compatible JPEG/PNG image');
    return resolved;
  }

  if (!isRasterImagePath(trimmed)) throw new BufferPostImageError('non-raster image path');

  const probe = await probeBufferImageUrl(trimmed, fetchFn, siteUrl);
  if (!probe.ok) throw new BufferPostImageError(probe.reason ?? 'image validation failed');

  return trimmed;
}

export async function hydratePostImagesForBuffer(
  posts: Array<{ feedId: string; slug: string; imageUrl?: string; googleBusinessImageUrl?: string }>,
  siteUrl: string,
  fetchFn: typeof fetch = fetch,
): Promise<void> {
  const fallbacks = buildGoogleBusinessFeedFallbacks(siteUrl);
  for (const post of posts) {
    const fallback = fallbacks[post.feedId] ?? `${siteUrl.replace(/\/$/, '')}/social-preview.jpg`;
    const resolved = await resolveBufferImageUrl([post.imageUrl, fallback], fetchFn, siteUrl);
    post.imageUrl = resolved;
    if (resolved) {
      post.googleBusinessImageUrl = await resolveGoogleBusinessImageUrl(resolved, fetchFn, siteUrl, post.feedId);
    }
  }
}
