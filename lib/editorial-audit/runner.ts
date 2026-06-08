import { proposedFixForCode } from './fixes';
import { scanText } from './rules';
import type { AuditFinding, AuditUnit } from './types';

export function findingFingerprint(unitId: string, code: string): string {
  return `${unitId}:${code}`;
}

export function scanUnit(unit: AuditUnit): AuditFinding[] {
  const flags = scanText(unit.text).filter((f) => f.severity === 'PROBLEM' || f.severity === 'REVIEW');
  return flags.map((flag) => ({
    fingerprint: findingFingerprint(unit.id, flag.code),
    unitId: unit.id,
    url: unit.url,
    sectionTitle: unit.sectionTitle,
    sourceFile: unit.sourceFile,
    severity: flag.severity,
    code: flag.code,
    reason: flag.message,
    proposedFix: proposedFixForCode(flag.code),
    excerpt: flag.excerpt,
  }));
}

export function scanBatch(units: AuditUnit[]): AuditFinding[] {
  const out: AuditFinding[] = [];
  const seen = new Set<string>();
  for (const unit of units) {
    for (const finding of scanUnit(unit)) {
      if (seen.has(finding.fingerprint)) continue;
      seen.add(finding.fingerprint);
      out.push(finding);
    }
  }
  return out;
}
