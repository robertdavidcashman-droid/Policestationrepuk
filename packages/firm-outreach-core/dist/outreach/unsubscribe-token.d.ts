export interface UnsubscribePayload {
    email: string;
    exp: number;
}
export declare function issueUnsubscribeToken(email: string, ttlDays?: number): string;
export declare function verifyUnsubscribeToken(token: string): UnsubscribePayload | null;
//# sourceMappingURL=unsubscribe-token.d.ts.map