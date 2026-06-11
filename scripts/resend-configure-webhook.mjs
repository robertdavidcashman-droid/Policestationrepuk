#!/usr/bin/env node
/**
 * Register or update the Resend webhook for firm outreach email events.
 * Idempotent — safe to re-run.
 *
 * Usage:
 *   node scripts/resend-configure-webhook.mjs
 *   node scripts/resend-configure-webhook.mjs --list
 *   node scripts/resend-configure-webhook.mjs --dry-run
 */
import fs from 'node:fs';
import path from 'node:path';
import { Resend } from 'resend';

const WEBHOOK_URL =
  process.env.RESEND_WEBHOOK_URL_OVERRIDE || 'https://policestationrepuk.org/api/webhooks/resend';

const EVENTS = [
  'email.sent',
  'email.delivered',
  'email.opened',
  'email.clicked',
  'email.bounced',
  'email.complained',
];

const DRY = process.argv.includes('--dry-run');
const LIST_ONLY = process.argv.includes('--list');

function readEnvLocal() {
  const file = path.join(process.cwd(), '.env.local');
  if (!fs.existsSync(file)) return {};
  const out = {};
  for (const line of fs.readFileSync(file, 'utf8').split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)$/);
    if (!m) continue;
    let v = m[2];
    if (v.startsWith('"') && v.endsWith('"')) {
      v = v.slice(1, -1).replace(/\\n/g, '\n').replace(/\\r/g, '\r');
    }
    out[m[1]] = v.trim();
  }
  return out;
}

const fileEnv = readEnvLocal();
function readVar(name) {
  const v = (process.env[name] ?? fileEnv[name] ?? '').toString().trim();
  return v.length ? v : undefined;
}

const apiKey = readVar('RESEND_API_KEY');
if (!apiKey) {
  console.error('Missing RESEND_API_KEY in env or .env.local');
  process.exit(1);
}

const resend = new Resend(apiKey);

function eventsMatch(existing) {
  if (!existing?.length) return false;
  const want = new Set(EVENTS);
  const have = new Set(existing);
  for (const e of want) {
    if (!have.has(e)) return false;
  }
  return true;
}

async function main() {
  const { data: listData, error: listError } = await resend.webhooks.list();
  if (listError) {
    console.error('[resend webhook] list failed:', listError);
    process.exit(1);
  }

  const hooks = listData?.data ?? [];
  console.log(`[resend webhook] existing: ${hooks.length}`);
  for (const h of hooks) {
    console.log(`  - ${h.id} ${h.status} ${h.endpoint} [${(h.events ?? []).join(', ')}]`);
  }

  if (LIST_ONLY) return;

  const ours = hooks.find((h) => h.endpoint === WEBHOOK_URL);

  if (ours && eventsMatch(ours.events) && ours.status === 'enabled') {
    console.log(`[resend webhook] OK — already registered at ${WEBHOOK_URL}`);
    const { data: detail } = await resend.webhooks.get(ours.id);
    if (detail?.signing_secret) {
      console.log('[resend webhook] signing_secret available via GET (set RESEND_WEBHOOK_SECRET in Vercel if missing)');
    }
    return;
  }

  if (DRY) {
    console.log('[resend webhook] dry-run — would', ours ? 'update' : 'create', WEBHOOK_URL);
    return;
  }

  if (ours) {
    const { error } = await resend.webhooks.update(ours.id, {
      endpoint: WEBHOOK_URL,
      events: EVENTS,
      status: 'enabled',
    });
    if (error) {
      console.error('[resend webhook] update failed:', error);
      process.exit(1);
    }
    console.log(`[resend webhook] updated ${ours.id}`);
    const { data: detail } = await resend.webhooks.get(ours.id);
    if (detail?.signing_secret) {
      console.log(`RESEND_WEBHOOK_SECRET=${detail.signing_secret}`);
    }
    return;
  }

  const { data, error } = await resend.webhooks.create({
    endpoint: WEBHOOK_URL,
    events: EVENTS,
  });

  if (error) {
    console.error('[resend webhook] create failed:', error);
    process.exit(1);
  }

  console.log(`[resend webhook] created ${data.id} → ${WEBHOOK_URL}`);
  if (data.signing_secret) {
    console.log(`RESEND_WEBHOOK_SECRET=${data.signing_secret}`);
    console.log('[resend webhook] Add RESEND_WEBHOOK_SECRET to Vercel production env.');
  }
}

main().catch((err) => {
  console.error('[resend webhook] failed:', err);
  process.exit(1);
});
