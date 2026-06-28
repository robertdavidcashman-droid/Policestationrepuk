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

export async function runRepukBufferScheduler(options?: ScheduleOptions): Promise<ScheduleResult> {
  return runSiteBufferScheduler(createRepukBufferAdapter(), options);
}

export async function verifyRepukBufferSchedule(options?: {
  now?: Date;
  gapFill?: boolean;
}): Promise<VerifyResult> {
  return verifySiteBufferSchedule(createRepukBufferAdapter(), options);
}

export async function runRepukBufferSelfTest(options?: { now?: Date }): Promise<SelfTestResult> {
  return runSiteBufferSelfTest(createRepukBufferAdapter(), options);
}
