import type { LaaProviderRecord, DsccRegisterEntry } from './adapters';
import { type CrimeRegistry } from './qualification';
import type { FirmProspect, FirmProspectSource, FirmProspectType } from './types';
export interface RawProspectInput {
    prospectType: FirmProspectType;
    firmName: string;
    contactName?: string;
    title?: string;
    forename?: string;
    surname?: string;
    town?: string;
    county?: string;
    postcode?: string;
    phone?: string;
    websiteUrl?: string;
    regulatoryNumber?: string;
    email?: string;
    emailConfidence?: FirmProspect['emailConfidence'];
    emailScore?: number;
    source: FirmProspectSource;
    priorityBoost?: number;
}
export declare function shouldExcludeFirm(firmName: string, websiteUrl?: string): string | null;
export declare function buildProspectFromInput(input: RawProspectInput, campaignId: string): FirmProspect | null;
export declare function mergeProspect(existing: FirmProspect, incoming: FirmProspect): FirmProspect;
export declare function laaRecordsToInputs(records: LaaProviderRecord[]): RawProspectInput[];
export declare function dsccEntriesToInputs(entries: DsccRegisterEntry[]): RawProspectInput[];
export interface ArchiveLawFirm {
    name: string;
    sraNumber?: string;
    address?: string;
    postcode?: string;
    phone?: string;
    email?: string;
    website?: string;
    county?: string;
    region?: string;
    criminalLawPractice?: boolean;
    policeStationWork?: boolean;
}
export declare function archiveFirmsToInputs(rows: ArchiveLawFirm[], registry: CrimeRegistry): RawProspectInput[];
//# sourceMappingURL=merge-prospects.d.ts.map