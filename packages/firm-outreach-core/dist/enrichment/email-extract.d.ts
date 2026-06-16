import type { FirmProspectEmail } from '../types';
export declare function extractEmailsFromHtml(html: string): string[];
export declare function scoreEmailCandidate(email: string, opts: {
    prospectType: 'firm' | 'solicitor';
    websiteUrl?: string;
    forename?: string;
    surname?: string;
    pageText?: string;
}): number;
export declare function pickBestEmail(candidates: string[], opts: Parameters<typeof scoreEmailCandidate>[1]): FirmProspectEmail | null;
export declare function guessEmailsForDomain(domain: string): string[];
//# sourceMappingURL=email-extract.d.ts.map