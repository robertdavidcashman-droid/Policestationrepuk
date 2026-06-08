import { selectAuditBatch } from './cursor';
import { notifyIfFindings } from './notify';
import { scanBatch } from './runner';
import { buildAllUnits } from './units';

export interface EditorialAuditRunResult {
  totalUnits: number;
  batchSize: number;
  batchStartIndex: number;
  nextCursor: number;
  scannedUnitIds: string[];
  findings: ReturnType<typeof scanBatch>;
  notification: Awaited<ReturnType<typeof notifyIfFindings>>;
}

export async function runEditorialAudit(opts?: { limit?: number }): Promise<EditorialAuditRunResult> {
  const units = buildAllUnits();
  const batchSize = opts?.limit ?? Number(process.env.EDITORIAL_AUDIT_BATCH_SIZE || 20);
  const selection = await selectAuditBatch(units, batchSize);
  const findings = scanBatch(selection.batch);
  const notification = await notifyIfFindings(findings, selection.batch.length);

  return {
    totalUnits: selection.total,
    batchSize,
    batchStartIndex: selection.batchStartIndex,
    nextCursor: selection.nextCursor,
    scannedUnitIds: selection.scannedUnitIds,
    findings,
    notification,
  };
}
