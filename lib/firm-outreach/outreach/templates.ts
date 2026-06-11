import { SITE_URL } from '@/lib/seo-layer/config';
import { COMMUNITY_EMAIL } from '@/lib/site-navigation';
import type { FirmProspect } from '../types';

function escapeHtml(val: string): string {
  return val
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function buildTrackedJoinUrl(prospect: FirmProspect): string {
  const path =
    prospect.prospectType === 'solicitor'
      ? `/go/whatsapp-solicitor?ref=${encodeURIComponent(prospect.id)}`
      : `/go/whatsapp-firm?ref=${encodeURIComponent(prospect.id)}`;
  return `${SITE_URL}${path}`;
}

export function subjectForStep(prospect: FirmProspect, step: number): string {
  if (step === 0) {
    return prospect.prospectType === 'solicitor'
      ? 'Police station cover on WhatsApp — for criminal defence solicitors'
      : 'Free WhatsApp group for criminal firms — police station cover';
  }
  if (step === 1) {
    return 'Reminder: join the PoliceStationRepUK firm WhatsApp group';
  }
  return 'Last note — police station cover group for criminal firms';
}

export function buildOutreachEmailHtml(opts: {
  prospect: FirmProspect;
  step: number;
  unsubscribeUrl: string;
}): string {
  const { prospect, step, unsubscribeUrl } = opts;
  const joinUrl = buildTrackedJoinUrl(prospect);
  const firmLine = escapeHtml(prospect.firmName);
  const greeting =
    prospect.prospectType === 'solicitor' && prospect.surname
      ? `Dear ${escapeHtml([prospect.title, prospect.surname].filter(Boolean).join(' '))},`
      : 'Hello,';

  const intro =
    step === 0
      ? prospect.prospectType === 'solicitor'
        ? `<p>PoliceStationRepUK runs a <strong>free, verified WhatsApp group</strong> for criminal defence solicitors and firms across England &amp; Wales. Post urgent police station cover when your rota needs a rep — accredited representatives respond in real time.</p>`
        : `<p>PoliceStationRepUK runs a <strong>free, verified WhatsApp group</strong> for criminal defence firms across England &amp; Wales. Post out-of-hours and weekend custody attendance requests — accredited police station reps who cover your areas can respond directly.</p>`
      : step === 1
        ? `<p>A quick reminder — the PoliceStationRepUK WhatsApp group is still open for <strong>${firmLine}</strong>. It is free, verified, and used by firms to source police station cover without an agency layer.</p>`
        : `<p>Final note from us — if ${firmLine} ever needs freelance police station cover, the PoliceStationRepUK WhatsApp group is a free resource used by criminal defence firms across England &amp; Wales.</p>`;

  const benefits =
    step === 0
      ? `<ul style="margin:16px 0;padding-left:20px;line-height:1.6">
          <li>Post urgent custody cover when your duty rota or panel needs a rep</li>
          <li>Hear back from accredited reps covering your stations and counties</li>
          <li>Instruct the rep directly — no middleman fees</li>
          <li>Works alongside the free <a href="${SITE_URL}/directory">rep directory</a></li>
        </ul>`
      : '';

  const refLine = `<p style="font-size:12px;color:#64748b">When you message us, include your firm name and SRA number if applicable. Ref: ${escapeHtml(prospect.id)}</p>`;

  return `
    <div style="font-family:system-ui,sans-serif;color:#0f172a;max-width:640px;line-height:1.5">
      <p>${greeting}</p>
      ${intro}
      ${benefits}
      <p style="margin:24px 0">
        <a href="${escapeHtml(joinUrl)}"
           style="display:inline-block;padding:12px 22px;background:#065f46;color:#ffffff;text-decoration:none;border-radius:8px;font-weight:700">
          Join on WhatsApp
        </a>
      </p>
      <p style="font-size:14px;color:#475569">
        Or read more: <a href="${SITE_URL}/WhatsApp/firms">${SITE_URL}/WhatsApp/firms</a>
      </p>
      ${refLine}
      <hr style="margin:32px 0;border:none;border-top:1px solid #e2e8f0" />
      <p style="font-size:12px;color:#64748b">
        Defence Legal Services Ltd · ICO ZA198500<br />
        Greenacre, London Road, West Kingsdown, Sevenoaks, Kent TN15 6ER<br />
        Reply to ${escapeHtml(COMMUNITY_EMAIL)} ·
        <a href="${escapeHtml(unsubscribeUrl)}">Unsubscribe</a>
      </p>
    </div>
  `;
}
