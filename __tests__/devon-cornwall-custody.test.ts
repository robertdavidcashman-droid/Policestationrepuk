import { describe, expect, it } from 'vitest';
import {
  custodyRowToStationKeys,
  parseDevonCornwallCustodyHtml,
} from '@/lib/devon-cornwall-custody';

describe('parseDevonCornwallCustodyHtml', () => {
  it('parses location and phone from table-like HTML', () => {
    const html = `
      <table>
        <tr><th>Location</th><th>Telephone</th></tr>
        <tr><td>Exeter Custody Suite</td><td><a href="tel:01392 452200">01392 452200</a></td></tr>
        <tr><td>Plymouth</td><td>01752 487500</td></tr>
      </table>
    `;
    const rows = parseDevonCornwallCustodyHtml(html);
    expect(rows.some((r) => r.location.includes('Exeter') && r.custodyPhone.includes('01392'))).toBe(
      true,
    );
    expect(rows.some((r) => r.custodyPhone === '01752 487500')).toBe(true);
  });

  it('maps Plymouth row to station keys', () => {
    const keys = custodyRowToStationKeys('Plymouth Charles Cross');
    expect(keys).toContain('plymouth');
  });
});
