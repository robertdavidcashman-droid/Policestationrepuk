export interface OutreachEnvValidation {
    ok: boolean;
    errors: string[];
}
/** Loud fail helper for cron routes — lists missing production config. */
export declare function validateOutreachEnv(opts?: {
    requireCronSecret?: boolean;
}): OutreachEnvValidation;
//# sourceMappingURL=env-validation.d.ts.map