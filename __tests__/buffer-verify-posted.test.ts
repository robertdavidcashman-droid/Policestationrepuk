import { describe, expect, it } from 'vitest';
import { bufferDigestVerifyDate } from '@/lib/buffer/daily-digest';
import { evaluatePostsPublished } from '@/lib/buffer/verify-posted';
import type { SchedulerRunRecord } from '@/lib/buffer/scheduler-storage';

const baseRun: SchedulerRunRecord = {
  date: '2026-06-12',
  scheduledAt: '2026-06-12T05:05:00.000Z',
  postIds: ['p1', 'p2', 'p3'],
  slugs: ['day-post', 'night-post', 'future-post'],
  feedIds: ['policestationrepuk', 'custodynote', 'policestationagent'],
  channels: ['ch1', 'ch2', 'ch3'],
  dueAts: [
    '2026-06-12T10:00:00.000Z',
    '2026-06-13T02:00:00.000Z',
    '2026-06-13T08:00:00.000Z',
  ],
};

describe('bufferDigestVerifyDate', () => {
  it('returns yesterday in Europe/London', () => {
    const date = bufferDigestVerifyDate(new Date('2026-06-13T04:30:00.000Z'), 'Europe/London');
    expect(date).toBe('2026-06-12');
  });
});

describe('evaluatePostsPublished', () => {
  it('passes when all due-past posts are sent', () => {
    const now = new Date('2026-06-13T04:30:00.000Z').getTime();
    const statusById = new Map([
      ['p1', { status: 'sent', channelService: 'linkedin' }],
      ['p2', { status: 'sent', channelService: 'twitter' }],
      ['p3', { status: 'scheduled', channelService: 'googlebusiness' }],
    ]);

    const report = evaluatePostsPublished(baseRun, statusById, now);

    expect(report.ok).toBe(true);
    expect(report.sent).toBe(2);
    expect(report.pending).toBe(1);
    expect(report.failed).toBe(0);
    expect(report.feedCounts).toEqual({
      policestationrepuk: 1,
      custodynote: 1,
      policestationagent: 1,
    });
  });

  it('fails when a due-past post is still scheduled (night slot)', () => {
    const now = new Date('2026-06-13T04:30:00.000Z').getTime();
    const statusById = new Map([
      ['p1', { status: 'sent', channelService: 'linkedin' }],
      ['p2', { status: 'scheduled', channelService: 'twitter' }],
      ['p3', { status: 'scheduled', channelService: 'googlebusiness' }],
    ]);

    const report = evaluatePostsPublished(baseRun, statusById, now);

    expect(report.ok).toBe(false);
    expect(report.failed).toBe(1);
    expect(report.problems[0]?.slug).toBe('night-post');
    expect(report.problems[0]?.issue).toBe('still_scheduled_past_due');
  });

  it('fails when post is missing from Buffer', () => {
    const now = new Date('2026-06-13T04:30:00.000Z').getTime();
    const statusById = new Map([
      ['p1', { status: 'sent', channelService: 'linkedin' }],
    ]);

    const report = evaluatePostsPublished(baseRun, statusById, now);

    expect(report.ok).toBe(false);
    expect(report.problems.some((p) => p.status === 'not_found')).toBe(true);
  });
});
