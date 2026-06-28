/**
 * Google Business Profile (via Buffer) rejects post bodies that contain phone numbers.
 * The learn_more CTA link is set in post metadata — dialable numbers must be stripped from text.
 */
export declare function containsGoogleBusinessPhoneNumber(text: string): boolean;
export declare function sanitizeGoogleBusinessPostText(text: string): string;
//# sourceMappingURL=google-business-text.d.ts.map