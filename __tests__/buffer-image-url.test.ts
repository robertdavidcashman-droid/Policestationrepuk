import { describe, expect, it, vi } from 'vitest';
import {
  BUFFER_MAX_IMAGE_BYTES,
  assertBufferPostImageReady,
  bufferImageRejectReason,
  googleBusinessImageCandidates,
  isBufferCompatibleContentType,
  isGoogleBusinessImageContentType,
  isRasterImagePath,
  probeBufferImageUrl,
  resolveBufferImageUrl,
  resolveGoogleBusinessImageUrl,
} from '@/lib/buffer/image-url';

describe('buffer image-url validation', () => {
  it('accepts standard raster content types', () => {
    expect(isBufferCompatibleContentType('image/jpeg')).toBe(true);
    expect(isBufferCompatibleContentType('image/webp')).toBe(true);
    expect(isBufferCompatibleContentType('text/html')).toBe(false);
  });

  it('rejects SVG paths', () => {
    expect(isRasterImagePath('https://example.com/icon.svg')).toBe(false);
    expect(isRasterImagePath('https://example.com/hero.webp')).toBe(true);
    expect(isRasterImagePath('https://psrtrain.com/opengraph-image')).toBe(true);
  });

  it('rejects images over Buffer 5MB limit', () => {
    const reason = bufferImageRejectReason({
      status: 200,
      contentType: 'image/jpeg',
      contentLength: BUFFER_MAX_IMAGE_BYTES + 1,
    });
    expect(reason).toMatch(/too large/i);
  });

  it('probeBufferImageUrl validates HEAD response', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      headers: new Headers({
        'content-type': 'image/jpeg',
        'content-length': String(500_000),
      }),
    });
    const result = await probeBufferImageUrl('https://example.com/a.jpg', fetchMock as unknown as typeof fetch);
    expect(result.ok).toBe(true);
  });

  it('assertBufferPostImageReady rejects missing and oversized URLs', async () => {
    await expect(assertBufferPostImageReady(undefined)).rejects.toThrow(/requires a blog image URL/i);

    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      headers: new Headers({
        'content-type': 'image/jpeg',
        'content-length': String(6 * 1024 * 1024),
      }),
    });

    await expect(
      assertBufferPostImageReady('https://example.com/huge.jpg', fetchMock as unknown as typeof fetch),
    ).rejects.toThrow(/too large/i);
  });

  it('googleBusinessImageCandidates rewrites webp to jpg paths', () => {
    const candidates = googleBusinessImageCandidates(
      'https://policestationrepuk.org/images/blog/raster/example.webp',
      'https://policestationrepuk.org',
    );
    expect(candidates).toContain('https://policestationrepuk.org/images/blog/raster/example.jpg');
    expect(candidates).toContain('https://policestationrepuk.org/social-preview.jpg');
  });

  it('resolveGoogleBusinessImageUrl prefers jpeg over webp', async () => {
    const fetchMock = vi.fn().mockImplementation(async (url: string) => {
      const u = String(url);
      if (u.endsWith('.webp')) {
        return {
          ok: true,
          status: 200,
          headers: new Headers({ 'content-type': 'image/webp', 'content-length': '5000' }),
        };
      }
      return {
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'image/jpeg', 'content-length': '12000' }),
      };
    });

    const resolved = await resolveGoogleBusinessImageUrl(
      'https://policestationrepuk.org/images/blog/raster/example.webp',
      fetchMock as unknown as typeof fetch,
      'https://policestationrepuk.org',
    );
    expect(resolved).toBe('https://policestationrepuk.org/images/blog/raster/example.jpg');
    expect(isGoogleBusinessImageContentType('image/jpeg')).toBe(true);
    expect(isGoogleBusinessImageContentType('image/webp')).toBe(false);
  });

  it('assertBufferPostImageReady uses jpeg for googlebusiness channel', async () => {
    const fetchMock = vi.fn().mockImplementation(async (url: string) => {
      const u = String(url);
      if (u.endsWith('.jpg')) {
        return {
          ok: true,
          status: 200,
          headers: new Headers({ 'content-type': 'image/jpeg', 'content-length': '12000' }),
        };
      }
      return {
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'image/webp', 'content-length': '5000' }),
      };
    });

    const ready = await assertBufferPostImageReady(
      'https://policestationrepuk.org/images/blog/raster/example.webp',
      fetchMock as unknown as typeof fetch,
      { channelService: 'googlebusiness' },
    );
    expect(ready).toBe('https://policestationrepuk.org/images/blog/raster/example.jpg');
  });

  it('resolveBufferImageUrl falls back when primary URL is too large', async () => {
    const fetchMock = vi.fn().mockImplementation(async (url: string) => {
      const u = String(url);
      if (u.includes('huge.jpg')) {
        return {
          ok: true,
          status: 200,
          headers: new Headers({
            'content-type': 'image/jpeg',
            'content-length': String(6 * 1024 * 1024),
          }),
        };
      }
      return {
        ok: true,
        status: 200,
        headers: new Headers({
          'content-type': 'image/jpeg',
          'content-length': '12000',
        }),
      };
    });

    const resolved = await resolveBufferImageUrl(
      ['https://example.com/huge.jpg', 'https://example.com/small.jpg'],
      fetchMock as unknown as typeof fetch,
    );
    expect(resolved).toBe('https://example.com/small.jpg');
  });
});
