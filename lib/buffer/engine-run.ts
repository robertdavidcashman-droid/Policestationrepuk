import {
  runSiteBufferScheduler,
  verifySiteBufferSchedule,
  runSiteBufferSelfTest,
  type ScheduleOptions,
  type ScheduleResult,
  type VerifyResult,
  type SelfTestResult,
} from '@robertcashman/buffer-engine';
import { createRepukBufferAdapter } from './site-adapter';
import {
  assertLiveAutomationAllowed,
  AutomationEnvError,
  isPreviewDeployment,
} from '@/lib/automation/env-guard';

function assertLiveScheduleAllowed(options?: ScheduleOptions): void {
  if (options?.dryRun) return;
  // Unit/integration tests mock Buffer — do not hard-block Vitest.
  if (process.env.VITEST === 'true') return;
  // Preview must never create live posts.
  if (isPreviewDeployment()) {
    throw new AutomationEnvError('Buffer live scheduling blocked on preview deployments');
  }
  try {
    assertLiveAutomationAllowed('Buffer live scheduling');
  } catch (err) {
    if (err instanceof AutomationEnvError) throw err;
    throw err;
  }
}

export async function runRepukBufferScheduler(options?: ScheduleOptions): Promise<ScheduleResult> {
  assertLiveScheduleAllowed(options);
  return runSiteBufferScheduler(createRepukBufferAdapter(), options);
}

export async function verifyRepukBufferSchedule(options?: {
  now?: Date;
  gapFill?: boolean;
}): Promise<VerifyResult> {
  if (options?.gapFill !== false && process.env.VITEST !== 'true') {
    if (isPreviewDeployment()) {
      return verifySiteBufferSchedule(createRepukBufferAdapter(), {
        ...options,
        gapFill: false,
      });
    }
    try {
      assertLiveAutomationAllowed('Buffer gap-fill');
    } catch (err) {
      if (err instanceof AutomationEnvError) {
        return verifySiteBufferSchedule(createRepukBufferAdapter(), {
          ...options,
          gapFill: false,
        });
      }
      throw err;
    }
  }
  return verifySiteBufferSchedule(createRepukBufferAdapter(), options);
}

export async function runRepukBufferSelfTest(options?: { now?: Date }): Promise<SelfTestResult> {
  return runSiteBufferSelfTest(createRepukBufferAdapter(), options);
}
