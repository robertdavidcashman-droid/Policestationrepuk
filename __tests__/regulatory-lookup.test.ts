import { describe, expect, it } from 'vitest';
import { namesLikelyMatch, namePartiallyMatches, normalizePersonName } from '@/lib/name-match';
import { parseSraPersonPage, parseSraPersonSearchResults } from '@/lib/sra-register-lookup';
import {
  parseDsccRegisterRows,
  findDsccRegisterMatches,
  checkDsccPinAgainstRegister,
  normalizeDsccPin,
} from '@/lib/dscc-register-lookup';

describe('normalizePersonName', () => {
  it('normalises punctuation and case', () => {
    expect(normalizePersonName('  Robert   D. Cashman  ')).toBe('robert d cashman');
  });
});

describe('namesLikelyMatch', () => {
  it('matches when surname and a given name align', () => {
    expect(namesLikelyMatch('Robert David Cashman', 'Robert D Cashman')).toBe(true);
  });

  it('rejects different surnames', () => {
    expect(namesLikelyMatch('Robert Cashman', 'Robert Smith')).toBe(false);
  });
});

describe('namePartiallyMatches', () => {
  it('matches surname plus overlapping forename prefix', () => {
    expect(namePartiallyMatches('Jonathan Salter', 'JONATHAN MARK SALTER')).toBe(true);
  });

  it('rejects same forename but different surname', () => {
    expect(namePartiallyMatches('Jonathan Salter', 'Jonathan Smith')).toBe(false);
  });
});

describe('checkDsccPinAgainstRegister', () => {
  const entries = [
    { title: 'MR', forename: 'JONATHAN MARK', surname: 'SALTER', firm: 'Example LLP' },
    { title: 'MR', forename: 'JANE', surname: 'DOE', firm: 'Other' },
  ];

  it('matches when PIN supplied and name appears on register', () => {
    const result = checkDsccPinAgainstRegister('Jonathan Salter', '1650', entries);
    expect(result.matched).toBe(true);
    expect(result.pinSupplied).toBe('1650');
    expect(result.entries).toHaveLength(1);
  });

  it('does not match when surname differs', () => {
    const result = checkDsccPinAgainstRegister('Jonathan Smith', '1650', entries);
    expect(result.matched).toBe(false);
  });
});

describe('normalizeDsccPin', () => {
  it('strips non-digits', () => {
    expect(normalizeDsccPin('PIN-1650')).toBe('1650');
  });
});

describe('parseSraPersonPage', () => {
  it('extracts regulated solicitor details', () => {
    const html = `
      <h1 class="reg__detail__h1">Robert David Cashman</h1>
      <dt class="first"><strong>SRA number</strong></dt>
      <dd>190283</dd>
      <span class="GlossaryLink" id="PracticingSolicitorLabel">SRA-regulated solicitor</span>
    `;
    const person = parseSraPersonPage(html);
    expect(person?.name).toBe('Robert David Cashman');
    expect(person?.sraNumber).toBe('190283');
    expect(person?.regulated).toBe(true);
  });
});

describe('parseSraPersonSearchResults', () => {
  it('parses goToPersonDetails links', () => {
    const html = `
      <a href="javascript:;" onclick="goToPersonDetails(190283)" class="label__sm__block">
        <h2 class="h5 h2-no-border">Robert David Cashman</h2>
      </a>
    `;
    const people = parseSraPersonSearchResults(html);
    expect(people).toHaveLength(1);
    expect(people[0].sraNumber).toBe('190283');
  });
});

describe('parseDsccRegisterRows', () => {
  it('parses accredited representative table rows', () => {
    const html = `
      <table class="a-IRR-table">
        <tr><th>Title</th></tr>
        <tr>
          <td class=" u-tL" headers="C1">MR</td>
          <td class=" u-tL" headers="C2">ROBERT</td>
          <td class=" u-tL" headers="C3">CASHMAN</td>
          <td></td><td></td><td></td><td></td>
          <td class=" u-tL" headers="C8">TUCKERS SOLICITORS LLP</td>
        </tr>
      </table>
    `;
    const rows = parseDsccRegisterRows(html);
    expect(rows).toHaveLength(1);
    expect(rows[0].forename).toBe('ROBERT');
    expect(rows[0].surname).toBe('CASHMAN');
  });
});

describe('findDsccRegisterMatches', () => {
  it('finds reps by normalised name', () => {
    const matches = findDsccRegisterMatches('Robert Cashman', [
      { title: 'MR', forename: 'ROBERT', surname: 'CASHMAN', firm: 'Example LLP' },
      { title: 'MR', forename: 'JANE', surname: 'DOE', firm: 'Other' },
    ]);
    expect(matches).toHaveLength(1);
    expect(matches[0].firm).toBe('Example LLP');
  });
});
