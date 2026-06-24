export function isCronAuthorized(request: Request, secret = process.env.CRON_SECRET): boolean {
  if (!secret) {
    return process.env.NODE_ENV !== 'production';
  }
  const auth = request.headers.get('authorization') || '';
  const xSecret = request.headers.get('x-cron-secret') || '';
  return auth === `Bearer ${secret}` || xSecret === secret;
}

/** Cron auth or one-off bootstrap secret (for operator scripts / post-deploy kick). */
export function isOutreachBootstrapAuthorized(request: Request): boolean {
  if (isCronAuthorized(request)) return true;
  const bootstrapSecret = process.env.FIRM_OUTREACH_BOOTSTRAP_SECRET?.trim();
  if (!bootstrapSecret) return false;
  const header = request.headers.get('x-firm-outreach-bootstrap-secret') || '';
  return header === bootstrapSecret;
}
