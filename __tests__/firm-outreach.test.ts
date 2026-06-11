import { describe, expect, it } from 'vitest';
import {
  buildProspectFromInput,
  laaRecordsToInputs,
  mergeProspect,
  shouldExcludeFirm,
} from '@/lib/firm-outreach/merge-prospects';
import {
  extractEmailsFromHtml,
  pickBestEmail,
  scoreEmailCandidate,
} from '@/lib/firm-outreach/enrichment/email-extract';
import {
  isEnglandWalesPostcode,
  normalizeFirmName,
  prospectIdFromKey,
} from '@/lib/firm-outreach/normalize';
import {
  parseSraOrganisationPage,
  parseSraOrganisationSearchResults,
} from '@/lib/firm-outreach/sra-org-lookup';
import { issueUnsubscribeToken, verifyUnsubscribeToken } from '@/lib/firm-outreach/outreach/unsubscribe-token';
import { outreachSendEnabled } from '@/lib/firm-outreach/constants';
import { activityReportToCsv } from '@/lib/firm-outreach/outreach/activity-report';
import { laaJsonIsStale } from '@/lib/legal-directory/laa-fetch';
import type { OutreachActivityReport } from '@/lib/firm-outreach/types';

describe('firm-outreach postcode filter', () => {
  it('accepts Kent postcodes', () => {
    expect(isEnglandWalesPostcode('TN15 6ER')).toBe(true);
    expect(isEnglandWalesPostcode('ME14 1XX')).toBe(true);
  });

  it('rejects Scotland and NI', () => {
    expect(isEnglandWalesPostcode('G1 1AA')).toBe(false);
    expect(isEnglandWalesPostcode('EH1 1AA')).toBe(false);
    expect(isEnglandWalesPostcode('BT1 1AA')).toBe(false);
  });

  it('accepts Gloucestershire GL postcodes', () => {
    expect(isEnglandWalesPostcode('GL1 1AA')).toBe(true);
  });
});

describe('firm-outreach merge', () => {
  it('excludes Public Defender Service', () => {
    expect(shouldExcludeFirm('Public Defender Service Swansea')).toBeTruthy();
  });

  it('builds stable prospect ids', () => {
    const a = prospectIdFromKey('abraham-solicitors-ll11');
    const b = prospectIdFromKey('abraham-solicitors-ll11');
    expect(a).toBe(b);
    expect(a.startsWith('fop_')).toBe(true);
  });

  it('merges richer incoming data', () => {
    const base = buildProspectFromInput({
      prospectType: 'firm',
      firmName: 'Test Solicitors',
      town: 'Maidstone',
      source: 'laa',
    })!;
    const incoming = buildProspectFromInput({
      prospectType: 'firm',
      firmName: 'Test Solicitors',
      phone: '01622 000000',
      email: 'info@test.co.uk',
      emailConfidence: 'crawled',
      emailScore: 70,
      source: 'archive',
    })!;
    const merged = mergeProspect(base, incoming);
    expect(merged.phone).toBe('01622 000000');
    expect(merged.email).toBe('info@test.co.uk');
    expect(merged.sources).toContain('laa');
    expect(merged.sources).toContain('archive');
    expect(merged.status).toBe('ready_to_send');
  });

  it('does not promote archive-only email without LAA source', () => {
    const archiveOnly = buildProspectFromInput({
      prospectType: 'firm',
      firmName: 'General Practice LLP',
      postcode: 'ME14 1AB',
      email: 'info@general.co.uk',
      source: 'archive',
    })!;
    expect(archiveOnly.status).toBe('discovered');
  });

  it('maps LAA records', () => {
    const inputs = laaRecordsToInputs([
      { firmName: 'A Firm', category: 'Crime', postcode: 'ME14 1AB', town: 'Maidstone' },
      { firmName: 'Scot Firm', category: 'Crime', postcode: 'G1 1AA' },
    ]);
    expect(inputs).toHaveLength(1);
    expect(inputs[0].firmName).toBe('A Firm');
  });
});

describe('firm-outreach email extract', () => {
  it('extracts mailto links', () => {
    const html = '<a href="mailto:crime@example.co.uk">Email</a>';
    expect(extractEmailsFromHtml(html)).toContain('crime@example.co.uk');
  });

  it('prefers crime@ over noreply@', () => {
    const best = pickBestEmail(
      ['noreply@firm.co.uk', 'crime@firm.co.uk', 'info@firm.co.uk'],
      { prospectType: 'firm', websiteUrl: 'https://www.firm.co.uk' },
    );
    expect(best?.address).toBe('crime@firm.co.uk');
  });

  it('rejects noreply local part', () => {
    expect(scoreEmailCandidate('noreply@firm.co.uk', { prospectType: 'firm' })).toBe(0);
  });
});

describe('sra org parsers', () => {
  it('parses search results', () => {
    const html = `goToOrgDetails(123456)<h2 class="h5 h2-no-border">Test LLP</h2>`;
    const rows = parseSraOrganisationSearchResults(html);
    expect(rows[0]?.sraNumber).toBe('123456');
    expect(rows[0]?.name).toBe('Test LLP');
  });

  it('parses legacy goToOrganisationDetails search results', () => {
    const html = `goToOrganisationDetails(654321)<h2 class="h5 h2-no-border">Legacy LLP</h2>`;
    const rows = parseSraOrganisationSearchResults(html);
    expect(rows[0]?.sraNumber).toBe('654321');
  });

  it('parses plain-text website on detail page', () => {
    const html = `
      <h1 class="reg__detail__h1">Example Solicitors LLP</h1>
      <strong>SRA number</strong><dd>654321</dd>
      <strong>Website</strong><dd>www.example.co.uk</dd>
      <strong>Authorisation status</strong><dd>Authorised</dd>
    `;
    const org = parseSraOrganisationPage(html);
    expect(org?.website).toBe('https://www.example.co.uk');
  });

  it('parses organisation detail page', () => {
    const html = `
      <h1 class="reg__detail__h1">Example Solicitors LLP</h1>
      <strong>SRA number</strong><dd>654321</dd>
      <strong>Website</strong><dd><a href="https://example.co.uk">site</a></dd>
      <strong>Postcode</strong><dd>ME14 1AB</dd>
      <strong>Authorisation status</strong><dd>Authorised</dd>
    `;
    const org = parseSraOrganisationPage(html);
    expect(org?.sraNumber).toBe('654321');
    expect(org?.website).toContain('example.co.uk');
    expect(org?.authorised).toBe(true);
  });
});

describe('unsubscribe token', () => {
  it('round-trips email', () => {
    process.env.ADMIN_DECISION_TOKEN_SECRET = 'test-secret-at-least-16-chars';
    const token = issueUnsubscribeToken('info@firm.co.uk');
    const payload = verifyUnsubscribeToken(token);
    expect(payload?.email).toBe('info@firm.co.uk');
  });
});

describe('automation defaults', () => {
  it('enables sends by default when outreach is on', () => {
    const prev = { ...process.env };
    process.env.FIRM_OUTREACH_ENABLED = 'true';
    delete process.env.FIRM_OUTREACH_SEND_ENABLED;
    delete process.env.FIRM_OUTREACH_PAUSED;
    expect(outreachSendEnabled()).toBe(true);
    process.env.FIRM_OUTREACH_SEND_ENABLED = 'false';
    expect(outreachSendEnabled()).toBe(false);
    process.env = prev;
  });

  it('treats missing LAA json as stale', () => {
    expect(laaJsonIsStale('/nonexistent/laa-crime-providers.json')).toBe(true);
  });
});

describe('activity report CSV', () => {
  it('exports headers and rows', () => {
    const report: OutreachActivityReport = {
      generatedAt: '2026-06-11T12:00:00.000Z',
      summary: {
        totalSends: 1,
        uniqueRecipients: 1,
        bySendStatus: { sent: 1 },
        waClicks: 0,
        joinedWhatsApp: 0,
        bounced: 0,
        complained: 0,
        unsubscribed: 0,
        pendingFollowUp1: 0,
        pendingFollowUp2: 0,
        readyToSend: 0,
        discovered: 0,
        noEmail: 0,
        excluded: 0,
      },
      sends: [
        {
          sendId: 'fos_test',
          prospectId: 'fop_test',
          firmName: 'Test LLP',
          prospectType: 'firm',
          email: 'crime@test.co.uk',
          sequenceStep: 0,
          touchLabel: 'Initial invite',
          subject: 'Join WhatsApp',
          sendStatus: 'delivered',
          prospectStatus: 'sent',
          sentAt: '2026-06-11T09:30:00.000Z',
          deliveredAt: '2026-06-11T09:31:00.000Z',
          suppressed: false,
        },
      ],
      excludedProspects: [],
      readyToSendProspects: [],
      suppressions: [],
    };
    const csv = activityReportToCsv(report);
    expect(csv).toContain('firm_name');
    expect(csv).toContain('Test LLP');
    expect(csv).toContain('crime@test.co.uk');
    expect(csv).toContain('delivered');
  });
});

describe('normalizeFirmName', () => {
  it('strips common suffixes', () => {
    expect(normalizeFirmName('Abraham Solicitors Ltd')).toContain('abraham');
  });
});
