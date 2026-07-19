import { describe, expect, it } from 'vitest';
import {
  addDaysToLocalDate,
  localDateInTimezone,
  timezoneOffsetForDate,
} from '@/lib/buffer/scheduler-core';

describe('automation timezone boundaries', () => {
  it('uses Europe/London calendar date around midnight UTC', () => {
    // 2026-07-18 23:30 UTC is still 2026-07-19 in BST (UTC+1)
    const lateUtc = new Date('2026-07-18T23:30:00Z');
    expect(localDateInTimezone(lateUtc, 'Europe/London')).toBe('2026-07-19');

    // 2026-07-19 00:30 UTC is 2026-07-19 01:30 BST
    const earlyUtc = new Date('2026-07-19T00:30:00Z');
    expect(localDateInTimezone(earlyUtc, 'Europe/London')).toBe('2026-07-19');
  });

  it('handles UK DST spring forward (2026-03-29)', () => {
    // Clocks go forward 01:00 → 02:00 GMT to BST
    const before = localDateInTimezone(new Date('2026-03-29T00:30:00Z'), 'Europe/London');
    const after = localDateInTimezone(new Date('2026-03-29T01:30:00Z'), 'Europe/London');
    expect(before).toBe('2026-03-29');
    expect(after).toBe('2026-03-29');
    const offsetBefore = timezoneOffsetForDate('2026-03-28', 'Europe/London');
    const offsetAfter = timezoneOffsetForDate('2026-03-30', 'Europe/London');
    expect(offsetBefore).toMatch(/^\+|-/);
    expect(offsetAfter).toMatch(/^\+|-/);
    // After transition should be +01:00 BST
    expect(offsetAfter).toBe('+01:00');
  });

  it('does not double-count across UTC/local day when stepping yesterday', () => {
    const now = new Date('2026-07-19T07:15:00Z');
    const today = localDateInTimezone(now, 'Europe/London');
    const yesterday = addDaysToLocalDate(today, -1);
    expect(today).toBe('2026-07-19');
    expect(yesterday).toBe('2026-07-18');
  });
});
