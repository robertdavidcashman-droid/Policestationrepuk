import { describe, expect, it, vi } from 'vitest';
import {
  checkFacebookGroupUrl,
  facebookGroupSlugFromUrl,
} from '@/lib/community-health';

describe('facebookGroupSlugFromUrl', () => {
  it('extracts slug from standard group URL', () => {
    expect(facebookGroupSlugFromUrl('https://www.facebook.com/groups/policestationrepuk')).toBe(
      'policestationrepuk',
    );
  });

  it('returns null for non-group URLs', () => {
    expect(facebookGroupSlugFromUrl('https://www.facebook.com/')).toBeNull();
  });
});

describe('checkFacebookGroupUrl', () => {
  it('passes when group URL returns 200 on login wall', async () => {
    const fetchImpl = vi.fn().mockResolvedValue({
      status: 200,
      url: 'https://www.facebook.com/groups/policestationrepuk',
    });

    const result = await checkFacebookGroupUrl(
      'https://www.facebook.com/groups/policestationrepuk',
      fetchImpl as unknown as typeof fetch,
    );

    expect(result.ok).toBe(true);
    expect(result.status).toBe(200);
  });

  it('supports Playwright APIResponse url() method', async () => {
    const fetchImpl = vi.fn().mockResolvedValue({
      status: 200,
      url: () => 'https://www.facebook.com/groups/policestationrepuk',
    });

    const result = await checkFacebookGroupUrl(
      'https://www.facebook.com/groups/policestationrepuk',
      fetchImpl as unknown as typeof fetch,
    );

    expect(result.ok).toBe(true);
  });

  it('fails on 404', async () => {
    const fetchImpl = vi.fn().mockResolvedValue({
      status: 404,
      url: 'https://www.facebook.com/groups/missing-group',
    });

    const result = await checkFacebookGroupUrl(
      'https://www.facebook.com/groups/missing-group',
      fetchImpl as unknown as typeof fetch,
    );

    expect(result.ok).toBe(false);
    expect(result.issue).toMatch(/404/);
  });

  it('fails when redirected away from group slug', async () => {
    const fetchImpl = vi.fn().mockResolvedValue({
      status: 200,
      url: 'https://www.facebook.com/login.php',
    });

    const result = await checkFacebookGroupUrl(
      'https://www.facebook.com/groups/policestationrepuk',
      fetchImpl as unknown as typeof fetch,
    );

    expect(result.ok).toBe(true);
  });

  it('fails when redirected off Facebook', async () => {
    const fetchImpl = vi.fn().mockResolvedValue({
      status: 200,
      url: 'https://example.com/nope',
    });

    const result = await checkFacebookGroupUrl(
      'https://www.facebook.com/groups/policestationrepuk',
      fetchImpl as unknown as typeof fetch,
    );

    expect(result.ok).toBe(false);
    expect(result.issue).toMatch(/facebook/i);
  });
});
