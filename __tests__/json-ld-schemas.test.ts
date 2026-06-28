/**
 * JSON-LD structured data presence check for policestationrepuk.org.
 */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

const layoutSrc = readFileSync(join(process.cwd(), 'app/layout.tsx'), 'utf-8');
const schemasSrc = readFileSync(join(process.cwd(), 'lib/seo-layer/schemas.ts'), 'utf-8');

describe('JSON-LD structured data — layout', () => {
  it('root layout renders JSON-LD scripts', () => {
    expect(layoutSrc).toContain('JsonLd');
  });

  it('layout uses platformLegalServiceSchema', () => {
    expect(layoutSrc).toContain('platformLegalServiceSchema');
  });

  it('layout uses webSiteSchema', () => {
    expect(layoutSrc).toContain('webSiteSchema');
  });
});

describe('JSON-LD structured data — schema definitions', () => {
  it('defines LegalService @type', () => {
    expect(schemasSrc).toContain('LegalService');
  });

  it('defines WebSite @type', () => {
    expect(schemasSrc).toContain('WebSite');
  });

  it('uses https://schema.org context', () => {
    expect(schemasSrc).toContain('https://schema.org');
  });
});
