import { describe, expect, it } from 'vitest';
import {
  generateDayNightPostTimes,
  hashSeed,
  mulberry32,
} from '@/lib/buffer/scheduler-core';

describe('generateDayNightPostTimes', () => {
  it('schedules 3 day and 2 night slots (5 total)', () => {
    const rng = mulberry32(hashSeed('buffer-scheduler:2026-06-08:feed'));
    const times = generateDayNightPostTimes(
      '2026-06-08',
      {
        dayCount: 3,
        nightCount: 2,
        dayWindow: { startHour: 8, endHour: 21, minGapMinutes: 90 },
        nightWindow: { startHour: 21, endHour: 23, minGapMinutes: 60 },
        earlyMorningWindow: { startHour: 0, endHour: 7, minGapMinutes: 60 },
      },
      rng,
    );
    expect(times).toHaveLength(5);

    const daySlots = times.filter((t) => {
      const h = Number(t.match(/T(\d{2}):/)?.[1]);
      return h >= 8 && h <= 21;
    });
    const nightSlots = times.filter((t) => {
      const h = Number(t.match(/T(\d{2}):/)?.[1]);
      return h >= 21 || h <= 7;
    });
    expect(daySlots.length).toBeGreaterThanOrEqual(3);
    expect(nightSlots.length).toBeGreaterThanOrEqual(2);
  });

  it('is deterministic for the same seed', () => {
    const opts = {
      dayCount: 3,
      nightCount: 2,
      dayWindow: { startHour: 8, endHour: 21, minGapMinutes: 90 },
      nightWindow: { startHour: 21, endHour: 23, minGapMinutes: 60 },
      earlyMorningWindow: { startHour: 0, endHour: 7, minGapMinutes: 60 },
    };
    const a = generateDayNightPostTimes('2026-06-08', opts, mulberry32(hashSeed('x')));
    const b = generateDayNightPostTimes('2026-06-08', opts, mulberry32(hashSeed('x')));
    expect(a).toEqual(b);
  });
});
