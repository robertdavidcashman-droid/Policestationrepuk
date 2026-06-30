"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NON_EW_POSTCODE_PREFIXES = exports.COMPETITOR_KEYWORDS = exports.CRIMINAL_KEYWORDS = exports.EXCLUDED_FIRM_PATTERNS = exports.NON_FIRM_EMAIL_DOMAINS = exports.OPERATOR_OUTREACH_EMAILS = exports.FREE_EMAIL_DOMAINS = exports.PREFERRED_EMAIL_LOCALS = exports.REJECTED_EMAIL_LOCALS = exports.CONTACT_PATHS = void 0;
exports.createOutreachEnvHelpers = createOutreachEnvHelpers;
exports.CONTACT_PATHS = [
    '/',
    '/contact',
    '/contact-us',
    '/about',
    '/about-us',
    '/criminal-law',
    '/police-station',
    '/criminal-defence',
];
exports.REJECTED_EMAIL_LOCALS = new Set([
    'noreply',
    'no-reply',
    'donotreply',
    'careers',
    'recruitment',
    'jobs',
    'privacy',
    'gdpr',
    'accounts',
    'addressaccounts',
    'billing',
    'newsletter',
    'marketing',
]);
exports.PREFERRED_EMAIL_LOCALS = {
    police: 30,
    custody: 30,
    crime: 30,
    criminal: 30,
    duty: 30,
    stations: 30,
    station: 25,
    info: 20,
    enquiries: 20,
    enquiry: 20,
    reception: 20,
    contact: 20,
    admin: 15,
    office: 15,
};
exports.FREE_EMAIL_DOMAINS = new Set([
    'gmail.com',
    'googlemail.com',
    'hotmail.com',
    'hotmail.co.uk',
    'outlook.com',
    'live.com',
    'live.co.uk',
    'msn.com',
    'yahoo.com',
    'yahoo.co.uk',
    'icloud.com',
    'me.com',
    'mac.com',
    'aol.com',
    'aol.co.uk',
    'mail.com',
    'gmx.com',
    'gmx.co.uk',
    'protonmail.com',
    'proton.me',
    // UK ISP mailboxes commonly used by small firms — legitimate, not off-domain
    'btconnect.com',
    'btinternet.com',
    'btopenworld.com',
    'talktalk.net',
    'tiscali.co.uk',
    'sky.com',
    'virginmedia.com',
    'ntlworld.com',
    'blueyonder.co.uk',
]);
/** Operator inboxes — must never be selected as a firm/solicitor outreach target. */
exports.OPERATOR_OUTREACH_EMAILS = new Set([
    'robertdavidcashman@gmail.com',
    'robertcashman@defencelegalservices.co.uk',
]);
/**
 * Registrable domains that appear in firm website footers, badges, widgets,
 * directories, review sites, CDNs and analytics — never a firm's own contact
 * address. Crawled emails on these are rejected outright so we don't outreach
 * to e.g. support@crunchbase.com or contact@thegoodsolicitorguide.com.
 */
exports.NON_FIRM_EMAIL_DOMAINS = new Set([
    // Legal directories / review / lead-gen sites
    'thegoodsolicitorguide.com',
    'threebestrated.co.uk',
    'reviewsolicitors.co.uk',
    'review-solicitors.co.uk',
    'solicitors.co.uk',
    'yell.com',
    'yelp.com',
    'trustpilot.com',
    'feefo.com',
    'legaladvice2u.co.uk',
    'crunchbase.com',
    'clutch.co',
    // Regulators / ombudsman / professional bodies (appear in firm footers)
    'legalombudsman.org.uk',
    'sra.org.uk',
    'lawsociety.org.uk',
    // PR / marketing / font foundries seen in crawled pages
    'inkedpr.com',
    'indiantypefoundry.com',
    // Site builders / hosting / CDNs / analytics / fonts
    'wix.com',
    'wixpress.com',
    'squarespace.com',
    'wordpress.com',
    'automattic.com',
    'godaddy.com',
    'cloudflare.com',
    'sentry.io',
    'latofonts.com',
    'fontawesome.com',
    'googleapis.com',
    'gstatic.com',
    'google.com',
    'gravatar.com',
    'schema.org',
    'w3.org',
    'sentry.wixpress.com',
    // Generic placeholders
    'example.com',
    'example.org',
    'domain.com',
    'email.com',
    'yourdomain.com',
    'mysite.com',
    'yoursite.com',
    'sentry-next.wixpress.com',
    // Directory / listing / scraper hosts (crawler picks up crime@ on wrong domain)
    'tiktok.com',
    'endole.co.uk',
    'expertini.com',
    'getsurrey.co.uk',
    'smenews.digital',
    'wheree.com',
    'cylex-uk.co.uk',
    'rocketreach.co',
    'leadquest.co.uk',
    'legal-pages.co.uk',
    '192.com',
    'findsolicitor.co.uk',
    'criminaljusticehub.org.uk',
    'docsity.com',
]);
exports.EXCLUDED_FIRM_PATTERNS = [
    /public defender service/i,
    /^pds\b/i,
    /crown prosecution/i,
    /^cps\b/i,
];
exports.CRIMINAL_KEYWORDS = [
    'police station',
    'custody',
    'criminal defence',
    'criminal defense',
    'duty solicitor',
    'legal aid crime',
    'crime department',
];
exports.COMPETITOR_KEYWORDS = [
    'police station agency',
    'cover agency',
    'rep agency',
];
/** Scotland, NI, IoM, Channel Islands — not England & Wales. */
exports.NON_EW_POSTCODE_PREFIXES = [
    'AB',
    'BT',
    'DD',
    'DG',
    'EH',
    'FK',
    'G',
    'GY',
    'HS',
    'IM',
    'IV',
    'JE',
    'KA',
    'KW',
    'KY',
    'ML',
    'PA',
    'PH',
    'TD',
    'ZE',
];
function createOutreachEnvHelpers(defaults = {}) {
    const countyDefault = defaults.countyAllowlist;
    return {
        outreachEnabled() {
            return process.env.FIRM_OUTREACH_ENABLED !== 'false';
        },
        outreachPaused() {
            return process.env.FIRM_OUTREACH_PAUSED === 'true';
        },
        outreachSendEnabled() {
            return (process.env.FIRM_OUTREACH_ENABLED !== 'false' &&
                process.env.FIRM_OUTREACH_SEND_ENABLED !== 'false' &&
                process.env.FIRM_OUTREACH_PAUSED !== 'true');
        },
        outreachRequireApproval() {
            return process.env.FIRM_OUTREACH_REQUIRE_APPROVAL !== 'false';
        },
        dailySendCap() {
            return Number(process.env.FIRM_OUTREACH_DAILY_CAP ?? defaults.dailyCap ?? 50) || 50;
        },
        enrichBatchSize() {
            return Number(process.env.FIRM_OUTREACH_ENRICH_BATCH ?? defaults.enrichBatch ?? 150) || 150;
        },
        cronEnrichBatchSize() {
            return (Number(process.env.FIRM_OUTREACH_CRON_ENRICH_BATCH ?? defaults.cronEnrichBatch ?? 10) || 10);
        },
        enrichMaxElapsedMs() {
            return (Number(process.env.FIRM_OUTREACH_ENRICH_MAX_MS ?? defaults.enrichMaxMs ?? 90000) || 90000);
        },
        paidDailyCap() {
            return Number(process.env.FIRM_OUTREACH_PAID_DAILY_CAP ?? defaults.paidDailyCap ?? 50) || 50;
        },
        countyAllowlist() {
            const raw = process.env.FIRM_OUTREACH_COUNTY_ALLOWLIST?.trim();
            if (!raw)
                return countyDefault ?? null;
            return raw
                .split(/[,;]/)
                .map((s) => s.trim().toLowerCase())
                .filter(Boolean);
        },
    };
}
