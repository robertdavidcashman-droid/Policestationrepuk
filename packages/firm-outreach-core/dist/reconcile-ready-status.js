"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sequenceStepOf = exports.daysSince = void 0;
exports.prospectHasInitialSend = prospectHasInitialSend;
exports.reconcileReadyProspectStatus = reconcileReadyProspectStatus;
exports.isDueForFollowUpStep1 = isDueForFollowUpStep1;
const email_jobs_1 = require("./email-jobs");
Object.defineProperty(exports, "daysSince", { enumerable: true, get: function () { return email_jobs_1.daysSince; } });
Object.defineProperty(exports, "sequenceStepOf", { enumerable: true, get: function () { return email_jobs_1.sequenceStepOf; } });
const validator_1 = require("./enrichment/validator");
/** Whether an initial outreach email was already recorded on this prospect. */
function prospectHasInitialSend(prospect) {
    // Any lastEmailAt on a ready row means the initial send already happened —
    // including legacy rows where sequenceStep is missing/undefined.
    return Boolean(prospect.lastEmailAt);
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
    if ((0, email_jobs_1.sequenceStepOf)(prospect) !== 0 || !prospect.lastEmailAt)
        return false;
    return (0, email_jobs_1.dueForFollowUp)({
        status: prospect.status ?? 'sent',
        sequenceStep: (0, email_jobs_1.sequenceStepOf)(prospect),
        lastEmailAt: prospect.lastEmailAt,
        waLinkClickedAt: prospect.waLinkClickedAt,
        joinedWhatsAppAt: prospect.joinedWhatsAppAt,
    });
}
