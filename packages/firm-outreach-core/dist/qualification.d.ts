import type { DsccRegisterEntry, LaaProviderRecord } from './adapters';
import type { FirmProspect, FirmProspectSource, FirmProspectStatus } from './types';
/** Sources that independently justify criminal-defence WhatsApp outreach. */
export declare const VERIFIED_CRIME_SOURCES: readonly FirmProspectSource[];
export interface CrimeRegistry {
    laaSraNumbers: Set<string>;
    laaFirmNames: Set<string>;
    dsccFirmNames: Set<string>;
}
export declare function buildCrimeRegistry(laaRecords: LaaProviderRecord[], dsccEntries: DsccRegisterEntry[]): CrimeRegistry;
export declare function isOnCrimeRegistry(firmName: string, registry: CrimeRegistry, sraNumber?: string): boolean;
export declare function hasVerifiedCrimeSource(sources: FirmProspectSource[]): boolean;
export interface QualificationResult {
    qualified: boolean;
    reason: string;
}
type OutreachQualificationProspect = Pick<FirmProspect, 'prospectType' | 'sources' | 'status' | 'excludedReason' | 'firmName' | 'regulatoryNumber' | 'crimeWebsiteVerified'>;
export declare function qualifyProspectForOutreach(prospect: OutreachQualificationProspect, registry?: CrimeRegistry): QualificationResult;
/** Apply outreach qualification when deciding ready_to_send vs discovered. */
export declare function resolveStatusWithQualification(prospect: OutreachQualificationProspect & Pick<FirmProspect, 'email'>, preferred: FirmProspectStatus, registry?: CrimeRegistry): FirmProspectStatus;
export declare function unqualifiedReason(prospect: OutreachQualificationProspect): string;
export {};
//# sourceMappingURL=qualification.d.ts.map