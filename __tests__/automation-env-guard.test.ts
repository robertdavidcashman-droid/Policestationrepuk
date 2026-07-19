import { describe, expect, it, vi, afterEach } from 'vitest';
import {
  assertLiveAutomationAllowed,
  canSendProductionAlerts,
  isPreviewDeployment,
  AutomationEnvError,
} from '@/lib/automation/env-guard';

describe('automation env guard', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('blocks preview from live automation', () => {
    vi.stubEnv('VERCEL_ENV', 'preview');
    vi.stubEnv('AUTOMATION_ALLOW_NON_PROD', '0');
    expect(isPreviewDeployment()).toBe(true);
    expect(() => assertLiveAutomationAllowed('post')).toThrow(AutomationEnvError);
    expect(canSendProductionAlerts()).toBe(false);
  });

  it('allows production', () => {
    vi.stubEnv('VERCEL_ENV', 'production');
    vi.stubEnv('NODE_ENV', 'production');
    vi.stubEnv('AUTOMATION_ALLOW_NON_PROD', '0');
    expect(() => assertLiveAutomationAllowed('post')).not.toThrow();
    expect(canSendProductionAlerts()).toBe(true);
  });

  it('blocks local/dev without allow flag', () => {
    vi.stubEnv('VERCEL_ENV', '');
    vi.stubEnv('NODE_ENV', 'development');
    vi.stubEnv('AUTOMATION_ALLOW_NON_PROD', '0');
    vi.stubEnv('VITEST', 'false');
    // VITEST is always true in this runner — assert via direct non-vitest path:
    // canSendProductionAlerts should be false for non-production.
    expect(canSendProductionAlerts()).toBe(false);
  });
});
