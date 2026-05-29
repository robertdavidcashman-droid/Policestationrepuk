import { Resend } from 'resend';
import { phoneToTelHref } from '@/lib/phone';

const ADMIN_EMAIL = 'robertcashman@defencelegalservices.co.uk';
const REGULATORY_ALERT_EMAIL =
  process.env.REGULATORY_ALERT_EMAIL?.trim() || 'robertdavidcashman@gmail.com';
const FROM_EMAIL = 'PoliceStationRepUK <noreply@policestationrepuk.org>';

let resend: Resend | null = null;

function getResend(): Resend | null {
  if (resend) return resend;
  const key = process.env.RESEND_API_KEY;
  if (!key) return null;
  resend = new Resend(key);
  return resend;
}

interface ContactSubmission {
  name: string;
  email: string;
  subject?: string;
  message: string;
}

interface RegistrationSubmission {
  name: string;
  email: string;
  phone?: string;
  accreditation?: string;
  counties?: string | string[];
  coverage_areas?: string;
  stations?: string | string[];
  availability?: string;
  message?: string;
}

export async function sendContactNotification(data: ContactSubmission): Promise<boolean> {
  const client = getResend();
  if (!client) {
    console.info('[Contact form — no RESEND_API_KEY]', { name: data.name, email: data.email, subject: data.subject });
    return false;
  }

  try {
    await client.emails.send({
      from: FROM_EMAIL,
      to: ADMIN_EMAIL,
      replyTo: data.email,
      subject: `[Contact Form] ${data.subject || 'New enquiry'} — from ${data.name}`,
      html: `
        <h2>New Contact Form Submission</h2>
        <table style="border-collapse:collapse;width:100%;max-width:600px;">
          <tr><td style="padding:8px;font-weight:bold;border-bottom:1px solid #e5e7eb;">Name</td><td style="padding:8px;border-bottom:1px solid #e5e7eb;">${escapeHtml(data.name)}</td></tr>
          <tr><td style="padding:8px;font-weight:bold;border-bottom:1px solid #e5e7eb;">Email</td><td style="padding:8px;border-bottom:1px solid #e5e7eb;"><a href="mailto:${escapeHtml(data.email)}">${escapeHtml(data.email)}</a></td></tr>
          ${data.subject ? `<tr><td style="padding:8px;font-weight:bold;border-bottom:1px solid #e5e7eb;">Subject</td><td style="padding:8px;border-bottom:1px solid #e5e7eb;">${escapeHtml(data.subject)}</td></tr>` : ''}
          <tr><td style="padding:8px;font-weight:bold;border-bottom:1px solid #e5e7eb;">Message</td><td style="padding:8px;border-bottom:1px solid #e5e7eb;">${escapeHtml(data.message).replace(/\n/g, '<br>')}</td></tr>
        </table>
        <p style="margin-top:16px;color:#6b7280;font-size:12px;">Sent via PoliceStationRepUK contact form</p>
      `,
    });
    return true;
  } catch (err) {
    console.error('[Contact email failed]', err);
    return false;
  }
}

export async function sendRegistrationNotification(data: RegistrationSubmission): Promise<boolean> {
  const client = getResend();
  if (!client) {
    console.info('[Registration — no RESEND_API_KEY]', { name: data.name, email: data.email });
    return false;
  }

  const detailRows = `
    <tr><td style="padding:8px;font-weight:bold;border-bottom:1px solid #e5e7eb;">Name</td><td style="padding:8px;border-bottom:1px solid #e5e7eb;">${escapeHtml(data.name)}</td></tr>
    <tr><td style="padding:8px;font-weight:bold;border-bottom:1px solid #e5e7eb;">Email</td><td style="padding:8px;border-bottom:1px solid #e5e7eb;"><a href="mailto:${escapeHtml(data.email)}">${escapeHtml(data.email)}</a></td></tr>
    ${data.phone ? `<tr><td style="padding:8px;font-weight:bold;border-bottom:1px solid #e5e7eb;">Phone</td><td style="padding:8px;border-bottom:1px solid #e5e7eb;"><a href="${escapeHtml(phoneToTelHref(data.phone))}">${escapeHtml(data.phone)}</a></td></tr>` : ''}
    ${data.accreditation ? `<tr><td style="padding:8px;font-weight:bold;border-bottom:1px solid #e5e7eb;">Accreditation</td><td style="padding:8px;border-bottom:1px solid #e5e7eb;">${escapeHtml(data.accreditation)}</td></tr>` : ''}
    ${data.counties ? `<tr><td style="padding:8px;font-weight:bold;border-bottom:1px solid #e5e7eb;">Counties</td><td style="padding:8px;border-bottom:1px solid #e5e7eb;">${escapeHtml(typeof data.counties === 'string' ? data.counties : Array.isArray(data.counties) ? data.counties.join(', ') : '')}</td></tr>` : ''}
    ${data.coverage_areas ? `<tr><td style="padding:8px;font-weight:bold;border-bottom:1px solid #e5e7eb;">Towns & coverage areas</td><td style="padding:8px;border-bottom:1px solid #e5e7eb;">${escapeHtml(data.coverage_areas).replace(/\n/g, '<br>')}</td></tr>` : ''}
    ${data.stations ? `<tr><td style="padding:8px;font-weight:bold;border-bottom:1px solid #e5e7eb;">Stations</td><td style="padding:8px;border-bottom:1px solid #e5e7eb;">${escapeHtml(data.stations)}</td></tr>` : ''}
    ${data.availability ? `<tr><td style="padding:8px;font-weight:bold;border-bottom:1px solid #e5e7eb;">Availability</td><td style="padding:8px;border-bottom:1px solid #e5e7eb;">${escapeHtml(data.availability)}</td></tr>` : ''}
    ${data.message ? `<tr><td style="padding:8px;font-weight:bold;border-bottom:1px solid #e5e7eb;">Message</td><td style="padding:8px;border-bottom:1px solid #e5e7eb;">${escapeHtml(data.message).replace(/\n/g, '<br>')}</td></tr>` : ''}
  `;

  try {
    await Promise.all([
      client.emails.send({
        from: FROM_EMAIL,
        to: ADMIN_EMAIL,
        replyTo: data.email,
        subject: `[New Rep Registration] ${data.name}`,
        html: `
          <h2>New Representative Registration</h2>
          <table style="border-collapse:collapse;width:100%;max-width:600px;">${detailRows}</table>
          <p style="margin-top:16px;color:#6b7280;font-size:12px;">Sent via PoliceStationRepUK registration form</p>
        `,
      }),
      client.emails.send({
        from: FROM_EMAIL,
        to: data.email,
        subject: 'Your PoliceStationRepUK registration has been received',
        html: `
          <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:20px">
            <h2 style="color:#0f172a">Thanks for registering, ${escapeHtml(data.name)}</h2>
            <p style="color:#475569;font-size:14px;line-height:1.6">
              We have received your registration to join the <strong>PoliceStationRepUK</strong> directory.
              Our team will review your details and you should hear from us within <strong>24 hours</strong>
              (often sooner).
            </p>
            <p style="color:#475569;font-size:14px;line-height:1.6">
              Once approved your profile will be published and criminal defence firms will be able to find
              and instruct you directly through the directory.
            </p>
            <h3 style="color:#0f172a;margin-top:24px;font-size:15px">What you submitted</h3>
            <table style="border-collapse:collapse;width:100%;max-width:600px;">${detailRows}</table>
            <p style="margin-top:24px;color:#475569;font-size:14px">
              If anything above looks wrong, just reply to this email and let us know.
            </p>
            <hr style="margin:24px 0;border:none;border-top:1px solid #e5e7eb">
            <p style="color:#94a3b8;font-size:12px">
              PoliceStationRepUK &mdash; Free directory for accredited police station representatives.<br>
              <a href="https://policestationrepuk.org" style="color:#94a3b8">policestationrepuk.org</a>
            </p>
          </div>
        `,
      }),
    ]);
    return true;
  } catch (err) {
    console.error('[Registration email failed]', err);
    return false;
  }
}

interface StationUpdateSubmission {
  stationId: string;
  stationName: string;
  current: {
    address?: string;
    postcode?: string;
    phone?: string;
    custodyPhone?: string;
    nonEmergencyPhone?: string;
  };
  suggested: {
    address?: string;
    postcode?: string;
    phone?: string;
    custodyPhone?: string;
    nonEmergencyPhone?: string;
  };
  notes?: string;
  submitterName: string;
  submitterEmail: string;
}

export async function sendStationUpdateNotification(data: StationUpdateSubmission): Promise<boolean> {
  const client = getResend();
  if (!client) {
    console.info('[Station update — no RESEND_API_KEY]', { station: data.stationName, submitter: data.submitterName });
    return false;
  }

  const diffRow = (label: string, current: string | undefined, suggested: string | undefined) => {
    if (!suggested) return '';
    const cur = current || '(empty)';
    const changed = cur !== suggested;
    return `<tr>
      <td style="padding:8px;font-weight:bold;border-bottom:1px solid #e5e7eb;width:140px">${label}</td>
      <td style="padding:8px;border-bottom:1px solid #e5e7eb;color:#6b7280">${escapeHtml(cur)}</td>
      <td style="padding:8px;border-bottom:1px solid #e5e7eb;font-weight:${changed ? 'bold' : 'normal'};color:${changed ? '#059669' : '#374151'}">${escapeHtml(suggested)}</td>
    </tr>`;
  };

  const rows = [
    diffRow('Address', data.current.address, data.suggested.address),
    diffRow('Postcode', data.current.postcode, data.suggested.postcode),
    diffRow('Phone', data.current.phone, data.suggested.phone),
    diffRow('Custody Phone', data.current.custodyPhone, data.suggested.custodyPhone),
    diffRow('Non-emergency Phone', data.current.nonEmergencyPhone, data.suggested.nonEmergencyPhone),
  ].filter(Boolean).join('');

  try {
    await client.emails.send({
      from: FROM_EMAIL,
      to: ADMIN_EMAIL,
      replyTo: data.submitterEmail,
      subject: `[Station Update] ${data.stationName} — suggested by ${data.submitterName}`,
      html: `
        <h2>Station Update Suggestion</h2>
        <p><strong>Station:</strong> ${escapeHtml(data.stationName)} <span style="color:#6b7280">(${escapeHtml(data.stationId)})</span></p>
        <table style="border-collapse:collapse;width:100%;max-width:700px;">
          <thead>
            <tr style="background:#f9fafb">
              <th style="padding:8px;text-align:left;border-bottom:2px solid #e5e7eb">Field</th>
              <th style="padding:8px;text-align:left;border-bottom:2px solid #e5e7eb">Current</th>
              <th style="padding:8px;text-align:left;border-bottom:2px solid #e5e7eb">Suggested</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
        ${data.notes ? `<p style="margin-top:16px"><strong>Notes:</strong><br>${escapeHtml(data.notes).replace(/\n/g, '<br>')}</p>` : ''}
        <hr style="margin:20px 0;border:none;border-top:1px solid #e5e7eb">
        <p><strong>Submitted by:</strong> ${escapeHtml(data.submitterName)} &lt;<a href="mailto:${escapeHtml(data.submitterEmail)}">${escapeHtml(data.submitterEmail)}</a>&gt;</p>
        <p style="margin-top:16px;color:#6b7280;font-size:12px;">Sent via PoliceStationRepUK station update form. Review before applying changes.</p>
      `,
    });
    return true;
  } catch (err) {
    console.error('[Station update email failed]', err);
    return false;
  }
}

export async function sendLeadMagnetNotification(data: {
  email: string;
  source?: string;
  leadMagnet?: string;
}): Promise<boolean> {
  const client = getResend();
  if (!client) {
    console.info('[Lead magnet — no RESEND_API_KEY]', { email: data.email });
    return false;
  }

  try {
    await client.emails.send({
      from: FROM_EMAIL,
      to: ADMIN_EMAIL,
      replyTo: data.email,
      subject: `[Lead magnet] ${data.leadMagnet || 'Custody note template'} — ${data.email}`,
      html: `
        <h2>Lead magnet request</h2>
        <p><strong>Email:</strong> <a href="mailto:${escapeHtml(data.email)}">${escapeHtml(data.email)}</a></p>
        ${data.source ? `<p><strong>Source:</strong> ${escapeHtml(data.source)}</p>` : ''}
        ${data.leadMagnet ? `<p><strong>Offer:</strong> ${escapeHtml(data.leadMagnet)}</p>` : ''}
        <p style="margin-top:16px;color:#6b7280;font-size:12px;">Sent from PoliceStationRepUK conversion funnel.</p>
      `,
    });
    return true;
  } catch (err) {
    console.error('[Lead magnet email failed]', err);
    return false;
  }
}

export async function sendMagicCode(email: string, code: string): Promise<boolean> {
  const client = getResend();
  if (!client) {
    console.info('[Magic code — no RESEND_API_KEY]', { email });
    return false;
  }

  try {
    await client.emails.send({
      from: FROM_EMAIL,
      to: email,
      subject: `Your PoliceStationRepUK login code: ${code}`,
      html: `
        <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:20px">
          <h2 style="color:#0f172a;margin-bottom:8px">Your login code</h2>
          <p style="color:#475569;font-size:14px;margin-bottom:20px">
            Use this code to sign in to your PoliceStationRepUK account. It expires in 10 minutes.
          </p>
          <div style="background:#f8fafc;border:2px solid #e2e8f0;border-radius:8px;padding:24px;text-align:center;margin-bottom:20px">
            <span style="font-family:monospace;font-size:32px;letter-spacing:0.3em;font-weight:bold;color:#0f172a">${escapeHtml(code)}</span>
          </div>
          <p style="color:#94a3b8;font-size:12px">
            If you didn&rsquo;t request this code, you can safely ignore this email.
          </p>
        </div>
      `,
    });
    return true;
  } catch (err) {
    console.error('[Magic code email failed]', err);
    return false;
  }
}

/** Rep-facing notice after listing corrections (reply goes to site owner). */
export async function sendRepListingUpdateNotice(data: {
  toEmail: string;
  repName: string;
  profileUrl: string;
  listingEmail: string;
  websiteHostname: string;
  websiteHref: string;
  phoneDisplay: string;
}): Promise<boolean> {
  const client = getResend();
  if (!client) {
    console.info('[Rep listing update notice — no RESEND_API_KEY]', { to: data.toEmail });
    return false;
  }

  const profile = escapeHtml(data.profileUrl);
  try {
    await client.emails.send({
      from: FROM_EMAIL,
      to: data.toEmail,
      replyTo: ADMIN_EMAIL,
      subject: 'Your PoliceStationRepUK listing has been updated',
      html: `
        <div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:20px;color:#0f172a">
          <p>Hello ${escapeHtml(data.repName)},</p>
          <p>Your directory listing has been updated as requested:</p>
          <ul style="line-height:1.65">
            <li><strong>Email</strong> (quick contact and profile): <a href="mailto:${escapeHtml(data.listingEmail)}">${escapeHtml(data.listingEmail)}</a></li>
            <li><strong>Website</strong>: <a href="${escapeHtml(data.websiteHref)}">${escapeHtml(data.websiteHostname)}</a></li>
            <li><strong>WhatsApp</strong> contact link added (your listing mobile ${escapeHtml(data.phoneDisplay)})</li>
          </ul>
          <p><strong>Account login:</strong> use <strong>${escapeHtml(data.listingEmail)}</strong> on the Account page to request a login code. The address above is now the one matched to your listing.</p>
          <p>Your profile: <a href="${profile}">${profile}</a></p>
          <p style="color:#64748b;font-size:13px;margin-top:24px">If anything still looks wrong, reply to this email.</p>
          <p style="color:#64748b;font-size:12px">PoliceStationRepUK</p>
        </div>
      `,
    });
    return true;
  } catch (err) {
    console.error('[Rep listing update notice failed]', err);
    return false;
  }
}

interface ProfileUpdateData {
  repName: string;
  repEmail: string;
  repSlug: string;
  changes: Record<string, { from: string; to: string }>;
}

export async function sendProfileUpdateNotification(data: ProfileUpdateData): Promise<boolean> {
  const client = getResend();
  if (!client) {
    console.info('[Profile update — no RESEND_API_KEY]', { rep: data.repName, email: data.repEmail });
    return false;
  }

  const rows = Object.entries(data.changes)
    .map(
      ([field, { from, to }]) => `
        <tr>
          <td style="padding:8px;font-weight:bold;border-bottom:1px solid #e5e7eb;width:160px">${escapeHtml(field)}</td>
          <td style="padding:8px;border-bottom:1px solid #e5e7eb;color:#6b7280;text-decoration:line-through">${escapeHtml(from || '(empty)')}</td>
          <td style="padding:8px;border-bottom:1px solid #e5e7eb;font-weight:bold;color:#059669">${escapeHtml(to || '(empty)')}</td>
        </tr>`,
    )
    .join('');

  try {
    await client.emails.send({
      from: FROM_EMAIL,
      to: ADMIN_EMAIL,
      replyTo: data.repEmail,
      subject: `[Profile Update] ${data.repName} updated their listing`,
      html: `
        <h2>Self-Service Profile Update</h2>
        <p><strong>${escapeHtml(data.repName)}</strong> (&lt;<a href="mailto:${escapeHtml(data.repEmail)}">${escapeHtml(data.repEmail)}</a>&gt;) updated their directory profile.</p>
        <p><a href="https://policestationrepuk.org/rep/${escapeHtml(data.repSlug)}">View public profile</a></p>
        <table style="border-collapse:collapse;width:100%;max-width:700px;">
          <thead>
            <tr style="background:#f9fafb">
              <th style="padding:8px;text-align:left;border-bottom:2px solid #e5e7eb">Field</th>
              <th style="padding:8px;text-align:left;border-bottom:2px solid #e5e7eb">Before</th>
              <th style="padding:8px;text-align:left;border-bottom:2px solid #e5e7eb">After</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
        <p style="margin-top:16px;color:#6b7280;font-size:12px;">
          Changed via the self-service portal. A site rebuild may be needed for the public pages to reflect these changes.
        </p>
      `,
    });
    return true;
  } catch (err) {
    console.error('[Profile update email failed]', err);
    return false;
  }
}

export async function sendFeaturedConfirmationToRep(data: {
  name: string;
  email: string;
  activatedAt: string;
}): Promise<boolean> {
  const client = getResend();
  if (!client) {
    console.info('[Featured rep email — no RESEND_API_KEY]', { name: data.name, email: data.email });
    return false;
  }

  try {
    await client.emails.send({
      from: FROM_EMAIL,
      to: data.email,
      subject: 'Your Featured Listing is now live — PoliceStationRepUK',
      html: `
        <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:20px">
          <h2 style="color:#0f172a">Congratulations, ${escapeHtml(data.name)}!</h2>
          <p style="color:#475569;font-size:14px;line-height:1.6">
            Your listing on <strong>PoliceStationRepUK</strong> has been upgraded to a
            <strong style="color:#b8860b">Featured Listing</strong>.
          </p>
          <p style="color:#475569;font-size:14px;line-height:1.6">
            Your profile will now appear in the <strong>Featured Representatives</strong> section
            on the homepage and at the top of directory search results, giving you maximum
            visibility to instructing solicitor firms.
          </p>
          <div style="background:#fefce8;border:1px solid #fde68a;border-radius:8px;padding:16px;margin:20px 0">
            <p style="margin:0;font-size:14px;color:#854d0e"><strong>Activated:</strong> ${escapeHtml(new Date(data.activatedAt).toLocaleString('en-GB', { dateStyle: 'full', timeStyle: 'short' }))}</p>
          </div>
          <p style="color:#475569;font-size:14px;line-height:1.6">
            You can manage your profile at any time by signing in to your account.
          </p>
          <hr style="margin:24px 0;border:none;border-top:1px solid #e5e7eb">
          <p style="color:#94a3b8;font-size:12px">
            PoliceStationRepUK &mdash; Free directory for accredited police station representatives.<br>
            <a href="https://policestationrepuk.org" style="color:#94a3b8">policestationrepuk.org</a>
          </p>
        </div>
      `,
    });
    return true;
  } catch (err) {
    console.error('[Featured rep email failed]', err);
    return false;
  }
}

export async function sendFeaturedOwnerNotification(data: {
  name: string;
  email: string;
  repSlug: string;
  activatedAt: string;
}): Promise<boolean> {
  const client = getResend();
  if (!client) {
    console.info('[Featured owner email — no RESEND_API_KEY]', { name: data.name, email: data.email });
    return false;
  }

  try {
    await client.emails.send({
      from: FROM_EMAIL,
      to: ADMIN_EMAIL,
      replyTo: data.email,
      subject: `[Featured Upgrade] ${data.name} is now a Featured Representative`,
      html: `
        <h2>New Featured Representative</h2>
        <table style="border-collapse:collapse;width:100%;max-width:600px;">
          <tr><td style="padding:8px;font-weight:bold;border-bottom:1px solid #e5e7eb;">Name</td><td style="padding:8px;border-bottom:1px solid #e5e7eb;">${escapeHtml(data.name)}</td></tr>
          <tr><td style="padding:8px;font-weight:bold;border-bottom:1px solid #e5e7eb;">Email</td><td style="padding:8px;border-bottom:1px solid #e5e7eb;"><a href="mailto:${escapeHtml(data.email)}">${escapeHtml(data.email)}</a></td></tr>
          <tr><td style="padding:8px;font-weight:bold;border-bottom:1px solid #e5e7eb;">Profile</td><td style="padding:8px;border-bottom:1px solid #e5e7eb;"><a href="https://policestationrepuk.org/rep/${escapeHtml(data.repSlug)}">View profile</a></td></tr>
          <tr><td style="padding:8px;font-weight:bold;border-bottom:1px solid #e5e7eb;">Activated</td><td style="padding:8px;border-bottom:1px solid #e5e7eb;">${escapeHtml(data.activatedAt)}</td></tr>
        </table>
        <p style="margin-top:16px;color:#6b7280;font-size:12px;">
          This rep upgraded to Featured via the self-service portal on PoliceStationRepUK.
        </p>
      `,
    });
    return true;
  } catch (err) {
    console.error('[Featured owner email failed]', err);
    return false;
  }
}

/* ------------------------------------------------------------------ */
/*  Self-serve registration alerts                                     */
/* ------------------------------------------------------------------ */

export interface RegistrationDecisionFields {
  name: string;
  email: string;
  phone: string;
  category: string;
  accreditation: string;
  pinNumber?: string;
  sraNumber?: string;
  firmName?: string;
  professionalProfileUrl?: string;
  proofUrl?: string;
  counties?: string;
  stations?: string;
  availability?: string;
  publicNotes?: string;
  fullPostalAddress?: string;
  ipAddress?: string;
  userAgent?: string;
  profileUrl?: string;
  riskCategory: string;
  riskReasons: string[];
  registeredAt: string;
}

function registrationFieldRows(d: RegistrationDecisionFields): string {
  const row = (label: string, value: string | undefined) =>
    value
      ? `<tr><td style="padding:8px;font-weight:bold;border-bottom:1px solid #e5e7eb;vertical-align:top;width:200px">${escapeHtml(label)}</td><td style="padding:8px;border-bottom:1px solid #e5e7eb;">${escapeHtml(value).replace(/\n/g, '<br>')}</td></tr>`
      : '';
  return [
    row('Name', d.name),
    row('Email', d.email),
    row('Phone', d.phone),
    row('Category', d.category),
    row('Accreditation (free text)', d.accreditation),
    row('DSCC / PIN number', d.pinNumber),
    row('SRA number', d.sraNumber),
    row('Firm', d.firmName),
    row('Professional webpage', d.professionalProfileUrl),
    row('Proof of accreditation (URL)', d.proofUrl),
    row('Counties covered', d.counties),
    row('Police stations covered', d.stations),
    row('Availability', d.availability),
    row('Public notes', d.publicNotes),
    row('Full postal address (PRIVATE)', d.fullPostalAddress),
    row('IP address', d.ipAddress),
    row('User agent', d.userAgent),
    row('Registered at', d.registeredAt),
  ]
    .filter(Boolean)
    .join('');
}

/**
 * Admin notification: low-risk registration was auto-published.
 * FYI only — the profile is already live. Admin can still suspend it
 * from the Rep Verification Audit view at any time.
 */
export async function sendRepAutoPublishAdminAlert(
  data: RegistrationDecisionFields,
): Promise<boolean> {
  const client = getResend();
  if (!client) {
    console.info('[Auto-publish admin alert — no RESEND_API_KEY]', { name: data.name, email: data.email });
    return false;
  }
  try {
    await client.emails.send({
      from: FROM_EMAIL,
      to: ADMIN_EMAIL,
      replyTo: data.email,
      subject: `[Auto-published] ${data.name} (${data.category}) — registered on PoliceStationRepUK`,
      html: `
        <div style="font-family:sans-serif;max-width:640px;margin:0 auto;color:#0f172a">
          <h2 style="color:#0f172a">New rep auto-published</h2>
          <p style="color:#475569;font-size:14px;line-height:1.55">
            ${escapeHtml(data.name)} has just registered through the self-serve form. They passed
            all eligibility and completeness checks, so their profile is <strong>already live</strong>
            in the public directory.
          </p>
          ${
            data.profileUrl
              ? `<p style="margin:16px 0"><a href="${escapeHtml(data.profileUrl)}" style="color:#1d4ed8">View public profile</a></p>`
              : ''
          }
          <p style="margin:16px 0">
            <a href="https://policestationrepuk.org/admin" style="color:#1d4ed8">Open the Rep Verification Audit</a>
            to suspend, re-flag or remove this profile if anything looks wrong.
          </p>
          <table style="border-collapse:collapse;width:100%;max-width:640px;margin-top:16px">${registrationFieldRows(data)}</table>
          <p style="margin-top:16px;color:#6b7280;font-size:12px;">
            Risk category at submission: <strong>${escapeHtml(data.riskCategory)}</strong>${data.riskReasons.length ? ' &mdash; ' + escapeHtml(data.riskReasons.join('; ')) : ''}.
          </p>
        </div>
      `,
    });
    return true;
  } catch (err) {
    console.error('[Auto-publish admin alert failed]', err);
    return false;
  }
}

export interface RegulatoryNoMatchAlertData {
  name: string;
  email: string;
  sraNumber?: string;
  pinNumber?: string;
  firmName?: string;
  profileUrl?: string;
  source: 'register' | 'secure-verification';
  sraMatched: boolean;
  lawSocietyMatched: boolean;
  dsccMatched: boolean;
  note: string;
}

/**
 * Alert when a new rep is not found on the SRA, Law Society, or DSCC registers.
 */
export async function sendRegulatoryRegisterNoMatchAlert(
  data: RegulatoryNoMatchAlertData,
): Promise<boolean> {
  const client = getResend();
  if (!client) {
    console.info('[Regulatory no-match alert — no RESEND_API_KEY]', {
      name: data.name,
      email: data.email,
    });
    return false;
  }

  const statusRow = (label: string, matched: boolean) =>
    `<tr><td style="padding:8px;font-weight:bold;border-bottom:1px solid #e5e7eb;width:220px">${escapeHtml(label)}</td>` +
    `<td style="padding:8px;border-bottom:1px solid #e5e7eb;color:${matched ? '#059669' : '#b91c1c'}">` +
    `${matched ? 'Match found' : 'No match'}</td></tr>`;

  const sourceLabel =
    data.source === 'register' ? 'Self-serve registration' : 'Secure verification form';

  try {
    await client.emails.send({
      from: FROM_EMAIL,
      to: REGULATORY_ALERT_EMAIL,
      replyTo: data.email,
      subject: `[No register match] ${data.name} — SRA / Law Society / DSCC`,
      html: `
        <div style="font-family:sans-serif;max-width:640px;margin:0 auto;color:#0f172a">
          <h2 style="color:#b91c1c">No public register match</h2>
          <p style="color:#475569;font-size:14px;line-height:1.55">
            A new rep joined via <strong>${escapeHtml(sourceLabel)}</strong> but was not found on
            the SRA Solicitors Register, the Law Society Find a Solicitor database, or the DSCC
            accredited representative register. Manual review is required before publishing.
          </p>
          ${
            data.profileUrl
              ? `<p style="margin:16px 0"><a href="${escapeHtml(data.profileUrl)}" style="color:#1d4ed8">View profile (if created)</a></p>`
              : ''
          }
          <p style="margin:16px 0">
            <a href="https://policestationrepuk.org/admin" style="color:#1d4ed8;font-weight:bold">Open Rep Verification Audit &rarr;</a>
          </p>
          <table style="border-collapse:collapse;width:100%;max-width:640px;margin-top:16px">
            ${statusRow('SRA Solicitors Register', data.sraMatched)}
            ${statusRow('Law Society Find a Solicitor', data.lawSocietyMatched)}
            ${statusRow('DSCC accredited register', data.dsccMatched)}
            <tr><td style="padding:8px;font-weight:bold;border-bottom:1px solid #e5e7eb;vertical-align:top">Name</td><td style="padding:8px;border-bottom:1px solid #e5e7eb">${escapeHtml(data.name)}</td></tr>
            <tr><td style="padding:8px;font-weight:bold;border-bottom:1px solid #e5e7eb;vertical-align:top">Email</td><td style="padding:8px;border-bottom:1px solid #e5e7eb">${escapeHtml(data.email)}</td></tr>
            ${data.sraNumber ? `<tr><td style="padding:8px;font-weight:bold;border-bottom:1px solid #e5e7eb">SRA number supplied</td><td style="padding:8px;border-bottom:1px solid #e5e7eb">${escapeHtml(data.sraNumber)}</td></tr>` : ''}
            ${data.pinNumber ? `<tr><td style="padding:8px;font-weight:bold;border-bottom:1px solid #e5e7eb">DSCC PIN supplied</td><td style="padding:8px;border-bottom:1px solid #e5e7eb">${escapeHtml(data.pinNumber)}</td></tr>` : ''}
            ${data.firmName ? `<tr><td style="padding:8px;font-weight:bold;border-bottom:1px solid #e5e7eb">Firm</td><td style="padding:8px;border-bottom:1px solid #e5e7eb">${escapeHtml(data.firmName)}</td></tr>` : ''}
          </table>
          <p style="margin-top:16px;color:#64748b;font-size:12px;line-height:1.5">${escapeHtml(data.note)}</p>
        </div>
      `,
    });
    return true;
  } catch (err) {
    console.error('[Regulatory no-match alert failed]', err);
    return false;
  }
}

export interface HeldForReviewDecisionLinks {
  /** Full https URL to the Approve interstitial. */
  approveUrl: string;
  /** Full https URL to the Decline interstitial. */
  declineUrl: string;
  /** When the underlying tokens expire (display only, e.g. "in 7 days"). */
  expiresLabel?: string;
}

/**
 * Admin notification: registration was held back for manual review.
 * Triggered whenever risk scoring flags ANY doubt — missing PIN/SRA/proof,
 * suspicious wording, disposable email, unrealistic coverage, etc.
 *
 * Pass `decisionLinks` to embed one-click Approve / Decline buttons that
 * open a confirmation page. Without `decisionLinks` (e.g. if KV is down or
 * `ADMIN_DECISION_TOKEN_SECRET` is unset) the email falls back to the legacy
 * "Review this submission" link to /admin.
 */
export async function sendRepHeldForReviewAlert(
  data: RegistrationDecisionFields,
  decisionLinks?: HeldForReviewDecisionLinks,
): Promise<boolean> {
  const client = getResend();
  if (!client) {
    console.info('[Held-for-review admin alert — no RESEND_API_KEY]', { name: data.name, email: data.email });
    return false;
  }

  const buttonsBlock = decisionLinks
    ? `
        <div style="margin:24px 0;padding:18px;border:1px solid #e2e8f0;border-radius:10px;background:#f8fafc">
          <p style="margin:0 0 14px;font-size:14px;color:#0f172a;font-weight:600">
            One-click decision:
          </p>
          <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin:0">
            <tr>
              <td style="padding-right:12px">
                <a href="${escapeHtml(decisionLinks.approveUrl)}"
                   style="display:inline-block;padding:12px 22px;background:#059669;color:#ffffff;
                          text-decoration:none;font-weight:700;font-size:14px;border-radius:8px;
                          border:1px solid #047857">
                  Approve &amp; publish
                </a>
              </td>
              <td>
                <a href="${escapeHtml(decisionLinks.declineUrl)}"
                   style="display:inline-block;padding:12px 22px;background:#b91c1c;color:#ffffff;
                          text-decoration:none;font-weight:700;font-size:14px;border-radius:8px;
                          border:1px solid #991b1b">
                  Decline
                </a>
              </td>
            </tr>
          </table>
          <p style="margin:14px 0 0;font-size:12px;color:#64748b;line-height:1.5">
            Each button opens a confirmation page that requires one more click before
            anything is actioned${decisionLinks.expiresLabel ? ` (links expire ${escapeHtml(decisionLinks.expiresLabel)})` : ''}.
            Decisions take effect immediately and are reversible from
            <a href="https://policestationrepuk.org/admin" style="color:#1d4ed8">/admin</a>.
          </p>
        </div>
      `
    : `
        <p style="margin:16px 0">
          <a href="https://policestationrepuk.org/admin" style="color:#1d4ed8;font-weight:bold">Review this submission &rarr;</a>
        </p>
      `;

  try {
    await client.emails.send({
      from: FROM_EMAIL,
      to: ADMIN_EMAIL,
      replyTo: data.email,
      subject: `[ACTION REQUIRED] ${data.name} — held for review (${data.riskCategory} risk)`,
      html: `
        <div style="font-family:sans-serif;max-width:640px;margin:0 auto;color:#0f172a">
          <h2 style="color:#b45309">Held for manual review</h2>
          <p style="color:#475569;font-size:14px;line-height:1.55">
            ${escapeHtml(data.name)} has registered through the self-serve form but their submission
            was flagged for review. Their profile is <strong>NOT</strong> currently visible in the
            public directory.
          </p>
          ${buttonsBlock}
          <div style="background:#fef3c7;border:1px solid #fcd34d;border-radius:8px;padding:12px;margin:16px 0">
            <p style="margin:0;font-size:13px;color:#92400e">
              <strong>Risk category:</strong> ${escapeHtml(data.riskCategory)}
            </p>
            ${
              data.riskReasons.length
                ? `<ul style="margin:8px 0 0;padding-left:20px;color:#92400e;font-size:13px;line-height:1.55">${data.riskReasons.map((r) => `<li>${escapeHtml(r)}</li>`).join('')}</ul>`
                : ''
            }
          </div>
          <table style="border-collapse:collapse;width:100%;max-width:640px;margin-top:16px">${registrationFieldRows(data)}</table>
        </div>
      `,
    });
    return true;
  } catch (err) {
    console.error('[Held-for-review admin alert failed]', err);
    return false;
  }
}

/**
 * Polite "we couldn't list you" email sent to the applicant when the admin
 * declines a held-for-review registration via the email Decline button.
 */
export async function sendApplicantRegistrationDeclined(opts: {
  toEmail: string;
  name: string;
}): Promise<boolean> {
  const client = getResend();
  if (!client) {
    console.info('[Applicant decline — no RESEND_API_KEY]', opts);
    return false;
  }
  try {
    await client.emails.send({
      from: FROM_EMAIL,
      to: opts.toEmail,
      replyTo: ADMIN_EMAIL,
      subject: 'Update on your PoliceStationRepUK application',
      html: `
        <div style="font-family:sans-serif;max-width:560px;margin:0 auto;padding:20px;color:#0f172a;line-height:1.6;font-size:14px">
          <p>Hi ${escapeHtml(opts.name)},</p>
          <p>Thank you for applying to be listed on <strong>PoliceStationRepUK</strong>.</p>
          <p>After review, we are not able to publish your profile in the directory at this time.
          PoliceStationRepUK only lists fully accredited PSRAS representatives, duty solicitors and
          solicitors, and we need clear evidence (DSCC PIN, SRA number or a verifiable proof-of-
          accreditation URL) before a profile can go live.</p>
          <p>If you believe this decision is wrong, or if your accreditation status has changed,
          please reply to this email with the supporting evidence and we will reconsider your
          application.</p>
          <hr style="margin:24px 0;border:none;border-top:1px solid #e5e7eb">
          <p style="color:#94a3b8;font-size:12px">
            PoliceStationRepUK &mdash; the directory for accredited police station representatives.<br>
            <a href="https://policestationrepuk.org" style="color:#94a3b8">policestationrepuk.org</a>
          </p>
        </div>
      `,
    });
    return true;
  } catch (err) {
    console.error('[Applicant decline email failed]', err);
    return false;
  }
}

/** Applicant-facing email: "you're now live" (auto-published) or "we're reviewing" (held). */
export async function sendApplicantRegistrationOutcome(opts: {
  toEmail: string;
  name: string;
  published: boolean;
  profileUrl: string;
}): Promise<boolean> {
  const client = getResend();
  if (!client) {
    console.info('[Applicant registration outcome — no RESEND_API_KEY]', opts);
    return false;
  }
  const subject = opts.published
    ? 'Your PoliceStationRepUK listing is now live'
    : 'Your PoliceStationRepUK application is being reviewed';
  const body = opts.published
    ? `
        <p>Hi ${escapeHtml(opts.name)},</p>
        <p>Thanks for registering with <strong>PoliceStationRepUK</strong>. Your profile
        passed our automatic verification checks and is <strong>now live</strong> in the
        public directory:</p>
        <p style="margin:16px 0"><a href="${escapeHtml(opts.profileUrl)}" style="color:#1d4ed8">${escapeHtml(opts.profileUrl)}</a></p>
        <p>You can sign in to your account at any time to update your details, add coverage areas
        or upgrade to a Featured listing:</p>
        <p style="margin:16px 0"><a href="https://policestationrepuk.org/Account" style="color:#1d4ed8">policestationrepuk.org/Account</a></p>
        <p>If you spot anything wrong with your profile, just reply to this email and we'll fix it.</p>
      `
    : `
        <p>Hi ${escapeHtml(opts.name)},</p>
        <p>Thanks for registering with <strong>PoliceStationRepUK</strong>. We've received your
        application and it's currently with our admin team for a quick manual review &mdash; this
        usually happens within 24 hours.</p>
        <p>You don't need to do anything right now. If we need any further evidence (e.g. a copy of
        your PSRAS accreditation certificate or proof of your SRA registration) we'll email you
        directly.</p>
        <p>Once approved, your profile will appear in the directory automatically and you'll get a
        confirmation email.</p>
      `;
  try {
    await client.emails.send({
      from: FROM_EMAIL,
      to: opts.toEmail,
      replyTo: ADMIN_EMAIL,
      subject,
      html: `
        <div style="font-family:sans-serif;max-width:560px;margin:0 auto;padding:20px;color:#0f172a;line-height:1.6;font-size:14px">
          ${body}
          <hr style="margin:24px 0;border:none;border-top:1px solid #e5e7eb">
          <p style="color:#94a3b8;font-size:12px">
            PoliceStationRepUK &mdash; the directory for accredited police station representatives.<br>
            <a href="https://policestationrepuk.org" style="color:#94a3b8">policestationrepuk.org</a>
          </p>
        </div>
      `,
    });
    return true;
  } catch (err) {
    console.error('[Applicant registration outcome failed]', err);
    return false;
  }
}

/**
 * One-time code sent to verify an email address on the public enquiry form.
 * Wholly separate from the magic-login code in `sendMagicCode` so the two
 * flows cannot be confused.
 */
export async function sendEnquiryEmailCode(email: string, code: string): Promise<boolean> {
  const client = getResend();
  if (!client) {
    console.info('[Enquiry email code — no RESEND_API_KEY]', { email });
    return false;
  }
  try {
    await client.emails.send({
      from: FROM_EMAIL,
      to: email,
      subject: `Confirm your PoliceStationRepUK enquiry: ${code}`,
      html: `
        <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:20px">
          <h2 style="color:#0f172a;margin-bottom:8px">Confirm your email address</h2>
          <p style="color:#475569;font-size:14px;margin-bottom:16px">
            Please enter this 6-digit code on the enquiry form to confirm your email
            address. The code expires in 15 minutes.
          </p>
          <div style="background:#f8fafc;border:2px solid #e2e8f0;border-radius:8px;padding:24px;text-align:center;margin-bottom:20px">
            <span style="font-family:monospace;font-size:32px;letter-spacing:0.3em;font-weight:bold;color:#0f172a">${escapeHtml(code)}</span>
          </div>
          <p style="color:#475569;font-size:13px;line-height:1.6">
            Confirming your email is the first step. Submitting an enquiry does not create a
            public directory profile &mdash; PoliceStationRepUK only lists fully verified
            and accredited representatives after manual admin review.
          </p>
          <p style="color:#94a3b8;font-size:12px;margin-top:16px">
            If you did not request this enquiry, you can safely ignore this email.
          </p>
        </div>
      `,
    });
    return true;
  } catch (err) {
    console.error('[Enquiry email code failed]', err);
    return false;
  }
}

function escapeHtml(val: unknown): string {
  const str = typeof val === 'string' ? val : Array.isArray(val) ? val.join(', ') : String(val ?? '');
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
