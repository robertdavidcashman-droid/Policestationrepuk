export const OUTREACH_KICK_PATH_PATTERN =
  /^(lib\/firm-outreach|app\/api\/cron\/firm-outreach|packages\/firm-outreach-core|scripts\/firm-outreach|\.github\/workflows\/firm-outreach-kick\.yml)/;

export interface KickAuth {
  header: string;
  value: string;
}

export function resolveKickAuth(env: {
  CRON_SECRET?: string;
  FIRM_OUTREACH_BOOTSTRAP_SECRET?: string;
}): KickAuth | null {
  const cron = env.CRON_SECRET?.trim();
  if (cron) return { header: 'Authorization', value: `Bearer ${cron}` };
  const bootstrap = env.FIRM_OUTREACH_BOOTSTRAP_SECRET?.trim();
  if (bootstrap) return { header: 'x-firm-outreach-bootstrap-secret', value: bootstrap };
  return null;
}

export function outreachPathsChanged(changedPaths: string[]): boolean {
  return changedPaths.some((p) => OUTREACH_KICK_PATH_PATTERN.test(p));
}

export interface KickStep {
  path: string;
  label: string;
  /** When true, non-200 responses are logged but do not fail the kick. */
  optional?: boolean;
}

export interface KickStepResult {
  path: string;
  label: string;
  status: number;
  body: string;
  ok: boolean;
  optional: boolean;
}

export async function runProductionKickSteps(opts: {
  baseUrl: string;
  auth: KickAuth;
  steps: KickStep[];
  fetchFn?: typeof fetch;
  timeoutMs?: number;
}): Promise<{ results: KickStepResult[]; failed: boolean }> {
  const fetchFn = opts.fetchFn ?? fetch;
  const timeoutMs = opts.timeoutMs ?? 320_000;
  const results: KickStepResult[] = [];

  for (const step of opts.steps) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    let status = 0;
    let body = '';
    try {
      const res = await fetchFn(`${opts.baseUrl.replace(/\/$/, '')}${step.path}`, {
        headers: { [opts.auth.header]: opts.auth.value },
        signal: controller.signal,
      });
      status = res.status;
      body = await res.text();
    } catch (err) {
      body = err instanceof Error ? err.message : String(err);
      status = 0;
    } finally {
      clearTimeout(timer);
    }

    const ok = status === 200;
    const optional = step.optional ?? false;
    results.push({ path: step.path, label: step.label, status, body, ok, optional });
    if (!ok && !optional) {
      return { results, failed: true };
    }
  }

  return { results, failed: false };
}

export const DEFAULT_PRODUCTION_KICK_STEPS: KickStep[] = [
  {
    path: '/api/cron/firm-outreach-bootstrap?requalifyOnly=1',
    label: 'Requalify ready_to_send junk rows',
    optional: true,
  },
  {
    path: '/api/cron/firm-outreach-enrich',
    label: 'Enrich batch 1 (cron route)',
  },
  {
    path: '/api/cron/firm-outreach-enrich',
    label: 'Enrich batch 2 (cron route)',
    optional: true,
  },
];

export interface VercelDeployment {
  url?: string;
  readyState?: string;
  meta?: { githubCommitSha?: string };
}

export async function waitForVercelProductionDeploy(opts: {
  token: string;
  projectId: string;
  teamId?: string;
  commitSha?: string;
  timeoutMs?: number;
  pollMs?: number;
  fetchFn?: typeof fetch;
  now?: () => number;
  sleep?: (ms: number) => Promise<void>;
}): Promise<{ ready: boolean; deployment?: VercelDeployment }> {
  const fetchFn = opts.fetchFn ?? fetch;
  const now = opts.now ?? Date.now;
  const sleep = opts.sleep ?? ((ms: number) => new Promise((r) => setTimeout(r, ms)));
  const deadline = now() + (opts.timeoutMs ?? 600_000);
  const pollMs = opts.pollMs ?? 15_000;

  while (now() < deadline) {
    const params = new URLSearchParams({
      projectId: opts.projectId,
      limit: '10',
      target: 'production',
    });
    if (opts.teamId) params.set('teamId', opts.teamId);

    const res = await fetchFn(`https://api.vercel.com/v6/deployments?${params}`, {
      headers: { Authorization: `Bearer ${opts.token}` },
    });
    if (res.ok) {
      const data = (await res.json()) as { deployments?: VercelDeployment[] };
      const deployments = data.deployments ?? [];
      const match = opts.commitSha
        ? deployments.find(
            (d) => d.meta?.githubCommitSha === opts.commitSha && d.readyState === 'READY',
          )
        : deployments.find((d) => d.readyState === 'READY');
      if (match) return { ready: true, deployment: match };
    }
    await sleep(pollMs);
  }

  return { ready: false };
}
