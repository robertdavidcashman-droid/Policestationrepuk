/** Owner email for outreach approval + confirmation messages. */
export function outreachNotifyEmail(): string {
  return (
    process.env.FIRM_OUTREACH_DIGEST_EMAIL?.trim() ||
    process.env.BUFFER_SCHEDULER_NOTIFY_EMAIL?.trim() ||
    process.env.OWNER_EMAIL?.trim() ||
    process.env.ADMIN_EMAILS?.split(/[,;]/)[0]?.trim() ||
    'robertdavidcashman@gmail.com'
  );
}
