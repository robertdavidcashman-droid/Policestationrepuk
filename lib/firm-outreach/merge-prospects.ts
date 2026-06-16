import * as core from '@robertcashman/firm-outreach-core';
import { FIRM_OUTREACH_CAMPAIGN_ID } from './site-config';

export type RawProspectInput = core.RawProspectInput;
export type ArchiveLawFirm = core.ArchiveLawFirm;

export const shouldExcludeFirm = core.shouldExcludeFirm;
export const mergeProspect = core.mergeProspect;
export const laaRecordsToInputs = core.laaRecordsToInputs;
export const dsccEntriesToInputs = core.dsccEntriesToInputs;
export const archiveFirmsToInputs = core.archiveFirmsToInputs;

export function buildProspectFromInput(input: core.RawProspectInput) {
  return core.buildProspectFromInput(input, FIRM_OUTREACH_CAMPAIGN_ID);
}
