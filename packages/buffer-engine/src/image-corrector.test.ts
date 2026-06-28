import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { mkdtempSync, rmSync, existsSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import sharp from 'sharp';
import { ensureCompliantPostImage } from './image-corrector';
import { isJpegOrPngMagicBytes, BUFFER_MAX_IMAGE_BYTES } from './image-url';

let publicDir: string;

beforeAll(() => {
  publicDir = mkdtempSync(join(tmpdir(), 'buffer-engine-img-'));
});

afterAll(() => {
  rmSync(publicDir, { recursive: true, force: true });
});

/** Build a fetch stub that serves a generated image with the given content-type. */
function imageFetch(buffer: Buffer, contentType: string): typeof fetch {
  return (async (_url: string | URL, init?: RequestInit) => {
    const method = (init?.method ?? 'GET').toUpperCase();
    const headers = new Headers({
      'content-type': contentType,
      'content-length': String(buffer.length),
    });
    if (method === 'HEAD') {
      return new Response(null, { status: 200, headers });
    }
    return new Response(buffer, { status: 200, headers });
  }) as unknown as typeof fetch;
}

describe('ensureCompliantPostImage', () => {
  it('passes through an already-compliant JPEG without rewriting', async () => {
    const jpeg = await sharp({
      create: { width: 800, height: 600, channels: 3, background: '#336699' },
    })
      .jpeg()
      .toBuffer();

    const result = await ensureCompliantPostImage({
      siteId: 'test',
      siteUrl: 'https://example.com',
      slug: 'already-ok',
      sourceImageUrl: 'https://cdn.example.com/already-ok.jpg',
      publicDir,
      fetchFn: imageFetch(jpeg, 'image/jpeg'),
    });

    expect(result).not.toBeNull();
    expect(result?.publicUrl).toBe('https://cdn.example.com/already-ok.jpg');
    expect(existsSync(join(publicDir, 'images/buffer/test/already-ok.jpg'))).toBe(false);
  });

  it('transcodes a non-compliant SVG-typed source into a local JPEG', async () => {
    const png = await sharp({
      create: { width: 1200, height: 800, channels: 4, background: '#aa3344' },
    })
      .png()
      .toBuffer();

    const result = await ensureCompliantPostImage({
      siteId: 'test',
      siteUrl: 'https://example.com',
      slug: 'needs-fix',
      sourceImageUrl: 'https://cdn.example.com/needs-fix.svg',
      publicDir,
      fetchFn: imageFetch(png, 'image/svg+xml'),
    });

    expect(result).not.toBeNull();
    expect(result?.publicUrl).toMatch(/\/images\/buffer\/test\/needs-fix\.jpg$/);
    const written = join(publicDir, 'images/buffer/test/needs-fix.jpg');
    expect(existsSync(written)).toBe(true);
    const bytes = readFileSync(written);
    expect(isJpegOrPngMagicBytes(new Uint8Array(bytes.subarray(0, 16)))).toBe(true);
    expect(bytes.length).toBeLessThanOrEqual(BUFFER_MAX_IMAGE_BYTES);
  });

  it('returns null when there is no source image', async () => {
    const result = await ensureCompliantPostImage({
      siteId: 'test',
      siteUrl: 'https://example.com',
      slug: 'no-image',
      sourceImageUrl: undefined,
      publicDir,
    });
    expect(result).toBeNull();
  });

  it('falls back to the source image when the transcoded buffer path is not live', async () => {
    const jpeg = await sharp({
      create: { width: 1000, height: 700, channels: 3, background: '#557799' },
    })
      .jpeg()
      .toBuffer();

    const sourceUrl = 'https://cdn.example.com/fallback-source.jpg';
    // The transcoded path lives under the site host; production has not yet
    // deployed the file so a probe of it must fail.
    let sourceHeadCalls = 0;
    const fetchFn = (async (input: string | URL, init?: RequestInit) => {
      const url = typeof input === 'string' ? input : input.toString();
      const method = (init?.method ?? 'GET').toUpperCase();

      if (url.startsWith(sourceUrl)) {
        if (method === 'HEAD') {
          sourceHeadCalls += 1;
          // First probe (pre-transcode) fails on content-type so we transcode;
          // the post-write fallback probe succeeds, exercising the new branch.
          const contentType = sourceHeadCalls === 1 ? 'application/octet-stream' : 'image/jpeg';
          return new Response(null, {
            status: 200,
            headers: new Headers({ 'content-type': contentType, 'content-length': String(jpeg.length) }),
          });
        }
        return new Response(jpeg, {
          status: 200,
          headers: new Headers({ 'content-type': 'image/jpeg', 'content-length': String(jpeg.length) }),
        });
      }

      // The transcoded buffer path on the site host is not live yet.
      return new Response(null, { status: 404, headers: new Headers() });
    }) as unknown as typeof fetch;

    const result = await ensureCompliantPostImage({
      siteId: 'test',
      siteUrl: 'https://example.com',
      slug: 'fallback',
      sourceImageUrl: sourceUrl,
      publicDir,
      fetchFn,
    });

    expect(result).not.toBeNull();
    expect(result?.publicUrl).toBe(sourceUrl);
    expect(result?.contentType).toBe('image/jpeg');
  });
});
