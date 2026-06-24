import { revalidatePath } from 'next/cache';
import { approveFinding } from '@/lib/custody-discovery/storage';
import {
  deletePendingStationUpdate,
  saveStationOverride,
  type StationOverrideFields,
} from '@/lib/station-overrides';
import {
  loadPhoneProvenance,
  savePhoneProvenance,
  stationProvenanceKey,
  type PhoneProvenanceConfidence,
} from '@/lib/station-phone-provenance';
import {
  loadStationVerification,
  saveStationVerification,
  stationVerificationKey,
  type FieldVerificationStatus,
} from '@/lib/station-verification';
import { getAllStations } from '@/lib/data';
import type { PoliceStation } from '@/lib/types';

export type ApproveStationContactInput =
  | {
      kind: 'custody-finding';
      findingId: string;
      approvedBy: string;
      notes?: string;
      markVerified?: boolean;
    }
  | {
      kind: 'community-update';
      stationId: string;
      submissionId?: string;
      fields: StationOverrideFields;
      approvedBy: string;
      markVerified?: boolean;
      sourceUrl?: string;
    };

export interface ApproveStationContactResult {
  ok: boolean;
  kind: ApproveStationContactInput['kind'];
  stationId?: string;
  stationSlug?: string;
  conflict?: {
    message: string;
    existing?: string;
    candidate?: string;
  };
  approved?: unknown;
}

async function revalidateStationPaths(station: PoliceStation | undefined) {
  revalidatePath('/StationsDirectory');
  revalidatePath('/Map');
  revalidatePath('/HelpUsStationNumbers');
  revalidatePath('/admin/station-contacts');
  if (station) revalidatePath(`/police-station/${station.slug}`);
}

function provenanceConfidence(markVerified?: boolean): PhoneProvenanceConfidence {
  return markVerified ? 'high' : 'medium';
}

function verificationStatus(markVerified?: boolean): FieldVerificationStatus {
  return markVerified ? 'verified' : 'unverified';
}

async function applyVerificationForOverride(
  station: PoliceStation,
  fields: StationOverrideFields,
  opts: { approvedBy: string; markVerified?: boolean; sourceUrl?: string },
) {
  const key = stationVerificationKey(station);
  const verification = loadStationVerification();
  const provenance = loadPhoneProvenance();
  const now = new Date().toISOString().slice(0, 10);
  const record = { ...(verification[key] ?? {}) };
  const fieldMap = { ...(record.fields ?? {}) };

  const phoneFields: (keyof StationOverrideFields)[] = [
    'phone',
    'custodyPhone',
    'custodyPhone2',
    'nonEmergencyPhone',
  ];

  for (const field of phoneFields) {
    const value = fields[field];
    if (!value?.trim()) continue;
    if (field === 'nonEmergencyPhone') continue;
    fieldMap[field] = {
      status: verificationStatus(opts.markVerified),
      sourceUrl: opts.sourceUrl,
      dateVerified: now,
      notes: `Approved by ${opts.approvedBy}`,
    };
    if (field === 'custodyPhone' || field === 'custodyPhone2') {
      const provKey = stationProvenanceKey(station);
      provenance[provKey] = {
        ...(provenance[provKey] ?? {}),
        [field]: {
          number: value.trim(),
          source: opts.sourceUrl ?? 'admin approval',
          verifiedAt: now,
          confidence: provenanceConfidence(opts.markVerified),
          field,
        },
      };
    }
  }

  record.fields = fieldMap;
  record.dateVerified = now;
  record.verificationStatus = opts.markVerified ? 'verified' : 'partial';
  if (opts.sourceUrl) record.sourceUrl = opts.sourceUrl;

  verification[key] = record;
  saveStationVerification(verification);
  savePhoneProvenance(provenance);
}

function detectPhoneConflict(
  station: PoliceStation,
  fields: StationOverrideFields,
): ApproveStationContactResult['conflict'] | null {
  if (fields.custodyPhone && station.custodyPhone) {
    const next = fields.custodyPhone.replace(/\s/g, '');
    const existing = station.custodyPhone.replace(/\s/g, '');
    if (next !== existing && station.verificationMeta?.custodyDiscovery?.status === 'verified') {
      return {
        message: 'Approved custody discovery number differs from community update.',
        existing: station.custodyPhone,
        candidate: fields.custodyPhone,
      };
    }
  }
  return null;
}

/** Unified approve path for custody findings and community station updates. */
export async function approveStationContact(
  input: ApproveStationContactInput,
): Promise<ApproveStationContactResult> {
  const stations = await getAllStations();

  if (input.kind === 'custody-finding') {
    const result = await approveFinding(input.findingId, input.approvedBy, {
      notes: input.notes,
      markVerified: input.markVerified,
    });
    if (!result) return { ok: false, kind: input.kind };
    const station = stations.find((s) => s.id === result.finding.custodySuiteId);
    await revalidateStationPaths(station);
    return {
      ok: true,
      kind: input.kind,
      stationId: result.finding.custodySuiteId,
      stationSlug: station?.slug,
      approved: result.approved,
    };
  }

  const station = stations.find((s) => s.id === input.stationId);
  if (!station) return { ok: false, kind: input.kind, stationId: input.stationId };

  const conflict = detectPhoneConflict(station, input.fields);
  if (conflict) {
    return {
      ok: false,
      kind: input.kind,
      stationId: input.stationId,
      stationSlug: station.slug,
      conflict,
    };
  }

  const override = await saveStationOverride(input.stationId, input.fields, {
    approvedBy: input.approvedBy,
    submissionId: input.submissionId,
  });
  await applyVerificationForOverride(station, input.fields, {
    approvedBy: input.approvedBy,
    markVerified: input.markVerified,
    sourceUrl: input.sourceUrl,
  });
  if (input.submissionId) await deletePendingStationUpdate(input.submissionId);
  await revalidateStationPaths(station);

  return {
    ok: true,
    kind: input.kind,
    stationId: input.stationId,
    stationSlug: station.slug,
    approved: override,
  };
}
