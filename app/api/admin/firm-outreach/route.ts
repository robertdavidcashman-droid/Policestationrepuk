import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-auth';
import { getKV } from '@/lib/kv';
import { dailySendCap, outreachPaused, outreachSendEnabled } from '@/lib/firm-outreach/constants';
import {
  activityReportToCsv,
  buildExcludedProspectsView,
  buildOutreachActivityReport,
  buildReadyProspectsView,
  buildSendsView,
  buildSuppressionsView,
  emptyOutreachActivityReport,
  getCachedOutreachSummaryView,
} from '@/lib/firm-outreach/outreach/activity-report';
import { markProspectJoinedWhatsApp } from '@/lib/firm-outreach/storage';
import { invalidateOutreachSummaryCache } from '@/lib/firm-outreach/outreach/activity-report';
import {
  bulkExcludeProspects,
  bulkSendProspects,
  excludeProspect,
  manualSendProspect,
  restoreExcludedProspect,
} from '@/lib/firm-outreach/outreach/admin-actions';

export const dynamic = 'force-dynamic';
export const maxDuration = 120;

function baseMeta() {
  return {
    paused: outreachPaused(),
    sendEnabled: outreachSendEnabled(),
    dailyCap: dailySendCap(),
  };
}

export async function GET(request: Request) {
  const auth = await requireAdmin();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  try {
    const url = new URL(request.url);
    const format = url.searchParams.get('format');
    const view = url.searchParams.get('view') ?? 'summary';
    const refresh = url.searchParams.get('refresh') === '1';

    if (!getKV()) {
      const empty = emptyOutreachActivityReport();
      if (format === 'csv') {
        return new NextResponse(activityReportToCsv(empty.report), {
          headers: {
            'Content-Type': 'text/csv; charset=utf-8',
            'Content-Disposition': `attachment; filename="firm-outreach-empty.csv"`,
          },
        });
      }
      return NextResponse.json({
        ok: true,
        kvConfigured: false,
        warning: 'KV not configured — outreach data unavailable',
        ...baseMeta(),
        counts: empty.prospectCounts,
        report: empty.report,
      });
    }

    if (format === 'csv' || view === 'full') {
      const { report, prospectCounts } = await buildOutreachActivityReport();
      if (format === 'csv') {
        const csv = activityReportToCsv(report);
        const date = report.generatedAt.slice(0, 10);
        return new NextResponse(csv, {
          headers: {
            'Content-Type': 'text/csv; charset=utf-8',
            'Content-Disposition': `attachment; filename="firm-outreach-${date}.csv"`,
          },
        });
      }
      return NextResponse.json({
        ok: true,
        kvConfigured: true,
        ...baseMeta(),
        counts: prospectCounts,
        report,
      });
    }

    if (view === 'ready') {
      const readyToSendProspects = await buildReadyProspectsView();
      return NextResponse.json({
        ok: true,
        kvConfigured: true,
        view: 'ready',
        readyToSendProspects,
      });
    }

    if (view === 'excluded') {
      const excludedProspects = await buildExcludedProspectsView();
      return NextResponse.json({
        ok: true,
        kvConfigured: true,
        view: 'excluded',
        excludedProspects,
      });
    }

    if (view === 'sends') {
      const limit = Math.min(500, Math.max(1, Number(url.searchParams.get('limit')) || 100));
      const offset = Math.max(0, Number(url.searchParams.get('offset')) || 0);
      const { sends, total } = await buildSendsView(limit, offset);
      return NextResponse.json({
        ok: true,
        kvConfigured: true,
        view: 'sends',
        sends,
        pagination: { limit, offset, total },
      });
    }

    if (view === 'suppressions') {
      const suppressions = await buildSuppressionsView();
      return NextResponse.json({
        ok: true,
        kvConfigured: true,
        view: 'suppressions',
        suppressions,
      });
    }

    const summaryView = await getCachedOutreachSummaryView(refresh);
    return NextResponse.json({
      ok: true,
      kvConfigured: true,
      view: 'summary',
      ...baseMeta(),
      counts: summaryView.prospectCounts,
      generatedAt: summaryView.generatedAt,
      summary: summaryView.summary,
      recentSends: summaryView.recentSends,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to build outreach report';
    console.error('[admin/firm-outreach]', err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const auth = await requireAdmin();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  try {
    let body: {
      action?: string;
      prospectId?: string;
      prospectIds?: string[];
      targetStatus?: 'discovered' | 'ready_to_send';
      addManualSource?: boolean;
      crimeWebsiteVerified?: boolean;
      dryRun?: boolean;
      reason?: string;
      limit?: number;
      respectDailyCap?: boolean;
    };
    try {
      body = (await request.json()) as typeof body;
    } catch {
      return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
    }

    if (body.action === 'mark_joined' && body.prospectId?.trim()) {
      const prospect = await markProspectJoinedWhatsApp(body.prospectId.trim());
      if (!prospect) {
        return NextResponse.json({ error: 'Prospect not found' }, { status: 404 });
      }
      void invalidateOutreachSummaryCache();
      return NextResponse.json({ ok: true, prospect });
    }

    if (body.action === 'restore_excluded' && body.prospectId?.trim()) {
      const result = await restoreExcludedProspect(body.prospectId.trim(), {
        targetStatus: body.targetStatus,
        addManualSource: body.addManualSource,
        crimeWebsiteVerified: body.crimeWebsiteVerified,
      });
      if (!result.ok) {
        const status = result.error === 'not_found' ? 404 : 400;
        return NextResponse.json({ error: result.error }, { status });
      }
      return NextResponse.json({ ok: true, prospect: result.prospect });
    }

    if (body.action === 'exclude_prospect' && body.prospectId?.trim()) {
      const result = await excludeProspect(body.prospectId.trim(), body.reason);
      if (!result.ok) {
        const status = result.error === 'not_found' ? 404 : 400;
        return NextResponse.json({ error: result.error }, { status });
      }
      return NextResponse.json({ ok: true, prospect: result.prospect });
    }

    if (body.action === 'bulk_send' && Array.isArray(body.prospectIds) && body.prospectIds.length > 0) {
      const ids = body.prospectIds.map((id) => id.trim()).filter(Boolean);
      const result = await bulkSendProspects(ids, {
        dryRun: body.dryRun,
        limit: body.limit,
        respectDailyCap: body.respectDailyCap,
      });
      return NextResponse.json({ ok: true, bulk: result });
    }

    if (body.action === 'bulk_exclude' && Array.isArray(body.prospectIds) && body.prospectIds.length > 0) {
      const ids = body.prospectIds.map((id) => id.trim()).filter(Boolean);
      const result = await bulkExcludeProspects(ids, body.reason);
      return NextResponse.json({ ok: true, bulk: result });
    }

    if (body.action === 'manual_send' && body.prospectId?.trim()) {
      const result = await manualSendProspect(body.prospectId.trim(), {
        dryRun: body.dryRun,
      });
      if (!result.ok) {
        const status =
          result.error === 'not_found' ? 404 : result.error === 'suppressed' ? 409 : 400;
        return NextResponse.json({ error: result.error }, { status });
      }
      return NextResponse.json({
        ok: true,
        prospect: result.prospect,
        send: result.data,
      });
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Request failed';
    console.error('[admin/firm-outreach POST]', err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
