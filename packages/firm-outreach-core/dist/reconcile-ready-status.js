"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.prospectHasInitialSend = prospectHasInitialSend;
exports.reconcileReadyProspectStatus = reconcileReadyProspectStatus;
exports.isDueForFollowUpStep1 = isDueForFollowUpStep1;
const validator_1 = require("./enrichment/validator");
const FOLLOWUP_DAY_1 = 7;
function daysSince(iso) {
    if (!iso)
        return Infinity;
    return (Date.now() - Date.parse(iso)) / (1000 * 60 * 60 * 24);
}
/** Whether an initial outreach email was already recorded on this prospect. */
function prospectHasInitialSend(prospect) {
    return Boolean(prospect.lastEmailAt) && prospect.sequenceStep === 0;
}
/**
 * ready_to_send + lastEmailAt is a stale index state: the initial send already happened
 * but status was not moved to sent. That blocks the morning cron from picking new firms.
 */
function reconcileReadyProspectStatus(prospect) {
    if (prospect.status !== 'ready_to_send')
        return null;
    if (prospectHasInitialSend(prospect)) {
        return 'sent';
    }
    const email = prospect.email?.trim();
    if (email && !(0, validator_1.isPlausibleOutreachEmail)(email)) {
        return 'discovered';
    }
    return null;
}
/** True when a sent prospect is due for follow-up step 1 (day 7). */
function isDueForFollowUpStep1(prospect) {
    if (prospect.waLinkClickedAt || prospect.joinedWhatsAppAt)
        return false;
    if (prospect.sequenceStep !== 0 || !prospect.lastEmailAt)
        return false;
    return daysSince(prospect.lastEmailAt) >= FOLLOWUP_DAY_1;
}
