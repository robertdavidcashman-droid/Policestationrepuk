export declare function normalizeFirmName(name: string): string;
export declare function slugifyFirmKey(parts: string[]): string;
export declare function firmKeyFromParts(firmName: string, postcode?: string, town?: string): string;
export declare function normalizeEmail(email: string): string;
export declare function emailHash(email: string): string;
export declare function prospectIdFromKey(key: string): string;
/** Prospect ids are scoped per campaign so shared Redis can hold PSA + RepUK queues. */
export declare function prospectIdForCampaign(campaignId: string, idKey: string): string;
export declare function isEnglandWalesPostcode(postcode: string | undefined | null): boolean;
export declare function registrableDomain(host: string): string | null;
export declare function domainFromUrl(url: string | undefined | null): string | null;
//# sourceMappingURL=normalize.d.ts.map