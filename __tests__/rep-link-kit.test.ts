import { describe, expect, it } from 'vitest';
import {
  repEmailSignature,
  repProfileUrl,
  repQrDownloadFilename,
  repShareBlurb,
} from '@/lib/rep-link-kit';

describe('rep-link-kit', () => {
  it('builds profile URL', () => {
    expect(repProfileUrl('https://policestationrepuk.org', 'jane-doe-abc12345')).toBe(
      'https://policestationrepuk.org/rep/jane-doe-abc12345',
    );
  });

  it('builds share blurb with county', () => {
    expect(repShareBlurb('Jane Doe', 'Kent')).toContain('Jane Doe');
    expect(repShareBlurb('Jane Doe', 'Kent')).toContain('Kent');
  });

  it('builds email signature', () => {
    const sig = repEmailSignature(
      'Jane Doe',
      'https://policestationrepuk.org/rep/jane-doe-abc12345',
      'Kent',
    );
    expect(sig).toContain('Jane Doe');
    expect(sig).toContain('PoliceStationRepUK directory:');
    expect(sig).toContain('/rep/jane-doe-abc12345');
  });

  it('sanitises QR download filename', () => {
    expect(repQrDownloadFilename('jane-doe-abc12345')).toBe('policestationrepuk-jane-doe-abc12345-qr.png');
  });
});
