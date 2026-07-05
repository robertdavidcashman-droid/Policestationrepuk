import {
  DIRECTORY_ELIGIBILITY_REPS,
  FORUM_ALTERNATIVE_REPS,
  FORUM_PATH,
  LAA_PAYMENT_REPS,
  REGISTER_PATH,
  WHATSAPP_BANNER_QUALIFICATION,
  WHATSAPP_REP_ELIGIBILITY,
} from '@/lib/community-messaging';

describe('community-messaging', () => {
  it('exports stable paths for forum and register', () => {
    expect(FORUM_PATH).toBe('/Forum');
    expect(REGISTER_PATH).toBe('/register');
  });

  it('includes qualification and payment messaging', () => {
    expect(WHATSAPP_BANNER_QUALIFICATION.toLowerCase()).toContain('fully accredited');
    expect(WHATSAPP_REP_ELIGIBILITY.toLowerCase()).toContain('not in training');
    expect(LAA_PAYMENT_REPS.toLowerCase()).toContain('legal aid');
    expect(DIRECTORY_ELIGIBILITY_REPS.toLowerCase()).toContain('fully accredited');
    expect(FORUM_ALTERNATIVE_REPS.toLowerCase()).toContain('forum');
  });

  it('warns firms about unverified Facebook job posts', async () => {
    const { FACEBOOK_JOB_POSTING_WARNING } = await import('@/lib/community-messaging');
    expect(FACEBOOK_JOB_POSTING_WARNING.toLowerCase()).toContain('open to everyone');
    expect(FACEBOOK_JOB_POSTING_WARNING.toLowerCase()).toContain('whatsapp');
  });
});
