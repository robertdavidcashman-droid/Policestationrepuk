/** Minimal LAA row shape used by firm-outreach merge/qualification (apps may use richer types). */
export interface LaaProviderRecord {
    firmName: string;
    sraNumber?: string;
    town?: string;
    county?: string;
    postcode?: string;
    phone?: string;
}
/** Minimal DSCC register row shape used by firm-outreach. */
export interface DsccRegisterEntry {
    firm?: string;
    title?: string;
    forename?: string;
    surname?: string;
}
//# sourceMappingURL=adapters.d.ts.map