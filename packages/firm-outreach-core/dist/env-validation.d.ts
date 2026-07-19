export interface OutreachEnvValidation {
    ok: boolean;
    errors: string[];
    warnings?: string[];
}
/**
 * Loud fail helper for cron routes — lists missing production config.
 * FROM/DIGEST are warnings only: runtime already falls back to
 * `PoliceStationRepUK <noreply@policestationrepuk.org>` and a digest default.
 */
export declare function validateOutreachEnv(opts?: {
    requireCronSecret?: boolean;
}): OutreachEnvValidation;
//# sourceMappingURL=env-validation.d.ts.map