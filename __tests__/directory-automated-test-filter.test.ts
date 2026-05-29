import { describe, expect, it } from 'vitest';
import {
  isKeptTestRep,
  KEPT_TEST_REP_EMAIL,
  matchesAutomatedSmokeRep,
  repIsAutomatedDirectoryTest,
} from '@/lib/directory-blocklist';
import type { Representative } from '@/lib/types';

function rep(partial: Partial<Representative>): Representative {
  return {
    id: 'x',
    slug: 'x',
    name: '',
    email: 'a@b.co',
    phone: '',
    county: 'Kent',
    availability: 'full-time',
    accreditation: 'Accredited Representative',
    notes: '',
    ...partial,
  } as Representative;
}

describe('repIsAutomatedDirectoryTest', () => {
  it('hides Playwright E2E style names and notes', () => {
    expect(
      repIsAutomatedDirectoryTest(
        rep({
          name: 'Playwright Test 1775931277120',
          email: 'pw-test-1775931277120@example.com',
          notes: 'Automated Playwright test submission',
          slug: 'playwright-test-1775931277120-pwtest177',
        }),
      ),
    ).toBe(true);
  });

  it('hides API integration test style names and notes', () => {
    expect(
      repIsAutomatedDirectoryTest(
        rep({
          name: 'API Test 1775931317943',
          email: 'api-test-1775931317943@example.com',
          notes: 'Playwright API test',
          slug: 'api-test-1775931317943-apitest17',
        }),
      ),
    ).toBe(true);
  });

  it('hides dup-submit join-flow test name', () => {
    expect(repIsAutomatedDirectoryTest(rep({ name: 'Dup Test 123', slug: 'dup-test-123-duptest1' }))).toBe(true);
  });

  it('hides reserved documentation email domains', () => {
    expect(repIsAutomatedDirectoryTest(rep({ email: 'x@example.com', name: 'Real Name' }))).toBe(true);
    expect(repIsAutomatedDirectoryTest(rep({ email: 'x@example.co.uk', name: 'Real Name' }))).toBe(true);
  });

  it('hides production smoke script registrations', () => {
    expect(
      matchesAutomatedSmokeRep({
        email: 'smoketest@policestationrepuk.org',
        name: 'Smoke Test',
        slug: 'smoke-test-fake-rep',
        notes: 'Synthetic smoke-test rep. Safe to delete.',
      }),
    ).toBe(true);
    expect(
      matchesAutomatedSmokeRep({
        email: 'cursor-test+featured@policestationrepuk.org',
        name: 'Cursor Test Rep (DELETE ME)',
        slug: 'cursor-test-rep',
        notes: 'Synthetic rep for production smoke test. Safe to delete.',
      }),
    ).toBe(true);
  });

  it('keeps the canonical test rep account', () => {
    expect(isKeptTestRep(KEPT_TEST_REP_EMAIL)).toBe(true);
    expect(
      repIsAutomatedDirectoryTest(
        rep({
          name: 'Test Representative Account',
          email: KEPT_TEST_REP_EMAIL,
          slug: 'test-representative-account',
          notes: 'TEST ACCOUNT - For Stripe payment testing and feature verification.',
        }),
      ),
    ).toBe(false);
  });

  it('does not hide normal reps', () => {
    expect(
      repIsAutomatedDirectoryTest(
        rep({
          name: 'Jane Smith',
          email: 'jane@firm.co.uk',
          notes: 'Available weekends',
          slug: 'jane-smith',
        }),
      ),
    ).toBe(false);
  });
});
