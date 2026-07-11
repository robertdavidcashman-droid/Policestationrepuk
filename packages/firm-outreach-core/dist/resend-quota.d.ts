/** Shared Resend free-tier ceiling — both workspaces share one API key. */
export declare const DEFAULT_RESEND_DAILY_LIMIT = 100;
/** Headroom reserved for login codes, digests, Kent corrections, etc. */
export declare const DEFAULT_RESEND_HEADROOM = 10;
export declare const RESEND_COUNT_KEY_PREFIX = "firmoutreach:resend:count:";
export declare function resendQuotaKey(utcDate: string): string;
export declare function resendDailyLimit(): number;
export declare function resendDailyHeadroom(): number;
/** Effective outreach budget across both sites for a UTC day. */
export declare function resendOutreachBudget(): number;
export declare function resendQuotaRemaining(count: number): number;
export declare function isTransientResendError(error?: string): boolean;
export declare function isPermanentResendError(error?: string): boolean;
//# sourceMappingURL=resend-quota.d.ts.map