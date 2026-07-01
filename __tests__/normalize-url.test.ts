import { describe, expect, it } from 'vitest';
import {
  normalizeUserUrl,
  resolveRegistrationProofUrl,
} from '@/lib/normalize-url';

describe('normalizeUserUrl', () => {
  it('prepends https:// to www.linkedin.com links', () => {
    expect(normalizeUserUrl('www.linkedin.com/in/foo')).toBe('https://www.linkedin.com/in/foo');
  });

  it('prepends https:// to bare linkedin.com links', () => {
    expect(normalizeUserUrl('linkedin.com/in/foo')).toMatch(/^https:\/\/linkedin\.com\/in\/foo/);
  });

  it('accepts Law Society person pages', () => {
    expect(
      normalizeUserUrl('https://solicitors.lawsociety.org.uk/person/123/name'),
    ).toBe('https://solicitors.lawsociety.org.uk/person/123/name');
  });

  it('accepts SRA register links with query strings', () => {
    expect(
      normalizeUserUrl('https://beta.sra.org.uk/consumers/register/person/?sraNumber=190283'),
    ).toBe('https://beta.sra.org.uk/consumers/register/person/?sraNumber=190283');
  });

  it('rejects ftp URLs', () => {
    expect(normalizeUserUrl('ftp://example.com')).toBe('');
  });

  it('rejects javascript URLs', () => {
    expect(normalizeUserUrl('javascript:alert(1)')).toBe('');
  });

  it('strips angle brackets from email-client paste', () => {
    expect(normalizeUserUrl('<https://linkedin.com/in/foo>')).toBe(
      'https://linkedin.com/in/foo',
    );
  });

  it('strips trailing punctuation from copy-paste', () => {
    expect(normalizeUserUrl('https://www.linkedin.com/in/foo.')).toBe(
      'https://www.linkedin.com/in/foo',
    );
  });
});

describe('resolveRegistrationProofUrl', () => {
  it('ignores invalid proof when SRA is present', () => {
    const result = resolveRegistrationProofUrl({
      rawProof: 'not a url',
      pinNumber: '',
      sraNumber: '190283',
    });
    expect(result.invalidProofUrl).toBe(false);
    expect(result.proofUrl).toBe('');
  });

  it('normalizes proof-only LinkedIn links', () => {
    const result = resolveRegistrationProofUrl({
      rawProof: 'www.linkedin.com/in/foo',
      pinNumber: '',
      sraNumber: '',
    });
    expect(result.invalidProofUrl).toBe(false);
    expect(result.proofUrl).toBe('https://www.linkedin.com/in/foo');
  });

  it('flags invalid proof when it is the only evidence', () => {
    const result = resolveRegistrationProofUrl({
      rawProof: 'not a url',
      pinNumber: '',
      sraNumber: '',
    });
    expect(result.invalidProofUrl).toBe(true);
    expect(result.proofUrl).toBe('');
  });
});
