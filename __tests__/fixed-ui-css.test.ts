import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const GLOBALS_CSS = readFileSync(join(process.cwd(), 'app/globals.css'), 'utf8');

function classBlock(className: string): string {
  const match = GLOBALS_CSS.match(new RegExp(`\\.${className}\\s*\\{[^}]+\\}`, 's'));
  expect(match, `.${className} rule should exist in globals.css`).toBeTruthy();
  return match![0];
}

describe('fixed-ui CSS utilities', () => {
  it('anchors viewport-fixed FABs with position: fixed', () => {
    for (const className of [
      'fixed-ui-bottom',
      'fixed-ui-bottom-raised',
      'fixed-ui-left',
      'fixed-ui-right',
    ]) {
      expect(classBlock(className)).toMatch(/position:\s*fixed/);
    }
  });
});
