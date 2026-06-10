import { vi } from 'vitest';

const JPEG_MAGIC = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10]);

/** Mock fetch for GBP image probes including magic-byte Range GET. */
export function mockGbpImageFetch(options?: {
  jpegUrls?: string[];
  webpUrls?: string[];
  jpegContentLength?: string;
}) {
  const jpegSet = new Set(options?.jpegUrls ?? []);
  const webpSet = new Set(options?.webpUrls ?? []);
  const contentLength = options?.jpegContentLength ?? '12000';

  return vi.fn().mockImplementation(async (url: string, init?: RequestInit) => {
    const u = String(url);
    const range =
      init?.headers instanceof Headers
        ? init.headers.get('Range')
        : (init?.headers as Record<string, string> | undefined)?.Range;

    if (range) {
      return {
        ok: true,
        status: 206,
        headers: new Headers({ 'content-type': 'image/jpeg' }),
        arrayBuffer: async () => JPEG_MAGIC.buffer.slice(0),
      };
    }

    if (webpSet.has(u) || u.endsWith('.webp')) {
      return {
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'image/webp', 'content-length': '5000' }),
      };
    }

    if (jpegSet.has(u) || u.endsWith('.jpg') || u.endsWith('.jpeg') || u.includes('/images/buffer/gbp/')) {
      return {
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'image/jpeg', 'content-length': contentLength }),
      };
    }

    return {
      ok: false,
      status: 404,
      headers: new Headers(),
    };
  });
}
