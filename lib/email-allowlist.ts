/** Preview-only outbound email allowlist (production uses normal routing). */
const PREVIEW_ALLOWLIST = new Set(['robertdavidcashman@gmail.com']);

function isPreviewDeployment(): boolean {
  const env = process.env.VERCEL_ENV?.trim();
  return env === 'preview' || process.env.PREVIEW_EMAIL_ALLOWLIST === '1';
}

function isLocalTest(): boolean {
  if (process.env.PREVIEW_EMAIL_ALLOWLIST === '1') return false;
  return (
    process.env.NODE_ENV !== 'production' ||
    process.env.VITEST === 'true' ||
    process.env.FIRM_OUTREACH_DRY_RUN === '1' ||
    process.env.FIRM_OUTREACH_DRY_RUN === 'true'
  );
}

/** Returns false when preview would send to a non-allowlisted recipient. */
export function isEmailRecipientAllowed(recipient: string): boolean {
  const email = recipient.trim().toLowerCase();
  if (!email) return false;
  if (isLocalTest()) return true;
  if (!isPreviewDeployment()) return true;
  return PREVIEW_ALLOWLIST.has(email);
}

export function previewEmailAllowlist(): string[] {
  return [...PREVIEW_ALLOWLIST];
}
