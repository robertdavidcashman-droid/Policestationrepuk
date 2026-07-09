export interface OutreachEnvValidation {
    ok: boolean;
    errors: string[];
}
export declare function validateOutreachEnv(opts?: {
    requireCronSecret?: boolean;
}): OutreachEnvValidation;
