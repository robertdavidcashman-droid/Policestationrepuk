import { describe, expect, it } from 'vitest';
import { isSisterSiteHost, withSisterSiteUtm } from '@/lib/partner-website-href';

describe('withSisterSiteUtm', () => {
  it('adds UTMs to sister site URLs', () => {
    const href = withSisterSiteUtm('https://policestationagent.com', 'featured_carousel');
    expect(href).toContain('utm_source=policestationrepuk');
    expect(href).toContain('utm_campaign=featured_carousel');
  });

  it('leaves third-party URLs unchanged', () => {
    expect(withSisterSiteUtm('https://example-defence.co.uk', 'featured_carousel')).toBe(
      'https://example-defence.co.uk',
    );
  });

  it('does not double-append UTMs', () => {
    const tagged = 'https://custodynote.com/?utm_source=policestationrepuk&utm_medium=web&utm_campaign=x';
    expect(withSisterSiteUtm(tagged, 'featured_carousel')).toBe(tagged);
  });
});

describe('isSisterSiteHost', () => {
  it('recognises network domains with or without www', () => {
    expect(isSisterSiteHost('www.psrtrain.com')).toBe(true);
    expect(isSisterSiteHost('custodynote.com')).toBe(true);
    expect(isSisterSiteHost('google.com')).toBe(false);
  });
});
