import { describe, expect, it } from 'vitest';

describe('FloatingDirectoryActions route gate', () => {
  const DIRECTORY_ROUTES = ['/directory', '/search', '/StationsDirectory'] as const;

  function isDirectoryContext(pathname: string | null): boolean {
    if (!pathname) return false;
    if (pathname.startsWith('/rep/')) return true;
    return DIRECTORY_ROUTES.some(
      (route) => pathname === route || pathname.startsWith(`${route}/`),
    );
  }

  it('matches directory and rep profile paths', () => {
    expect(isDirectoryContext('/directory')).toBe(true);
    expect(isDirectoryContext('/directory/kent')).toBe(true);
    expect(isDirectoryContext('/rep/jane-doe')).toBe(true);
    expect(isDirectoryContext('/StationsDirectory')).toBe(true);
  });

  it('excludes unrelated pages', () => {
    expect(isDirectoryContext('/Blog')).toBe(false);
    expect(isDirectoryContext('/links')).toBe(false);
    expect(isDirectoryContext(null)).toBe(false);
  });
});
