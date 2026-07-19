export declare const CONTACT_PATHS: readonly ["/", "/contact", "/contact-us", "/about", "/about-us", "/criminal-law", "/police-station", "/criminal-defence"];
export declare const REJECTED_EMAIL_LOCALS: Set<string>;
export declare const PREFERRED_EMAIL_LOCALS: Record<string, number>;
export declare const FREE_EMAIL_DOMAINS: Set<string>;
/** Operator inboxes — must never be selected as a firm/solicitor outreach target. */
export declare const OPERATOR_OUTREACH_EMAILS: Set<string>;
/**
 * Registrable domains that appear in firm website footers, badges, widgets,
 * directories, review sites, CDNs and analytics — never a firm's own contact
 * address. Crawled emails on these are rejected outright so we don't outreach
 * to e.g. support@crunchbase.com or contact@thegoodsolicitorguide.com.
 */
export declare const NON_FIRM_EMAIL_DOMAINS: Set<string>;
export declare const EXCLUDED_FIRM_PATTERNS: RegExp[];
export declare const CRIMINAL_KEYWORDS: readonly ["police station", "custody", "criminal defence", "criminal defense", "duty solicitor", "legal aid crime", "crime department"];
export declare const COMPETITOR_KEYWORDS: readonly ["police station agency", "cover agency", "rep agency"];
/** Scotland, NI, IoM, Channel Islands — not England & Wales. */
export declare const NON_EW_POSTCODE_PREFIXES: readonly ["AB", "BT", "DD", "DG", "EH", "FK", "G", "GY", "HS", "IM", "IV", "JE", "KA", "KW", "KY", "ML", "PA", "PH", "TD", "ZE"];
export interface OutreachLimitsDefaults {
    dailyCap?: number;
    enrichBatch?: number;
    cronEnrichBatch?: number;
    cronSendBatch?: number;
    enrichMaxMs?: number;
    paidDailyCap?: number;
    countyAllowlist?: string[] | null;
}
export declare function createOutreachEnvHelpers(defaults?: OutreachLimitsDefaults): {
    outreachEnabled(): boolean;
    outreachPaused(): boolean;
    outreachSendEnabled(): boolean;
    /**
     * Auto-send by default (matches production recommendation).
     * Set FIRM_OUTREACH_REQUIRE_APPROVAL=true for click-to-send approval emails.
     */
    outreachRequireApproval(): boolean;
    dailySendCap(): number;
    enrichBatchSize(): number;
    cronEnrichBatchSize(): number;
    cronSendBatchSize(): number;
    enrichMaxElapsedMs(): number;
    paidDailyCap(): number;
    countyAllowlist(): string[] | null;
};
//# sourceMappingURL=shared-constants.d.ts.map