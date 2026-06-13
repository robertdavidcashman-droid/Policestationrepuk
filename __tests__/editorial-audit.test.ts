import { describe, expect, it, vi, beforeEach } from 'vitest';

vi.mock('@/lib/editorial-audit/email', () => ({
  sendEditorialAuditDigestEmail: vi.fn(async () => true),
}));

const getDailyAuditBucket = vi.fn();
const markDailyAuditSent = vi.fn();
const shouldSendDailyAudit = vi.fn();
const dailyAuditDate = vi.fn(() => '2026-06-07');

vi.mock('@/lib/editorial-audit/daily-notify', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/editorial-audit/daily-notify')>();
  return {
    ...actual,
    getDailyAuditBucket: (...args: unknown[]) => getDailyAuditBucket(...args),
    markDailyAuditSent: (...args: unknown[]) => markDailyAuditSent(...args),
    shouldSendDailyAudit: (...args: unknown[]) => shouldSendDailyAudit(...args),
    dailyAuditDate: (...args: unknown[]) => dailyAuditDate(...args),
  };
});

import { resetAuditCursorForTests, selectAuditBatch } from '@/lib/editorial-audit/cursor';
import { proposedFixForCode } from '@/lib/editorial-audit/fixes';
import { notifyIfFindings } from '@/lib/editorial-audit/notify';
import { scanText } from '@/lib/editorial-audit/rules';
import { scanUnit } from '@/lib/editorial-audit/runner';
import { splitMarkdownSections } from '@/lib/editorial-audit/units';
import { sendEditorialAuditDigestEmail } from '@/lib/editorial-audit/email';
import type { AuditUnit } from '@/lib/editorial-audit/types';

function makeUnit(id: string, text = ''): AuditUnit {
  return {
    id,
    url: `/Blog/${id}`,
    contentType: 'blog',
    sourceFile: 'lib/blog/articles-batch-*.ts',
    sectionTitle: 'Test section',
    sectionIndex: 0,
    text,
  };
}

describe('editorial audit rules', () => {
  it('flags superseded £181 fee as PROBLEM with fix hint', () => {
    const flags = scanText('The fixed fee was £181 for attendance.');
    expect(flags.some((f) => f.code === 'fee-181' && f.severity === 'PROBLEM')).toBe(true);
    expect(proposedFixForCode('fee-181')).toMatch(/SI 2025\/1251/);
  });

  it('flags Bail Act 2024 as PROBLEM', () => {
    const flags = scanText('Under the Bail Act 2024, limits apply.');
    expect(flags.some((f) => f.code === 'bail-act-2024')).toBe(true);
  });

  it('allows registered case citations', () => {
    const flags = scanText('See R v Smith for an example only.');
    expect(flags.filter((f) => f.code === 'unregistered-case')).toHaveLength(0);
  });
});

describe('editorial audit section splitting', () => {
  it('splits markdown on ## headings', () => {
    const sections = splitMarkdownSections('Intro\n\n## First\n\nBody one\n\n## Second\n\nBody two');
    expect(sections).toHaveLength(3);
    expect(sections[1].title).toBe('First');
    expect(sections[2].title).toBe('Second');
  });
});

describe('editorial audit cursor rotation', () => {
  beforeEach(async () => {
    await resetAuditCursorForTests();
  });

  it('advances through units without repeating within a batch', async () => {
    const units = [makeUnit('a'), makeUnit('b'), makeUnit('c'), makeUnit('d'), makeUnit('e')];
    const first = await selectAuditBatch(units, 2);
    expect(first.batch).toHaveLength(2);
    expect(first.batch.map((u) => u.id)).toEqual(['a', 'b']);
    expect(new Set(first.batch.map((u) => u.id)).size).toBe(2);

    const second = await selectAuditBatch(units, 2);
    expect(second.batch.map((u) => u.id)).toEqual(['c', 'd']);
  });

  it('wraps cursor after reaching end of list', async () => {
    const units = [makeUnit('a'), makeUnit('b'), makeUnit('c')];
    await selectAuditBatch(units, 2); // a, b
    await selectAuditBatch(units, 2); // c, a
    await selectAuditBatch(units, 2); // b, c
    const fourth = await selectAuditBatch(units, 2);
    expect(fourth.batch[0].id).toBe('a');
  });
});

describe('editorial audit batch scan', () => {
  it('produces findings with proposed fix from scanUnit', () => {
    const findings = scanUnit(makeUnit('fee-test', 'Police station fee was £181 last year.'));
    expect(findings).toHaveLength(1);
    expect(findings[0].severity).toBe('PROBLEM');
    expect(findings[0].proposedFix).toMatch(/SI 2025\/1251/);
  });
});

describe('editorial audit daily notification', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    shouldSendDailyAudit.mockReturnValue(true);
    getDailyAuditBucket.mockResolvedValue(null);
  });

  it('does not email when batch is clean', async () => {
    const result = await notifyIfFindings([], 5);
    expect(result.emailed).toBe(false);
    expect(result.findingCount).toBe(0);
    expect(sendEditorialAuditDigestEmail).not.toHaveBeenCalled();
  });

  it('sends digest when findings exist and send window is open', async () => {
    const findings = scanUnit(makeUnit('x', 'Fee was £181'));
    const result = await notifyIfFindings(findings, 3);
    expect(result.emailed).toBe(true);
    expect(sendEditorialAuditDigestEmail).toHaveBeenCalledTimes(1);
    expect(markDailyAuditSent).toHaveBeenCalledWith('2026-06-07');
  });

  it('queues findings but waits outside send window', async () => {
    shouldSendDailyAudit.mockReturnValue(false);
    const findings = scanUnit(makeUnit('x', 'Fee was £181'));
    const result = await notifyIfFindings(findings, 3);
    expect(result.emailed).toBe(false);
    expect(result.pendingDailyDigest).toBe(true);
    expect(sendEditorialAuditDigestEmail).not.toHaveBeenCalled();
  });

  it('does not send a second email on the same day', async () => {
    getDailyAuditBucket.mockResolvedValue({
      date: '2026-06-07',
      findings: [],
      unitsScanned: 5,
      notifiedAt: '2026-06-07T19:00:00.000Z',
    });
    const findings = scanUnit(makeUnit('x', 'Fee was £181'));
    const result = await notifyIfFindings(findings, 3);
    expect(result.emailed).toBe(false);
    expect(sendEditorialAuditDigestEmail).not.toHaveBeenCalled();
  });
});
