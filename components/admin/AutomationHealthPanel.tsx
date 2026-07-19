'use client';

import { useCallback, useEffect, useState, useTransition } from 'react';

type StatusPayload = {
  ok: boolean;
  status?: {
    overallStatus: string;
    environment: string;
    deploymentId: string | null;
    config: {
      enabled: boolean;
      dryRun: boolean;
      timezone: string;
      dailyHealthcheckEnabled: boolean;
      watchdogEnabled: boolean;
      autoRepairEnabled: boolean;
      dailySuccessEmailEnabled: boolean;
      schedulerSource: string;
    };
    lastDailyHealthCheck: { completedAt?: string | null; status?: string; executionId?: string } | null;
    lastBufferSchedulerRun: unknown;
    lastCrossSiteRun: unknown;
    jobs: Array<{
      name: string;
      healthStatus: string;
      lastSuccessfulAt: string | null;
      lastFailureAt: string | null;
      lastError: string | null;
      expectedSchedule: string;
      consecutiveFailureCount: number;
    }>;
    nextScheduled: Record<string, string>;
  };
  error?: string;
};

export function AutomationHealthPanel() {
  const [data, setData] = useState<StatusPayload | null>(null);
  const [actionResult, setActionResult] = useState<string>('');
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    startTransition(async () => {
      setError(null);
      try {
        const res = await fetch('/api/admin/automation', { cache: 'no-store' });
        const json = (await res.json()) as StatusPayload;
        if (!res.ok) {
          setError(json.error ?? 'Failed to load status');
          return;
        }
        setData(json);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load');
      }
    });
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const runAction = (action: string, dryRun = true) => {
    startTransition(async () => {
      setActionResult('');
      setError(null);
      try {
        const res = await fetch('/api/admin/automation', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action, dryRun }),
        });
        const json = await res.json();
        setActionResult(JSON.stringify(json, null, 2));
        if (res.ok) load();
        else setError(json.error ?? 'Action failed');
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Action failed');
      }
    });
  };

  const status = data?.status;

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          className="rounded-lg bg-[var(--navy)] px-4 py-2 text-base font-semibold text-white disabled:opacity-50"
          onClick={() => load()}
          disabled={pending}
        >
          Refresh
        </button>
        <button
          type="button"
          className="rounded-lg border border-[var(--border)] bg-white px-4 py-2 text-base font-semibold text-[var(--navy)] disabled:opacity-50"
          onClick={() => runAction('healthcheck', true)}
          disabled={pending}
        >
          Dry-run healthcheck
        </button>
        <button
          type="button"
          className="rounded-lg border border-[var(--border)] bg-white px-4 py-2 text-base font-semibold text-[var(--navy)] disabled:opacity-50"
          onClick={() => runAction('watchdog', true)}
          disabled={pending}
        >
          Dry-run watchdog
        </button>
        <button
          type="button"
          className="rounded-lg border border-[var(--border)] bg-white px-4 py-2 text-base font-semibold text-[var(--navy)] disabled:opacity-50"
          onClick={() => runAction('gap_fill', true)}
          disabled={pending}
        >
          Inspect REPUK quota
        </button>
        <button
          type="button"
          className="rounded-lg border border-[var(--border)] bg-white px-4 py-2 text-base font-semibold text-[var(--navy)] disabled:opacity-50"
          onClick={() => runAction('force_schedule', true)}
          disabled={pending}
        >
          Inspect force-schedule
        </button>
        <button
          type="button"
          className="rounded-lg border border-amber-300 bg-amber-50 px-4 py-2 text-base font-semibold text-amber-950 disabled:opacity-50"
          onClick={() => {
            if (
              !window.confirm(
                'Force-schedule today\'s Buffer posts on production now? This creates live Buffer posts.',
              )
            ) {
              return;
            }
            runAction('force_schedule', false);
          }}
          disabled={pending}
        >
          Force schedule today (live)
        </button>
        <button
          type="button"
          className="rounded-lg border border-[var(--border)] bg-white px-4 py-2 text-base font-semibold text-[var(--navy)] disabled:opacity-50"
          onClick={() => runAction('cross_site_inspect', true)}
          disabled={pending}
        >
          Inspect cross-site
        </button>
        <button
          type="button"
          className="rounded-lg border border-[var(--border)] bg-white px-4 py-2 text-base font-semibold text-[var(--navy)] disabled:opacity-50"
          onClick={() => runAction('test_daily_report', true)}
          disabled={pending}
        >
          Test daily report (dry-run)
        </button>
      </div>

      {error ? (
        <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-base text-red-800">
          {error}
        </p>
      ) : null}

      {status ? (
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-xl border border-[var(--border)] bg-white p-6">
            <h2 className="text-xl font-bold text-[var(--navy)]">Overview</h2>
            <dl className="mt-4 space-y-2 text-base text-[var(--muted)]">
              <div className="flex justify-between gap-4">
                <dt>Overall</dt>
                <dd className="font-semibold text-[var(--navy)]">{status.overallStatus}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt>Environment</dt>
                <dd>{status.environment}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt>Deployment</dt>
                <dd className="truncate">{status.deploymentId ?? 'n/a'}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt>Scheduler</dt>
                <dd>{status.config.schedulerSource}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt>Dry-run default</dt>
                <dd>{status.config.dryRun ? 'yes' : 'no'}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt>Auto-repair</dt>
                <dd>{status.config.autoRepairEnabled ? 'enabled' : 'disabled'}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt>Last healthcheck</dt>
                <dd>
                  {status.lastDailyHealthCheck?.completedAt ?? 'never'} (
                  {status.lastDailyHealthCheck?.status ?? 'n/a'})
                </dd>
              </div>
            </dl>
            <h3 className="mt-6 text-lg font-bold text-[var(--navy)]">Next schedules (UTC)</h3>
            <ul className="mt-2 space-y-1 text-base text-[var(--muted)]">
              {Object.entries(status.nextScheduled).map(([k, v]) => (
                <li key={k}>
                  <strong className="text-[var(--navy)]">{k}</strong>: {v}
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-xl border border-[var(--border)] bg-white p-6">
            <h2 className="text-xl font-bold text-[var(--navy)]">Jobs</h2>
            <ul className="mt-4 divide-y divide-[var(--border)]">
              {status.jobs.map((job) => (
                <li key={job.name} className="py-3 text-base">
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <strong className="text-[var(--navy)]">{job.name}</strong>
                    <span className="text-[var(--muted)]">{job.healthStatus}</span>
                  </div>
                  <p className="text-[var(--muted)]">Schedule: {job.expectedSchedule}</p>
                  <p className="text-[var(--muted)]">
                    Last OK: {job.lastSuccessfulAt ?? 'n/a'} · Failures:{' '}
                    {job.consecutiveFailureCount}
                  </p>
                  {job.lastError ? (
                    <p className="text-red-700">Error: {job.lastError}</p>
                  ) : null}
                </li>
              ))}
            </ul>
          </div>
        </div>
      ) : (
        <p className="text-base text-[var(--muted)]">{pending ? 'Loading…' : 'No status yet.'}</p>
      )}

      {actionResult ? (
        <div className="rounded-xl border border-[var(--border)] bg-white p-6">
          <h2 className="text-xl font-bold text-[var(--navy)]">Last action result</h2>
          <pre className="mt-3 max-h-[420px] overflow-auto rounded-lg bg-slate-50 p-4 text-sm text-[var(--navy)]">
            {actionResult}
          </pre>
        </div>
      ) : null}

      <p className="text-sm text-[var(--muted)]">
        Most actions default to dry-run. <strong>Force schedule today (live)</strong> runs the same
        path as the Buffer cron with <code>?force=1</code>. Secrets and email addresses are not shown
        here.
      </p>
    </div>
  );
}
