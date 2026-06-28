export interface UtmParams {
    source: string;
    medium: string;
    campaign: string;
    content?: string;
    term?: string;
}
export declare function appendUtm(url: string, params: UtmParams): string;
//# sourceMappingURL=utm.d.ts.map