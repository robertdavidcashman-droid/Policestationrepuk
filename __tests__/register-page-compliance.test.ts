import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

/**
 * Public Content and Privacy Rules regression guard.
 *
 * The /register page is the single public on-ramp for representatives. The
 * workspace rule "Privacy, public directory, legal wording, and field
 * exposure" requires the page to explicitly cover five things:
 *   1. eligible categories
 *   2. ineligible categories
 *   3. private verification fields are not shown publicly
 *   4. borderline / incomplete applications may be held for manual review
 *   5. applicants remain responsible for their own accreditation, insurance
 *      and professional compliance
 *
 * It also requires a regulatory notice clarifying that PoliceStationRepUK
 * itself does NOT:
 *   - provide legal advice
 *   - supply regulated legal services
 *   - guarantee a representative's accreditation
 *   - supervise instructed representatives
 *   - become party to the firm/rep contract
 *
 * This test pins those statements to the page source so they cannot be
 * silently weakened or removed.
 */
describe('app/register/page.tsx compliance copy', () => {
  const source = readFileSync(
    resolve(process.cwd(), 'app/register/page.tsx'),
    'utf8',
  );

  it('lists eligible categories', () => {
    expect(source).toMatch(/Eligible to register/i);
    expect(source).toMatch(/Fully accredited PSRAS/i);
    expect(source).toMatch(/Duty solicitors/i);
    expect(source).toMatch(/Solicitors \(with SRA/i);
  });

  it('lists ineligible categories', () => {
    expect(source).toMatch(/Not eligible/i);
    expect(source).toMatch(/Probationary representatives/i);
    expect(source).toMatch(/Trainees/i);
    expect(source).toMatch(/Students/i);
  });

  it('states that private verification fields are not shown publicly', () => {
    expect(source).toMatch(/never display your full postal address, PIN number, SRA number, proof/i);
  });

  it('warns that borderline applications may be held for manual review', () => {
    expect(source).toMatch(/borderline/i);
    expect(source).toMatch(/manual (admin )?review/i);
  });

  it("states the applicant is responsible for their own accreditation and insurance", () => {
    expect(source).toMatch(/Your professional responsibility/i);
    expect(source).toMatch(/responsible for your[\s\S]{0,60}accreditation/i);
    expect(source).toMatch(/professional indemnity insurance/i);
    expect(source).toMatch(/PoliceStationRepUK does not check, renew or guarantee/i);
  });

  it('includes the regulatory notice that PSR-UK is not a law firm', () => {
    expect(source).toMatch(/About PoliceStationRepUK/i);
    expect(source).toMatch(/not a law firm/i);
    expect(source).toMatch(/do not provide legal advice/i);
    expect(source).toMatch(/do not guarantee any representative/i);
    expect(source).toMatch(/do not supervise representatives/i);
    expect(source).toMatch(/not a party to the contract/i);
  });
});
