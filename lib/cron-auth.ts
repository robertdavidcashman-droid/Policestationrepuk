export function isCronAuthorized(request: Request, secret = process.env.CRON_SECRET): boolean {
  if (!secret) {
    return process.env.NODE_ENV !== 'production';
  }
  const auth = request.headers.get('authorization') || '';
  const xSecret = request.headers.get('x-cron-secret') || '';
  return auth === `Bearer ${secret}` || xSecret === secret;
}
