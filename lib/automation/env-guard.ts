import { getAutomationConfig, getRuntimeEnvironment } from './config';

export class AutomationEnvError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AutomationEnvError';
  }
}

/** True when this process is a Vercel production deployment. */
export function isProductionDeployment(): boolean {
  return process.env.VERCEL_ENV === 'production';
}

export function isPreviewDeployment(): boolean {
  return process.env.VERCEL_ENV === 'preview';
}

/**
 * Live Buffer posting / cross-site publish / production alert emails are only
 * allowed in production unless AUTOMATION_ALLOW_NON_PROD=1 (ops override).
 */
export function assertLiveAutomationAllowed(action = 'live automation'): void {
  const config = getAutomationConfig();
  if (config.allowNonProd) return;

  // Preview must never post live or send production alerts from automation repairs.
  if (isPreviewDeployment()) {
    throw new AutomationEnvError(`${action} blocked on preview deployments`);
  }

  // Vitest callers should mock side effects; do not hard-block unit tests here.
  if (process.env.VITEST === 'true') return;

  if (isProductionDeployment()) return;

  // Local/dev or production Node without Vercel: block unless allow flag set.
  throw new AutomationEnvError(
    `${action} blocked outside production (env=${getRuntimeEnvironment()})`,
  );
}

/** Soft check used by healthcheck to decide whether to repair/post. */
export function canPerformLiveSideEffects(): boolean {
  try {
    assertLiveAutomationAllowed('side effects');
    return true;
  } catch {
    return false;
  }
}

/** Preview/local must not send production alert emails. */
export function canSendProductionAlerts(): boolean {
  if (isPreviewDeployment()) return false;
  // Vitest: allow the helper to report production eligibility when VERCEL_ENV is stubbed,
  // but sendHtmlEmail still no-ops without RESEND and callers pass dryRun in tests.
  if (!isProductionDeployment() && !getAutomationConfig().allowNonProd) {
    if (process.env.VITEST === 'true' && process.env.VERCEL_ENV === 'production') {
      return true;
    }
    return false;
  }
  return true;
}

export function requireCronSecretInProduction(): string | null {
  const secret = process.env.CRON_SECRET?.trim() || '';
  if (process.env.NODE_ENV === 'production' && !secret) {
    return 'CRON_SECRET missing in production';
  }
  return null;
}
