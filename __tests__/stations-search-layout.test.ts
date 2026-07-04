import { describe, expect, it } from 'vitest';
import fs from 'node:fs/promises';

describe('StationsDirectoryExplorer layout', () => {
  it('does not wrap the full filter panel in a sticky container', async () => {
    const explorer = await fs.readFile('components/StationsDirectoryExplorer.tsx', 'utf-8');
    expect(explorer).not.toMatch(/sticky top-14 z-20/);
    expect(explorer).not.toContain('backdrop-blur-sm');
    expect(explorer).toContain('top-[var(--site-chrome-offset)]');
    expect(explorer).toContain('StationsFilterPanel');
    expect(explorer).toContain('MobileFilterDrawer');
  });

  it('uses scroll anchor and results main landmark', async () => {
    const explorer = await fs.readFile('components/StationsDirectoryExplorer.tsx', 'utf-8');
    expect(explorer).toContain('id="directory-search"');
    expect(explorer).toContain('id="station-results"');
    expect(explorer).toContain('scroll-mt-station-results');
  });

  it('keeps filters in a desktop sidebar with sticky top-24', async () => {
    const explorer = await fs.readFile('components/StationsDirectoryExplorer.tsx', 'utf-8');
    expect(explorer).toContain('sticky top-24');
    expect(explorer).toContain('lg:col-span-3');
    expect(explorer).toContain('lg:col-span-9');
  });
});

describe('globals.css scroll offsets', () => {
  it('defines site chrome offset and scroll margin utility', async () => {
    const css = await fs.readFile('app/globals.css', 'utf-8');
    expect(css).toContain('--site-chrome-offset');
    expect(css).toContain('.scroll-mt-station-results');
  });
});
