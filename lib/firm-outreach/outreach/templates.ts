import { SITE_URL } from '@/lib/seo-layer/config';
import { COMMUNITY_EMAIL } from '@/lib/site-navigation';
import {
  POLICESTATIONAGENT_FREE_ADVICE_HREF,
  POLICESTATIONAGENT_HOME_HREF,
  POLICESTATIONAGENT_KENT_RESOURCES_HREF,
  POLICESTATIONAGENT_NAME,
  POLICESTATIONAGENT_SITE,
} from '@/lib/policestationagent-promo';
import { AGENT_COVER_KENT_CAMPAIGN_ID } from '../campaign-scope';
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

function isAgentCoverProspect(prospect: FirmProspect): boolean {
  return prospect.campaignId === AGENT_COVER_KENT_CAMPAIGN_ID;
}

export function subjectForStep(prospect: FirmProspect, step: number): string {
  if (isAgentCoverProspect(prospect)) {
    if (step === 0) {
      return 'Kent police station cover — agency solicitor services';
    }
    if (step === 1) {
      return `Reminder: ${POLICESTATIONAGENT_NAME} — Kent custody attendance cover`;
    }
    return 'Last note — Kent police station agency cover';
  }

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

function buildAgentCoverHtml(opts: {
  prospect: FirmProspect;
  step: number;
  unsubscribeUrl: string;
}): string {
  const { prospect, step, unsubscribeUrl } = opts;
  const firmLine = escapeHtml(prospect.firmName);
  const greeting =
    prospect.prospectType === 'solicitor' && prospect.surname
      ? `Dear ${escapeHtml([prospect.title, prospect.surname].filter(Boolean).join(' '))},`
      : 'Hello,';

  const intro =
    step === 0
      ? `<p><strong>${POLICESTATIONAGENT_NAME}</strong> provides criminal defence solicitor cover at Kent police stations — when your firm needs attendance at custody suites across the county, we can act as your agency representative.</p>
         <p>I've attached a short brochure covering stations we attend, turnaround times, and how agency cover works.</p>`
      : step === 1
        ? `<p>A quick reminder — ${POLICESTATIONAGENT_NAME} still offers Kent police station attendance cover for firms like <strong>${firmLine}</strong>.</p>`
        : `<p>Final note — if ${firmLine} ever needs Kent custody attendance cover, ${POLICESTATIONAGENT_NAME} is available for agency instructions.</p>`;

  const ctaUrl =
    step === 0 ? POLICESTATIONAGENT_FREE_ADVICE_HREF : POLICESTATIONAGENT_HOME_HREF;

  return `
    <div style="font-family:system-ui,sans-serif;color:#0f172a;max-width:640px;line-height:1.5">
      <p>${greeting}</p>
      ${intro}
      <ul style="margin:16px 0;padding-left:20px;line-height:1.6">
        <li>Coverage at Kent custody suites including Medway, Maidstone, Canterbury, and more</li>
        <li>Written attendance notes back within 24 hours</li>
        <li>Direct instruction — no middleman agency layer</li>
      </ul>
      <p style="margin:24px 0">
        <a href="${escapeHtml(ctaUrl)}"
           style="display:inline-block;padding:12px 22px;background:#1e3a5f;color:#ffffff;text-decoration:none;border-radius:8px;font-weight:700">
          View Kent police station cover
        </a>
      </p>
      <p style="font-size:14px;color:#475569">
        Resources: <a href="${POLICESTATIONAGENT_KENT_RESOURCES_HREF}">Kent custody resources</a>
      </p>
      <p style="font-size:12px;color:#64748b">Ref: ${escapeHtml(prospect.id)}</p>
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

export function buildOutreachEmailHtml(opts: {
  prospect: FirmProspect;
  step: number;
  unsubscribeUrl: string;
}): string {
  if (isAgentCoverProspect(opts.prospect)) {
    return buildAgentCoverHtml(opts);
  }

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
