import { describe, expect, it } from 'vitest';
import fs from 'node:fs/promises';

describe('StationSearchSpotlight', () => {
  it('renders call links and copy actions in spotlight component', async () => {
    const spotlight = await fs.readFile('components/stations/StationSearchSpotlight.tsx', 'utf-8');
    const actions = await fs.readFile('components/stations/StationPhoneActions.tsx', 'utf-8');

    expect(spotlight).toContain('StationPhoneActions');
    expect(actions).toContain('phoneToTelHref');
    expect(actions).toContain('Call ');
    expect(actions).toContain('Copy number');
    expect(actions).toContain('Custody desk');
    expect(actions).toContain('Station main line');
    expect(actions).toContain('View official source');
    expect(actions).toContain('buildStationPhoneReportUrl');
  });

  it('shows custody published badge state', async () => {
    const spotlight = await fs.readFile('components/stations/StationSearchSpotlight.tsx', 'utf-8');
    expect(spotlight).toContain('Custody published');
    expect(spotlight).toContain('Custody not published');
  });
});

describe('StationDirectoryCard search variant', () => {
  it('places phone actions before station name in search mode', async () => {
    const card = await fs.readFile('components/stations/StationDirectoryCard.tsx', 'utf-8');
    expect(card).toContain("variant === 'search'");
    expect(card).toContain('StationPhoneActions');
    expect(card).toContain('ring-2 ring-[var(--gold)]');
  });
});
