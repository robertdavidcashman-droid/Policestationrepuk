export interface OutreachEnvValidation {
    ok: boolean;
    errors: string[];
    warnings?: string[];
    dryRun: boolean;
    sendingEnabled: boolean;
}
/**
 * Loud fail helper for cron routes — lists missing production config.
 * FROM/DIGEST are warnings only: runtime already falls back to
 * `PoliceStationRepUK <noreply@policestationrepuk.org>` and a digest default.
 *
 * Live sending fails closed when critical config is invalid.
 */
export declare function validateOutreachEnv(opts?: {
    requireCronSecret?: boolean;
    requireWebhookSecret?: boolean;
    /** When true, live sending without dry-run requires stricter checks. */
    forLiveSend?: boolean;
}): OutreachEnvValidation;
//# sourceMappingURL=env-validation.d.ts.map