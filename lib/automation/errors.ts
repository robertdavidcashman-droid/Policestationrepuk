import type { ErrorCategory } from './types';

export interface ClassifiedError {
  category: ErrorCategory;
  retryable: boolean;
  requiresHumanAction: boolean;
  message: string;
}

const AUTH_PATTERNS =
  /unauthorized|unauthorised|forbidden|invalid (api )?key|revoked|authentication|not authenticated|access denied|401|403/i;
const RATE_PATTERNS = /too many requests|rate limit|429|throttl/i;
const NETWORK_PATTERNS =
  /timeout|timed out|econnreset|econnrefused|enotfound|network|fetch failed|socket|503|502|504/i;
const VALIDATION_PATTERNS =
  /invalid (media|content|image|url|channel|profile)|prohibited|rejected|validation|bad request|400|unsupported/i;
const CONFIG_PATTERNS =
  /missing|not configured|BUFFER_API_KEY|BUFFER_CHANNEL|CRON_SECRET|env_invalid|configuration/i;
const QUOTA_SUPPLY_PATTERNS =
  /no posts available|cooldown exhausted|insufficient|empty pool|no eligible|content.?supply/i;
const DUPLICATE_PATTERNS = /duplicate|already (scheduled|exists|posted)|idempotency/i;

export function classifyError(error: unknown): ClassifiedError {
  const message =
    error instanceof Error ? error.message : typeof error === 'string' ? error : String(error ?? 'unknown');

  if (AUTH_PATTERNS.test(message)) {
    return {
      category: 'auth',
      retryable: false,
      requiresHumanAction: true,
      message,
    };
  }
  if (CONFIG_PATTERNS.test(message) && !NETWORK_PATTERNS.test(message)) {
    return {
      category: 'config',
      retryable: false,
      requiresHumanAction: true,
      message,
    };
  }
  if (RATE_PATTERNS.test(message)) {
    return {
      category: 'rate_limit',
      retryable: true,
      requiresHumanAction: false,
      message,
    };
  }
  if (NETWORK_PATTERNS.test(message)) {
    return {
      category: 'network',
      retryable: true,
      requiresHumanAction: false,
      message,
    };
  }
  if (VALIDATION_PATTERNS.test(message)) {
    return {
      category: 'validation',
      retryable: false,
      requiresHumanAction: true,
      message,
    };
  }
  if (QUOTA_SUPPLY_PATTERNS.test(message)) {
    return {
      category: 'quota_supply',
      retryable: false,
      requiresHumanAction: true,
      message,
    };
  }
  if (DUPLICATE_PATTERNS.test(message)) {
    return {
      category: 'duplicate',
      retryable: false,
      requiresHumanAction: false,
      message,
    };
  }

  return {
    category: 'unknown',
    retryable: true,
    requiresHumanAction: false,
    message,
  };
}

export function isPermanentError(error: unknown): boolean {
  const c = classifyError(error);
  return !c.retryable && c.requiresHumanAction;
}

export function isRetryableError(error: unknown): boolean {
  return classifyError(error).retryable;
}
