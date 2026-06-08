/** Buffer image URL validation — raster types only, publicly reachable, ≤ 5MB. */

export const BUFFER_MAX_IMAGE_BYTES = 5 * 1024 * 1024;

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

/** Validate image URL every time before scheduling — raster type, reachable, ≤ 5MB. */
export async function assertBufferPostImageReady(
  imageUrl: string | undefined | null,
  fetchFn: typeof fetch = fetch,
): Promise<string> {
  const trimmed = imageUrl?.trim();
  if (!trimmed) {
    throw new BufferPostImageError('Buffer post requires a blog image URL');
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
