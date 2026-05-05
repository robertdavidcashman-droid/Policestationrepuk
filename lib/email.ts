import { Resend } from 'resend';
import { phoneToTelHref } from '@/lib/phone';

const ADMIN_EMAIL = 'robertcashman@defencelegalservices.co.uk';
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

function escapeHtml(val: unknown): string {
  const str = typeof val === 'string' ? val : Array.isArray(val) ? val.join(', ') : String(val ?? '');
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
