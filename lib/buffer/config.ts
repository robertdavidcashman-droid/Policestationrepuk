export type BufferChannelService = 'twitter' | 'linkedin' | 'googlebusiness';

export interface BufferChannelConfig {
  id: string;
  service: BufferChannelService;
}

/** Defaults for robertcashman's Buffer workspace — override via env in other accounts. */
const DEFAULT_ORG_ID = '69d26bdf0f822245c9a723c4';

const DEFAULT_CHANNELS: BufferChannelConfig[] = [
  { id: '69d26c3d031bfa423cd0c6b3', service: 'twitter' },
  { id: '69d26c06031bfa423cd0c50d', service: 'linkedin' },
  { id: '69d26c8b031bfa423cd0c8b7', service: 'googlebusiness' },
];

export function getBufferApiKey(): string | null {
  const key = process.env.BUFFER_API_KEY?.trim();
  return key || null;
}

export function getBufferOrganizationId(): string {
  return process.env.BUFFER_ORGANIZATION_ID?.trim() || DEFAULT_ORG_ID;
}

export function getBufferChannels(): BufferChannelConfig[] {
  const twitter = process.env.BUFFER_CHANNEL_TWITTER_ID?.trim();
  const linkedin = process.env.BUFFER_CHANNEL_LINKEDIN_ID?.trim();
  const google = process.env.BUFFER_CHANNEL_GOOGLEBUSINESS_ID?.trim();
  if (twitter && linkedin && google) {
    return [
      { id: twitter, service: 'twitter' },
      { id: linkedin, service: 'linkedin' },
      { id: google, service: 'googlebusiness' },
    ];
  }
  return DEFAULT_CHANNELS;
}

export function getSchedulerPostsPerDay(): number {
  const n = Number(process.env.BUFFER_SCHEDULER_POSTS_PER_DAY ?? '3');
  return Number.isFinite(n) && n > 0 ? Math.min(Math.floor(n), 10) : 3;
}

export function getSchedulerCooldownDays(): number {
  const n = Number(process.env.BUFFER_SCHEDULER_COOLDOWN_DAYS ?? '14');
  return Number.isFinite(n) && n > 0 ? Math.min(Math.floor(n), 90) : 14;
}

export function getSchedulerTimezone(): string {
  return process.env.BUFFER_SCHEDULER_TIMEZONE?.trim() || 'Europe/London';
}

export interface SchedulerTimeWindow {
  startHour: number;
  endHour: number;
  minGapMinutes: number;
}

export function getSchedulerTimeWindow(): SchedulerTimeWindow {
  const startHour = Number(process.env.BUFFER_SCHEDULER_START_HOUR ?? '8');
  const endHour = Number(process.env.BUFFER_SCHEDULER_END_HOUR ?? '21');
  const minGapMinutes = Number(process.env.BUFFER_SCHEDULER_MIN_GAP_MINUTES ?? '90');
  return {
    startHour: Number.isFinite(startHour) ? startHour : 8,
    endHour: Number.isFinite(endHour) ? endHour : 21,
    minGapMinutes: Number.isFinite(minGapMinutes) ? minGapMinutes : 90,
  };
}
