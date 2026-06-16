"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.VERIFIED_CRIME_SOURCES = void 0;
exports.buildCrimeRegistry = buildCrimeRegistry;
exports.isOnCrimeRegistry = isOnCrimeRegistry;
exports.hasVerifiedCrimeSource = hasVerifiedCrimeSource;
exports.qualifyProspectForOutreach = qualifyProspectForOutreach;
exports.resolveStatusWithQualification = resolveStatusWithQualification;
exports.unqualifiedReason = unqualifiedReason;
const normalize_1 = require("./normalize");
/** Sources that independently justify criminal-defence WhatsApp outreach. */
exports.VERIFIED_CRIME_SOURCES = [
    'laa',
    'dscc',
    'directory',
    'manual',
];
function buildCrimeRegistry(laaRecords, dsccEntries) {
    const laaSraNumbers = new Set();
    const laaFirmNames = new Set();
    const dsccFirmNames = new Set();
    for (const r of laaRecords) {
        const name = (0, normalize_1.normalizeFirmName)(r.firmName);
        if (name)
            laaFirmNames.add(name);
    }
    for (const e of dsccEntries) {
        const firm = e.firm?.trim();
        if (!firm)
            continue;
        dsccFirmNames.add((0, normalize_1.normalizeFirmName)(firm));
    }
    return { laaSraNumbers, laaFirmNames, dsccFirmNames };
}
function isOnCrimeRegistry(firmName, registry, sraNumber) {
    const norm = (0, normalize_1.normalizeFirmName)(firmName);
    if (norm && registry.laaFirmNames.has(norm))
        return true;
    if (norm && registry.dsccFirmNames.has(norm))
        return true;
    const sra = sraNumber?.trim();
    if (sra && registry.laaSraNumbers.has(sra))
        return true;
    return false;
}
function hasVerifiedCrimeSource(sources) {
    return sources.some((s) => exports.VERIFIED_CRIME_SOURCES.includes(s));
}
function qualifyProspectForOutreach(prospect, registry) {
    if (prospect.crimeWebsiteVerified) {
        return { qualified: true, reason: 'website_crime_verified' };
    }
    if ((prospect.status === 'excluded' || prospect.excludedReason) &&
        prospect.excludedReason !== 'archive_only_not_on_laa_or_dscc') {
        return { qualified: false, reason: prospect.excludedReason ?? 'excluded' };
    }
    if (prospect.prospectType === 'solicitor') {
        if (prospect.sources.includes('dscc')) {
            return { qualified: true, reason: 'dscc_duty_solicitor' };
        }
        return { qualified: false, reason: 'solicitor_not_on_dscc' };
    }
    if (hasVerifiedCrimeSource(prospect.sources)) {
        return { qualified: true, reason: 'verified_crime_source' };
    }
    if (prospect.sources.includes('archive')) {
        if (registry &&
            isOnCrimeRegistry(prospect.firmName, registry, prospect.regulatoryNumber)) {
            return { qualified: true, reason: 'archive_corroborated_on_crime_registry' };
        }
        return { qualified: false, reason: 'archive_only_not_on_laa_or_dscc' };
    }
    return { qualified: false, reason: 'no_verified_crime_source' };
}
/** Apply outreach qualification when deciding ready_to_send vs discovered. */
function resolveStatusWithQualification(prospect, preferred, registry) {
    if ((prospect.status === 'excluded' || prospect.excludedReason) &&
        !prospect.crimeWebsiteVerified) {
        return 'excluded';
    }
    if (!prospect.email)
        return preferred === 'ready_to_send' ? 'discovered' : preferred;
    if (preferred !== 'ready_to_send')
        return preferred;
    const q = qualifyProspectForOutreach(prospect, registry);
    if (q.qualified)
        return 'ready_to_send';
    return 'discovered';
}
function unqualifiedReason(prospect) {
    return qualifyProspectForOutreach(prospect).reason;
}
