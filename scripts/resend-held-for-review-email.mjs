#!/usr/bin/env node
/**
 * Resend the held-for-review admin alert (now with one-click Approve / Decline
 * buttons) for an existing pending `repreview:{email}` row, OR for every
 * pending row currently in production KV.
 *
 * Usage:
 *   node scripts/resend-held-for-review-email.mjs wt.legal@outlook.com
 *   node scripts/resend-held-for-review-email.mjs --all
 *   node scripts/resend-held-for-review-email.mjs --all --dry-run
 *
 * Reads from .env.local:
 *   - UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN — KV access (so we can
 *     write the one-shot token rows AND read newrep / repreview context).
 *   - ADMIN_DECISION_TOKEN_SECRET — signs the approve / decline tokens. Must
 *     EXACTLY match what is set on Vercel for the `policestationrepuk-new`
 *     project, otherwise the tokens will fail signature check on the live
 *     site.
 *   - RESEND_API_KEY — sends the email. The from / to addresses match the
 *     production lib/email.ts values.
 *
 * The one-shot token KV records (`admin-decision-token:{jti}`) are written
 * with EX = 7 days, so the resulting links match a freshly-registered
 * applicant's links exactly.
 */

import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

const SITE = process.env.APP_BASE_URL || 'https://policestationrepuk.org';
const FROM_EMAIL = 'PoliceStationRepUK <noreply@policestationrepuk.org>';
const ADMIN_EMAIL = 'robertcashman@gmail.com';
const TOKEN_TTL_SECONDS = 7 * 24 * 60 * 60;

async function loadEnvLocal() {
  const envPath = path.join(projectRoot, '.env.local');
  let raw;
  try {
    raw = await fs.readFile(envPath, 'utf-8');
  } catch {
    return {};
  }
  const env = {};
  for (const line of raw.split(/\r?\n/)) {
    const m = line.match(/^([A-Z0-9_]+)\s*=\s*(.*)$/);
    if (!m) continue;
    let v = m[2];
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
      v = v.slice(1, -1);
    }
    env[m[1]] = v;
  }
  return env;
}

class UpstashRest {
  constructor(url, token) {
    this.url = url.replace(/\/$/, '');
    this.token = token;
  }
  async run(cmd) {
    const res = await fetch(this.url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.token}`,
      },
      body: JSON.stringify(cmd),
    });
    if (!res.ok) {
      throw new Error(
        `Upstash REST ${res.status} on ${cmd.join(' ')}: ${await res.text()}`,
      );
    }
    return (await res.json()).result;
  }
  async get(key) {
    const v = await this.run(['GET', key]);
    if (v == null) return null;
    if (typeof v === 'string') {
      try {
        return JSON.parse(v);
      } catch {
        return v;
      }
    }
    return v;
  }
  async setEx(key, value, ttlSec) {
    return this.run([
      'SET',
      key,
      typeof value === 'string' ? value : JSON.stringify(value),
      'EX',
      String(ttlSec),
    ]);
  }
  async keys(pattern) {
    return this.run(['KEYS', pattern]);
  }
}

function base64url(buf) {
  return buf
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '');
}

function buildToken(secret, payload) {
  const payloadB64 = base64url(Buffer.from(JSON.stringify(payload), 'utf8'));
  const sig = base64url(
    crypto.createHmac('sha256', secret).update(payloadB64).digest(),
  );
  return `${payloadB64}.${sig}`;
}

function inferCategory(newrep, review) {
  const a = (
    (newrep?.accreditation || '') +
    ' ' +
    (review?.adminNotes || '')
  ).toLowerCase();
  if (a.includes('psras') || a.includes('police station rep')) return 'psras-accredited';
  if (a.includes('duty')) return 'duty-solicitor';
  if (a.includes('solicitor')) return 'solicitor';
  // Sensible default for the existing backlog — the email button still does
  // an exact `setReview` so a wrong category here only mis-labels the
  // verified-* status; you can fix it from /admin if needed.
  return 'psras-accredited';
}

function escapeHtml(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function rowHtml(label, value) {
  if (!value) return '';
  return `<tr>
    <td style="padding:6px 10px;border-bottom:1px solid #e5e7eb;font-size:13px;color:#475569;width:160px">${escapeHtml(label)}</td>
    <td style="padding:6px 10px;border-bottom:1px solid #e5e7eb;font-size:13px;color:#0f172a">${escapeHtml(value)}</td>
  </tr>`;
}

function buildEmailHtml({ newrep, review, approveUrl, declineUrl }) {
  const name = newrep?.name || review?.email || 'unknown applicant';
  const reasons = (review?.riskReasons || [])
    .map((r) => `<li>${escapeHtml(r)}</li>`)
    .join('');
  const summaryRows = [
    rowHtml('Name', newrep?.name),
    rowHtml('Email', newrep?.email || review?.email),
    rowHtml('Phone', newrep?.phone),
    rowHtml('Accreditation', newrep?.accreditation),
    rowHtml('DSCC / PIN', newrep?.dscc_pin || newrep?.pin_number),
    rowHtml('SRA number', newrep?.sra_number),
    rowHtml('Firm', newrep?.firm_name),
    rowHtml('Counties', newrep?.counties),
    rowHtml('Stations', newrep?.stations),
    rowHtml('Availability', newrep?.availability),
    rowHtml('Proof URL', newrep?.proof_url),
    rowHtml('Registered at', newrep?.registeredAt),
  ]
    .filter(Boolean)
    .join('');

  return `
    <div style="font-family:sans-serif;max-width:640px;margin:0 auto;color:#0f172a">
      <h2 style="color:#b45309">Held for manual review (resent)</h2>
      <p style="color:#475569;font-size:14px;line-height:1.55">
        ${escapeHtml(name)} is sitting in the review queue. Their profile is
        <strong>NOT</strong> publicly visible. Use one of the buttons below to action
        the decision in one click.
      </p>
      <div style="margin:24px 0;padding:18px;border:1px solid #e2e8f0;border-radius:10px;background:#f8fafc">
        <p style="margin:0 0 14px;font-size:14px;color:#0f172a;font-weight:600">
          One-click decision:
        </p>
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin:0">
          <tr>
            <td style="padding-right:12px">
              <a href="${escapeHtml(approveUrl)}"
                 style="display:inline-block;padding:12px 22px;background:#059669;color:#ffffff;
                        text-decoration:none;font-weight:700;font-size:14px;border-radius:8px;
                        border:1px solid #047857">
                Approve &amp; publish
              </a>
            </td>
            <td>
              <a href="${escapeHtml(declineUrl)}"
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
          anything is actioned (links expire in 7 days). Decisions take effect
          immediately and are reversible from
          <a href="${SITE}/admin" style="color:#1d4ed8">/admin</a>.
        </p>
      </div>
      ${
        review?.riskCategory
          ? `<div style="background:#fef3c7;border:1px solid #fcd34d;border-radius:8px;padding:12px;margin:16px 0">
        <p style="margin:0;font-size:13px;color:#92400e">
          <strong>Risk category:</strong> ${escapeHtml(review.riskCategory)}
        </p>
        ${reasons ? `<ul style="margin:8px 0 0;padding-left:20px;color:#92400e;font-size:13px;line-height:1.55">${reasons}</ul>` : ''}
      </div>`
          : ''
      }
      <table style="border-collapse:collapse;width:100%;max-width:640px;margin-top:16px">
        ${summaryRows}
      </table>
    </div>
  `;
}

async function sendViaResend(apiKey, html, subject) {
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      from: FROM_EMAIL,
      to: [ADMIN_EMAIL],
      subject,
      html,
    }),
  });
  if (!res.ok) {
    throw new Error(`Resend ${res.status}: ${await res.text()}`);
  }
  return res.json();
}

async function processOne(email, { kv, secret, resendKey, dryRun }) {
  const lower = email.toLowerCase();
  const [newrep, review] = await Promise.all([
    kv.get(`newrep:${lower}`),
    kv.get(`repreview:${lower}`),
  ]);

  if (!review) {
    console.log(`SKIP   ${lower} — no repreview row`);
    return { ok: false, reason: 'no-repreview' };
  }
  const status = review.status || (review.adminApproved ? 'approved' : 'pending');
  if (review.adminApproved === true || status === 'approved') {
    console.log(`SKIP   ${lower} — already approved`);
    return { ok: false, reason: 'already-approved' };
  }
  if (status === 'rejected') {
    console.log(`SKIP   ${lower} — already rejected`);
    return { ok: false, reason: 'already-rejected' };
  }

  const category = inferCategory(newrep, review);
  const exp = Math.floor(Date.now() / 1000) + TOKEN_TTL_SECONDS;

  const buildAndStore = async (action) => {
    const jti = crypto.randomUUID();
    const payload = { email: lower, action, category, exp, jti };
    const token = buildToken(secret, payload);
    const record = {
      email: lower,
      action,
      category,
      createdAt: new Date().toISOString(),
      exp,
    };
    if (!dryRun) {
      await kv.setEx(`admin-decision-token:${jti}`, record, TOKEN_TTL_SECONDS);
    }
    return token;
  };

  const [approveTok, declineTok] = await Promise.all([
    buildAndStore('approve'),
    buildAndStore('decline'),
  ]);

  const approveUrl = `${SITE}/admin/decision/${approveTok}`;
  const declineUrl = `${SITE}/admin/decision/${declineTok}`;

  if (dryRun) {
    console.log(`DRY    ${lower}`);
    console.log(`        approve  ${approveUrl}`);
    console.log(`        decline  ${declineUrl}`);
    return { ok: true, dryRun: true, approveUrl, declineUrl };
  }

  const html = buildEmailHtml({ newrep, review, approveUrl, declineUrl });
  const subject = `[ACTION REQUIRED] ${newrep?.name || lower} — held for review (resent)`;
  const send = await sendViaResend(resendKey, html, subject);
  console.log(`SENT   ${lower} -> resend id ${send?.id ?? '?'}`);
  return { ok: true, approveUrl, declineUrl };
}

async function main() {
  const args = process.argv.slice(2);
  const flags = new Set(args.filter((a) => a.startsWith('--')));
  const positional = args.filter((a) => !a.startsWith('--'));
  const dryRun = flags.has('--dry-run');
  const all = flags.has('--all');

  if (!all && positional.length === 0) {
    console.error(
      'Usage: node scripts/resend-held-for-review-email.mjs <email> | --all [--dry-run]',
    );
    process.exit(1);
  }

  const env = await loadEnvLocal();
  const kvUrl = env.UPSTASH_REDIS_REST_URL || env.KV_REST_API_URL;
  const kvToken = env.UPSTASH_REDIS_REST_TOKEN || env.KV_REST_API_TOKEN;
  const secret = env.ADMIN_DECISION_TOKEN_SECRET;
  const resendKey = env.RESEND_API_KEY;

  if (!kvUrl || !kvToken) {
    throw new Error(
      'Missing UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN in .env.local',
    );
  }
  if (!secret || secret.length < 16) {
    throw new Error(
      'Missing ADMIN_DECISION_TOKEN_SECRET in .env.local — must EXACTLY match the value set on Vercel for policestationrepuk-new',
    );
  }
  if (!resendKey && !dryRun) {
    throw new Error('Missing RESEND_API_KEY in .env.local (use --dry-run to skip sending)');
  }

  const kv = new UpstashRest(kvUrl, kvToken);

  let targets = [];
  if (all) {
    const keys = await kv.keys('repreview:*');
    targets = keys.map((k) => k.replace(/^repreview:/, ''));
    console.log(`-- Found ${targets.length} repreview rows; filtering to pending`);
  } else {
    targets = positional;
  }

  let sent = 0;
  let skipped = 0;
  for (const email of targets) {
    try {
      const r = await processOne(email, { kv, secret, resendKey, dryRun });
      if (r.ok) sent += 1;
      else skipped += 1;
    } catch (err) {
      console.error(`ERR    ${email} — ${err instanceof Error ? err.message : err}`);
      skipped += 1;
    }
  }

  console.log(`\nDone. ${sent} email(s) ${dryRun ? 'previewed' : 'sent'}; ${skipped} skipped.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
