import type { BufferChannelService } from './config';
import { SITE_URL } from '@/lib/seo-layer/config';

/** Buffer image URL validation — raster types only, publicly reachable, ≤ 5MB. */

export const BUFFER_MAX_IMAGE_BYTES = 5 * 1024 * 1024;

const GOOGLE_BUSINESS_CONTENT_TYPES = new Set(['image/jpeg', 'image/png']);

/** Google Business Profile rejects WebP — JPEG/PNG only. */
export const GOOGLE_BUSINESS_RASTER_FALLBACK =
  'https://www.policestationagent.com/blog-images/blog-listing-0.jpg';

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

/** Thrown when a post image fails pre-flight validation (before Buffer API createPost). */
export class BufferPostImageError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'BufferPostImageError';
  }
}

export function isGoogleBusinessImageContentType(contentType: string | null | undefined): boolean {
  if (!contentType) return false;
  const base = contentType.split(';')[0]?.trim().toLowerCase();
  return !!base && GOOGLE_BUSINESS_CONTENT_TYPES.has(base);
}

/** Candidate URLs for Google Business when the source image is WebP or incompatible. */
export function googleBusinessImageCandidates(
  imageUrl: string,
  siteUrl: string = SITE_URL,
): string[] {
  const trimmed = imageUrl.trim();
  const out: string[] = [];

  if (/\.(jpe?g|png)(\?|$)/i.test(trimmed)) {
    out.push(trimmed);
  }

  if (/\.webp(\?|$)/i.test(trimmed)) {
    out.push(trimmed.replace(/\.webp(\?.*)?$/i, '.jpg$1'));
    if (/-768\.webp(\?|$)/i.test(trimmed)) {
      out.push(trimmed.replace(/-768\.webp(\?.*)?$/i, '.jpg$1'));
      out.push(trimmed.replace(/-768\.webp(\?.*)?$/i, '-768.jpg$1'));
    } else {
      out.push(trimmed.replace(/\.webp(\?.*)?$/i, '-768.jpg$1'));
    }
  }

  const base = siteUrl.replace(/\/$/, '');
  try {
    const host = new URL(trimmed).hostname;
    const siteHost = new URL(base).hostname;
    if (host === siteHost) {
      out.push(`${base}/social-preview.jpg`);
    } else if (/custodynote\.com$/i.test(host) || /policestationagent\.com$/i.test(host) || /psrtrain\.com$/i.test(host)) {
      out.push(GOOGLE_BUSINESS_RASTER_FALLBACK);
    }
  } catch {
    if (trimmed.startsWith('/')) {
      out.push(`${base}/social-preview.jpg`);
    }
  }

  return [...new Set(out.filter(Boolean))];
}

function googleBusinessRejectReason(input: {
  status: number;
  contentType?: string;
  contentLength?: number;
}): string | undefined {
  if (input.status < 200 || input.status >= 300) {
    return `HTTP ${input.status}`;
  }
  if (!input.contentType || !isGoogleBusinessImageContentType(input.contentType)) {
    return `Google Business requires JPEG/PNG (got ${input.contentType ?? 'none'})`;
  }
  if (input.contentLength != null && input.contentLength > BUFFER_MAX_IMAGE_BYTES) {
    const mb = (input.contentLength / (1024 * 1024)).toFixed(1);
    return `image too large (${mb}MB; Buffer limit 5MB)`;
  }
  return undefined;
}

/** Probe image for Google Business — JPEG/PNG only, ≤ 5MB. */
export async function probeGoogleBusinessImageUrl(
  url: string,
  fetchFn: typeof fetch = fetch,
): Promise<BufferImageProbeResult> {
  const trimmed = url?.trim();
  if (!trimmed) return { ok: false, reason: 'empty url' };

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

    const reason = googleBusinessRejectReason({ status: res.status, contentType, contentLength });
    if (reason) return { ok: false, contentType, contentLength, reason };
    return { ok: true, contentType, contentLength };
  } catch (err) {
    return { ok: false, reason: err instanceof Error ? err.message : 'probe failed' };
  }
}

/** Pick first JPEG/PNG URL that passes Google Business probes. */
export async function resolveGoogleBusinessImageUrl(
  imageUrl: string,
  fetchFn: typeof fetch = fetch,
  siteUrl: string = SITE_URL,
): Promise<string | undefined> {
  for (const candidate of googleBusinessImageCandidates(imageUrl, siteUrl)) {
    const probe = await probeGoogleBusinessImageUrl(candidate, fetchFn);
    if (probe.ok) return candidate;
  }
  return undefined;
}

/** Validate image URL every time before scheduling — raster type, reachable, ≤ 5MB. */
export async function assertBufferPostImageReady(
  imageUrl: string | undefined | null,
  fetchFn: typeof fetch = fetch,
  options?: { channelService?: BufferChannelService },
): Promise<string> {
  const trimmed = imageUrl?.trim();
  if (!trimmed) {
    throw new BufferPostImageError('Buffer post requires a blog image URL');
  }

  if (options?.channelService === 'googlebusiness') {
    const resolved = await resolveGoogleBusinessImageUrl(trimmed, fetchFn);
    if (!resolved) {
      throw new BufferPostImageError('no Google Business compatible JPEG/PNG image');
    }
    return resolved;
  }

  if (!isRasterImagePath(trimmed)) {
    throw new BufferPostImageError('non-raster image path');
  }

  const probe = await probeBufferImageUrl(trimmed, fetchFn);
  if (!probe.ok) {
    throw new BufferPostImageError(probe.reason ?? 'image validation failed');
  }

  return trimmed;
}

export function isBufferCompatibleContentType(contentType: string | null | undefined): boolean {
  if (!contentType) return false;
  const base = contentType.split(';')[0]?.trim().toLowerCase();
  return !!base && ACCEPTED_CONTENT_TYPES.has(base);
}

/** Reject SVG and other non-raster paths even when the URL looks like an image. */
export function isRasterImagePath(url: string): boolean {
  try {
    const path = new URL(url).pathname.toLowerCase();
    if (/\.svg(\?|$)/i.test(path)) return false;
    return (
      /\.(png|jpe?g|webp|gif|heic|heif)(\?|$)/i.test(path) ||
      /opengraph-image/i.test(path)
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
  if (input.status < 200 || input.status >= 300) {
    return `HTTP ${input.status}`;
  }
  if (!input.contentType || !isBufferCompatibleContentType(input.contentType)) {
    return `unsupported content-type ${input.contentType ?? '(none)'}`;
  }
  if (input.contentLength != null && input.contentLength > BUFFER_MAX_IMAGE_BYTES) {
    const mb = (input.contentLength / (1024 * 1024)).toFixed(1);
    return `image too large (${mb}MB; Buffer limit 5MB)`;
  }
  return undefined;
}

/** HEAD probe with optional GET fallback when Content-Length is missing. */
export async function probeBufferImageUrl(
  url: string,
  fetchFn: typeof fetch = fetch,
): Promise<BufferImageProbeResult> {
  const trimmed = url?.trim();
  if (!trimmed) return { ok: false, reason: 'empty url' };
  if (!isRasterImagePath(trimmed)) return { ok: false, reason: 'non-raster image path' };

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

    const reason = bufferImageRejectReason({
      status: res.status,
      contentType,
      contentLength,
    });

    if (reason) {
      return { ok: false, contentType, contentLength, reason };
    }

    return { ok: true, contentType, contentLength };
  } catch (err) {
    return {
      ok: false,
      reason: err instanceof Error ? err.message : 'probe failed',
    };
  }
}

/** Pick the first URL that passes Buffer probes, or undefined. */
export async function resolveBufferImageUrl(
  candidates: Array<string | undefined | null>,
  fetchFn?: typeof fetch,
): Promise<string | undefined> {
  for (const candidate of candidates) {
    if (!candidate?.trim()) continue;
    const probe = await probeBufferImageUrl(candidate, fetchFn);
    if (probe.ok) return candidate.trim();
  }
  return undefined;
}
