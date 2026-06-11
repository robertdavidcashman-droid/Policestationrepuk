import { Resend } from 'resend';
import type {
  DiscoveryRunStats,
  EnrichmentRunStats,
  OutreachRunStats,
} from '../types';

const NOTIFY_EMAIL =
  process.env.FIRM_OUTREACH_DIGEST_EMAIL?.trim() ||
  process.env.BUFFER_SCHEDULER_NOTIFY_EMAIL?.trim() ||
  process.env.OWNER_EMAIL?.trim() ||
  'robertdavidcashman@gmail.com';

const FROM_EMAIL = 'PoliceStationRepUK <noreply@policestationrepuk.org>';

let resend: Resend | null = null;

function getResend(): Resend | null {
  if (resend) return resend;
  const key = process.env.RESEND_API_KEY?.trim();
  if (!key) return null;
  resend = new Resend(key);
  return resend;
}

export async function sendOutreachDigestEmail(opts: {
  discovery: DiscoveryRunStats;
  enrich: EnrichmentRunStats;
  send: OutreachRunStats;
  counts: Record<string, number>;
  laaRefreshed: boolean;
}): Promise<boolean> {
  const client = getResend();
  const date = new Date().toISOString().slice(0, 10);
  const subject = `[Firm outreach] Pipeline run — ${date}`;

  const rows = Object.entries(opts.counts)
    .map(([k, v]) => `<tr><td>${k}</td><td>${v}</td></tr>`)
    .join('');

  const html = `
    <div style="font-family:system-ui,sans-serif;max-width:640px">
      <h2>Firm WhatsApp outreach — automated pipeline</h2>
      <p><strong>LAA data:</strong> ${opts.laaRefreshed ? 'refreshed from gov.uk' : 'used cache'}</p>
      <h3>Discovery</h3>
      <ul>
        <li>LAA rows: ${opts.discovery.laaRows}</li>
        <li>Created: ${opts.discovery.created} · Updated: ${opts.discovery.updated}</li>
      </ul>
      <h3>Enrichment</h3>
      <ul>
        <li>Processed: ${opts.enrich.processed}</li>
        <li>Emails found: ${opts.enrich.emailsFound}</li>
        <li>Ready to send: ${opts.enrich.readyToSend}</li>
      </ul>
      <h3>Send</h3>
      <ul>
        <li>Sent: ${opts.send.sent}</li>
        <li>Skipped: ${opts.send.skipped} · Suppressed: ${opts.send.suppressed}</li>
        <li>Errors: ${opts.send.errors}</li>
      </ul>
      <h3>Prospect counts</h3>
      <table border="1" cellpadding="6" style="border-collapse:collapse;font-size:14px">${rows}</table>
      <p style="margin-top:16px"><a href="https://policestationrepuk.org/admin/firm-outreach">Open admin dashboard</a></p>
    </div>
  `;

  if (!client) {
    console.info('[firm-outreach digest]', subject);
    return false;
  }

  try {
    await client.emails.send({ from: FROM_EMAIL, to: NOTIFY_EMAIL, subject, html });
    return true;
  } catch (err) {
    console.warn('[firm-outreach digest]', err);
    return false;
  }
}
