"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.shouldExcludeFirm = shouldExcludeFirm;
exports.buildProspectFromInput = buildProspectFromInput;
exports.mergeProspect = mergeProspect;
exports.laaRecordsToInputs = laaRecordsToInputs;
exports.dsccEntriesToInputs = dsccEntriesToInputs;
exports.archiveFirmsToInputs = archiveFirmsToInputs;
const shared_constants_1 = require("./shared-constants");
const normalize_1 = require("./normalize");
const qualification_1 = require("./qualification");
function nowIso() {
    return new Date().toISOString();
}
function shouldExcludeFirm(firmName, websiteUrl) {
    for (const pat of shared_constants_1.EXCLUDED_FIRM_PATTERNS) {
        if (pat.test(firmName))
            return 'excluded_government_or_cps';
    }
    const blob = `${firmName} ${websiteUrl ?? ''}`.toLowerCase();
    for (const kw of shared_constants_1.COMPETITOR_KEYWORDS) {
        if (blob.includes(kw))
            return 'excluded_competitor_agency';
    }
    return null;
}
function buildProspectFromInput(input, campaignId) {
    const firmName = input.firmName?.trim();
    if (!firmName)
        return null;
    if (!(0, normalize_1.isEnglandWalesPostcode)(input.postcode))
        return null;
    const excluded = shouldExcludeFirm(firmName, input.websiteUrl);
    const firmKey = (0, normalize_1.firmKeyFromParts)(firmName, input.postcode, input.town);
    const idKey = input.prospectType === 'solicitor' && input.surname
        ? `${firmKey}:${input.forename ?? ''}:${input.surname}`
        : input.regulatoryNumber
            ? `sra:${input.regulatoryNumber}`
            : firmKey;
    const priorityScore = (input.priorityBoost ?? 0) +
        (input.source === 'laa' ? 30 : 0) +
        (input.source === 'dscc' ? 20 : 0) +
        (input.source === 'directory' ? 40 : 0) +
        (input.email ? 15 : 0);
    const email = input.email?.trim().toLowerCase();
    const sources = [input.source];
    const baseStatus = excluded ? 'excluded' : 'discovered';
    const preferred = excluded ? 'excluded' : email ? 'ready_to_send' : 'discovered';
    const prospect = {
        id: (0, normalize_1.prospectIdForCampaign)(campaignId, idKey),
        prospectType: input.prospectType,
        firmName,
        firmKey,
        contactName: input.contactName,
        title: input.title,
        forename: input.forename,
        surname: input.surname,
        town: input.town,
        county: input.county,
        postcode: input.postcode,
        phone: input.phone,
        websiteUrl: input.websiteUrl,
        regulatoryNumber: input.regulatoryNumber,
        email,
        emailConfidence: input.emailConfidence,
        emailScore: input.emailScore,
        sources,
        status: (0, qualification_1.resolveStatusWithQualification)({
            prospectType: input.prospectType,
            sources,
            status: baseStatus,
            excludedReason: excluded ?? undefined,
            email,
            firmName,
            regulatoryNumber: input.regulatoryNumber,
        }, preferred),
        priorityScore,
        excludedReason: excluded ?? undefined,
        sequenceStep: 0,
        campaignId,
        createdAt: nowIso(),
        updatedAt: nowIso(),
        enrichAttempts: 0,
    };
    return prospect;
}
function mergeProspect(existing, incoming) {
    const sources = [...new Set([...existing.sources, ...incoming.sources])];
    const merged = {
        ...existing,
        town: existing.town || incoming.town,
        county: existing.county || incoming.county,
        postcode: existing.postcode || incoming.postcode,
        phone: existing.phone || incoming.phone,
        websiteUrl: existing.websiteUrl || incoming.websiteUrl,
        regulatoryNumber: existing.regulatoryNumber || incoming.regulatoryNumber,
        contactName: existing.contactName || incoming.contactName,
        title: existing.title || incoming.title,
        forename: existing.forename || incoming.forename,
        surname: existing.surname || incoming.surname,
        sources,
        priorityScore: Math.max(existing.priorityScore, incoming.priorityScore),
        updatedAt: nowIso(),
    };
    if (!merged.email && incoming.email) {
        merged.email = incoming.email;
        merged.emailConfidence = incoming.emailConfidence;
        merged.emailScore = incoming.emailScore;
    }
    const outreachMutable = ['discovered', 'no_email', 'enriched', 'enriching', 'ready_to_send'];
    if (outreachMutable.includes(merged.status) && merged.email) {
        merged.status = (0, qualification_1.resolveStatusWithQualification)(merged, 'ready_to_send');
    }
    return merged;
}
function laaRecordsToInputs(records) {
    return records
        .filter((r) => (0, normalize_1.isEnglandWalesPostcode)(r.postcode))
        .map((r) => ({
        prospectType: 'firm',
        firmName: r.firmName,
        town: r.town,
        county: r.county,
        postcode: r.postcode,
        phone: r.phone,
        source: 'laa',
        priorityBoost: 0,
    }));
}
function dsccEntriesToInputs(entries) {
    const firms = new Map();
    const solicitors = [];
    for (const e of entries) {
        const firm = e.firm?.trim();
        if (!firm)
            continue;
        const firmKey = (0, normalize_1.normalizeFirmName)(firm);
        if (!firms.has(firmKey)) {
            firms.set(firmKey, {
                prospectType: 'firm',
                firmName: firm,
                source: 'dscc',
                priorityBoost: 10,
            });
        }
        if (e.surname?.trim()) {
            solicitors.push({
                prospectType: 'solicitor',
                firmName: firm,
                title: e.title,
                forename: e.forename,
                surname: e.surname,
                contactName: [e.title, e.forename, e.surname].filter(Boolean).join(' ').trim(),
                source: 'dscc',
                priorityBoost: 5,
            });
        }
    }
    return [...firms.values(), ...solicitors];
}
function archiveFirmsToInputs(rows, registry) {
    return rows
        .filter((r) => (0, normalize_1.isEnglandWalesPostcode)(r.postcode))
        .filter((r) => (0, qualification_1.isOnCrimeRegistry)(r.name, registry, r.sraNumber))
        .map((r) => {
        const norm = (0, normalize_1.normalizeFirmName)(r.name);
        const onLaa = Boolean(norm && registry.laaFirmNames.has(norm));
        return {
            prospectType: 'firm',
            firmName: r.name,
            county: r.county,
            postcode: r.postcode,
            phone: r.phone,
            websiteUrl: r.website,
            regulatoryNumber: r.sraNumber,
            email: r.email,
            emailConfidence: 'verified',
            emailScore: 85,
            source: (onLaa ? 'laa' : 'dscc'),
            priorityBoost: r.policeStationWork ? 15 : 5,
        };
    });
}
