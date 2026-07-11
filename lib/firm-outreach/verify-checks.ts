import { existsSync, readFileSync, statSync } from 'fs';
import { resolve } from 'path';
import { BROCHURE_PUBLIC_PATH, loadBrochureAttachment } from './brochure/load-attachment';
import { AGENT_COVER_KENT_CAMPAIGN_ID } from './campaign-scope';
import {
  DEFAULT_PSA_FROM_FALLBACK,
  getOutreachSendHealth,
  operatorNotifyFromAddress,
  parseFromAddressDomain,
  resolveFromAddressForCampaign,
  VERIFIED_FALLBACK_DOMAIN,
} from './outreach/from-address';
import { FIRM_OUTREACH_CAMPAIGN_ID } from './site-config';
import { buildOutreachEmailHtml, subjectForStep } from './outreach/templates';
import type { FirmProspect } from './types';

export const EXPECTED_CRON_ROUTES = [
  '/api/cron/firm-outreach-pipeline/maintain',
  '/api/cron/firm-outreach-enrich',
  '/api/cron/firm-outreach-pipeline/full',
  '/api/cron/firm-outreach-digest',
] as const;

export const VERIFY_CRON_ROUTES = ['/api/cron/firm-outreach-status'] as const;

export const LEGACY_CRON_ROUTES = [
  '/api/cron/firm-outreach-send',
  '/api/cron/firm-outreach-discovery',
] as const;

export const PROTECTED_HTTP_ROUTES = [
  ...EXPECTED_CRON_ROUTES,
  ...VERIFY_CRON_ROUTES,
  ...LEGACY_CRON_ROUTES,
  '/api/admin/firm-outreach',
] as const;

export interface RepoCheckResult {
  name: string;
  ok: boolean;
  detail?: string;
}

export interface HttpCheckResult {
  name: string;
  ok: boolean;
  status?: number;
  detail?: string;
}

const sampleProspect = (): FirmProspect => ({
  id: 'verify-test-prospect',
  firmKey: 'verify-test-firm',
  firmName: 'Verify Test Solicitors LLP',
  prospectType: 'firm',
  status: 'ready_to_send',
  sequenceStep: 0,
  sources: ['manual'],
  priorityScore: 0,
  campaignId: FIRM_OUTREACH_CAMPAIGN_ID,
  enrichAttempts: 0,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  email: 'verify@example.com',
});

export function checkBrochureExists(): RepoCheckResult {
  const ok = existsSync(BROCHURE_PUBLIC_PATH);
  return {
    name: 'brochure_file_exists',
    ok,
    detail: ok ? BROCHURE_PUBLIC_PATH : `Missing ${BROCHURE_PUBLIC_PATH}`,
  };
}

export function checkBrochureMinSize(minBytes = 10_000): RepoCheckResult {
  if (!existsSync(BROCHURE_PUBLIC_PATH)) {
    return { name: 'brochure_min_size', ok: false, detail: 'Brochure missing' };
  }
  const size = statSync(BROCHURE_PUBLIC_PATH).size;
  return {
    name: 'brochure_min_size',
    ok: size >= minBytes,
    detail: `size=${size} bytes (min ${minBytes})`,
  };
}

export function checkBrochureLoadsAsAttachment(): RepoCheckResult {
  const attachment = loadBrochureAttachment();
  const ok = Boolean(attachment?.content && attachment.filename.endsWith('.pdf'));
  return {
    name: 'brochure_attachment_loads',
    ok,
    detail: ok ? attachment!.filename : 'loadBrochureAttachment returned null',
  };
}

export function checkPsaFromAddressFallback(): RepoCheckResult {
  const unverified = new Set<string>([VERIFIED_FALLBACK_DOMAIN]);
  const resolved = resolveFromAddressForCampaign(AGENT_COVER_KENT_CAMPAIGN_ID, unverified);
  const ok =
    resolved.usedFallback &&
    resolved.from === DEFAULT_PSA_FROM_FALLBACK &&
    resolved.domain === VERIFIED_FALLBACK_DOMAIN;
  return {
    name: 'psa_from_address_verified_fallback',
    ok,
    detail: ok
      ? resolved.from
      : `Expected PSA fallback via ${VERIFIED_FALLBACK_DOMAIN}, got ${resolved.from}`,
  };
}

export function checkOperatorNotifyFromAddress(): RepoCheckResult {
  const from = operatorNotifyFromAddress();
  const domain = parseFromAddressDomain(from);
  const ok = Boolean(domain && from.includes('@'));
  return {
    name: 'operator_notify_from_address',
    ok,
    detail: ok ? `${from} (${domain})` : `Invalid operator from: ${from}`,
  };
}

export async function runSendHealthChecks(): Promise<RepoCheckResult[]> {
  if (!process.env.RESEND_API_KEY?.trim()) {
    return [
      {
        name: 'send_health_resend_live',
        ok: true,
        detail: 'skipped — RESEND_API_KEY not set locally',
      },
    ];
  }

  const health = await getOutreachSendHealth();
  const results: RepoCheckResult[] = [
    {
      name: 'send_health_repuk_domain_verified',
      ok: health.verifiedDomains.includes(VERIFIED_FALLBACK_DOMAIN),
      detail: health.verifiedDomains.join(', ') || 'none',
    },
    {
      name: 'send_health_campaigns_configured',
      ok: health.campaigns.length === 2,
      detail: `count=${health.campaigns.length}`,
    },
    {
      name: 'send_health_both_campaigns_can_send',
      ok: health.campaigns.every((c) => c.canSend),
      detail: health.campaigns
        .map((c) => `${c.campaignId}:${c.canSend ? 'ok' : c.blockers.join(',')}`)
        .join('; '),
    },
    {
      name: 'send_health_overall',
      ok: health.sendHealthy,
      detail: health.sendBlockers.join('; ') || 'healthy',
    },
  ];

  const psa = health.campaigns.find((c) => c.campaignId === AGENT_COVER_KENT_CAMPAIGN_ID);
  results.push({
    name: 'send_health_psa_campaign_present',
    ok: Boolean(psa),
    detail: psa
      ? `${psa.from}${psa.usedFallbackDefault ? ' (RepUK fallback active)' : ''}`
      : 'missing PSA campaign',
  });

  return results;
}

export function checkOutreachTemplates(): RepoCheckResult[] {
  const prospect = sampleProspect();
  const results: RepoCheckResult[] = [];

  for (const step of [0, 1, 2]) {
    const subject = subjectForStep(prospect, step);
    results.push({
      name: `template_subject_step_${step}`,
      ok: subject.length > 10,
      detail: subject,
    });

    const html = buildOutreachEmailHtml({
      prospect,
      step,
      unsubscribeUrl: 'https://policestationagent.com/outreach/unsubscribe/test-token',
    });
    results.push({
      name: `template_html_step_${step}`,
      ok: html.includes('Unsubscribe') && html.includes('verify-test-prospect'),
      detail: `html_length=${html.length}`,
    });
  }

  return results;
}

export function checkVercelCronConfig(vercelJson: {
  crons?: Array<{ path: string; schedule: string }>;
}): RepoCheckResult[] {
  const crons = vercelJson.crons ?? [];
  const paths = crons.map((c) => c.path);
  const results: RepoCheckResult[] = [];

  for (const route of EXPECTED_CRON_ROUTES) {
    results.push({
      name: `vercel_cron_configured:${route}`,
      ok: paths.includes(route),
      detail: paths.includes(route) ? 'present' : 'missing from vercel.json crons',
    });
  }

  const schedules = Object.fromEntries(crons.map((c) => [c.path, c.schedule]));
  results.push({
    name: 'vercel_cron_send_schedule',
    ok: schedules['/api/cron/firm-outreach-pipeline/full'] === '30 9 * * *',
    detail: String(schedules['/api/cron/firm-outreach-pipeline/full'] ?? 'missing'),
  });
  const enrichCronCount = paths.filter((p) => p === '/api/cron/firm-outreach-enrich').length;
  results.push({
    name: 'vercel_cron_enrich_six_times_daily',
    ok: enrichCronCount >= 6,
    detail: `count=${enrichCronCount}`,
  });
  const sendOnlyCronCount = paths.filter((p) => p === '/api/cron/firm-outreach-send').length;
  results.push({
    name: 'vercel_cron_send_only_twice_daily',
    ok: sendOnlyCronCount === 2,
    detail: `count=${sendOnlyCronCount}`,
  });

  return results;
}

export function checkCronRouteFilesExist(rootDir = process.cwd()): RepoCheckResult[] {
  const toFile = (route: string) =>
    resolve(rootDir, 'app', `${route.replace(/^\/api\//, 'api/')}/route.ts`);

  return [...EXPECTED_CRON_ROUTES, ...VERIFY_CRON_ROUTES, ...LEGACY_CRON_ROUTES].map((route) => {
    const file = toFile(route);
    const ok = existsSync(file);
    return {
      name: `cron_route_file:${route}`,
      ok,
      detail: ok ? file : `Missing ${file}`,
    };
  });
}

export function loadVercelJson(rootDir = process.cwd()): RepoCheckResult {
  const path = resolve(rootDir, 'vercel.json');
  if (!existsSync(path)) {
    return { name: 'vercel_json_exists', ok: false, detail: 'vercel.json missing' };
  }
  try {
    const raw = readFileSync(path, 'utf8').replace(/,\s*([}\]])/g, '$1');
    JSON.parse(raw);
    return { name: 'vercel_json_valid', ok: true, detail: path };
  } catch (err) {
    return {
      name: 'vercel_json_valid',
      ok: false,
      detail: err instanceof Error ? err.message : String(err),
    };
  }
}

export function runRepoChecks(rootDir = process.cwd()): RepoCheckResult[] {
  const vercelPath = resolve(rootDir, 'vercel.json');
  const vercelRaw = existsSync(vercelPath)
    ? readFileSync(vercelPath, 'utf8').replace(/,\s*([}\]])/g, '$1')
    : '{}';
  const vercelJson = JSON.parse(vercelRaw) as { crons?: Array<{ path: string; schedule: string }> };

  return [
    loadVercelJson(rootDir),
    checkBrochureExists(),
    checkBrochureMinSize(),
    checkBrochureLoadsAsAttachment(),
    checkPsaFromAddressFallback(),
    checkOperatorNotifyFromAddress(),
    ...checkOutreachTemplates(),
    ...checkVercelCronConfig(vercelJson),
    ...checkCronRouteFilesExist(rootDir),
  ];
}

export async function runHttpChecks(
  baseUrl: string,
  opts?: { cronSecret?: string },
): Promise<HttpCheckResult[]> {
  const base = baseUrl.replace(/\/$/, '');
  const results: HttpCheckResult[] = [];

  async function get(path: string, init?: RequestInit) {
    const res = await fetch(`${base}${path}`, { redirect: 'follow', ...init });
    return res;
  }

  results.push(await checkStatus('brochure_pdf_public', () => get('/outreach/police-station-agent-kent-brochure.pdf'), 200));

  for (const route of PROTECTED_HTTP_ROUTES) {
    const isOptional = VERIFY_CRON_ROUTES.includes(route as (typeof VERIFY_CRON_ROUTES)[number]);
    results.push(
      await checkStatus(
        `protected_unauth:${route}`,
        () => get(route),
        401,
        isOptional ? [404] : undefined,
      ),
    );
  }

  results.push(
    await checkStatus('resend_webhook_rejects_unsigned', () =>
      get('/api/webhooks/resend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: '{}',
      }),
    401),
  );

  const sendCode = await get('/api/auth/send-code', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'not-an-admin@example.com' }),
  });
  results.push({
    name: 'admin_send_code_kv_respond',
    ok: sendCode.status === 200,
    status: sendCode.status,
    detail: sendCode.status === 503 ? 'KV not configured on target' : undefined,
  });

  if (opts?.cronSecret) {
    const statusRes = await get('/api/cron/firm-outreach-status', {
      headers: { Authorization: `Bearer ${opts.cronSecret}` },
    });
    if (statusRes.status === 404) {
      results.push({
        name: 'cron_status_authenticated',
        ok: true,
        status: 404,
        detail: 'status route not deployed yet (skip)',
      });
      results.push({
        name: 'cron_status_send_health',
        ok: true,
        status: 404,
        detail: 'status route not deployed yet (skip)',
      });
    } else {
      type StatusPayload = {
        ok?: boolean;
        config?: {
          sendAllowed?: boolean;
          resendConfigured?: boolean;
          sendHealthy?: boolean;
          sendBlockers?: string[];
          campaignSendHealth?: Array<{
            campaignId: string;
            canSend: boolean;
            from: string;
            usedFallbackDefault?: boolean;
          }>;
        };
      };
      let payload: StatusPayload | null = null;
      try {
        payload = (await statusRes.json()) as StatusPayload;
      } catch {
        payload = null;
      }
      const campaigns = payload?.config?.campaignSendHealth ?? [];
      const psaCampaign = campaigns.find((c) => c.campaignId === AGENT_COVER_KENT_CAMPAIGN_ID);
      const repukCampaign = campaigns.find((c) => c.campaignId === FIRM_OUTREACH_CAMPAIGN_ID);
      const campaignsOk =
        campaigns.length >= 2 &&
        Boolean(repukCampaign?.canSend) &&
        Boolean(psaCampaign?.canSend);
      results.push({
        name: 'cron_status_authenticated',
        ok: statusRes.status === 200 && payload?.ok === true,
        status: statusRes.status,
        detail: payload?.config
          ? `sendAllowed=${payload.config.sendAllowed} resendConfigured=${payload.config.resendConfigured} sendHealthy=${payload.config.sendHealthy}`
          : undefined,
      });
      results.push({
        name: 'cron_status_send_health',
        ok: statusRes.status === 200 && payload?.config?.sendHealthy === true && campaignsOk,
        status: statusRes.status,
        detail: campaigns
          .map(
            (c) =>
              `${c.campaignId}:${c.canSend ? 'ok' : 'blocked'}${c.usedFallbackDefault ? '(fallback)' : ''}`,
          )
          .join('; '),
      });
    }
  }

  return results;
}

async function checkStatus(
  name: string,
  request: () => Promise<Response>,
  expected: number,
  alsoOk: number[] = [],
): Promise<HttpCheckResult> {
  try {
    const res = await request();
    const ok = res.status === expected || alsoOk.includes(res.status);
    return {
      name,
      ok,
      status: res.status,
      detail: ok
        ? alsoOk.includes(res.status)
          ? `accepted ${res.status} (not yet deployed)`
          : undefined
        : `expected ${expected}${alsoOk.length ? ` or ${alsoOk.join('/')}` : ''}`,
    };
  } catch (err) {
    return {
      name,
      ok: false,
      detail: err instanceof Error ? err.message : String(err),
    };
  }
}

export function summarizeResults<T extends { ok: boolean; name: string; detail?: string }>(
  results: T[],
): { passed: number; failed: number; failures: T[] } {
  const failures = results.filter((r) => !r.ok);
  return {
    passed: results.length - failures.length,
    failed: failures.length,
    failures,
  };
}
