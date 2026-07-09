"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createEmptySkipReasons = createEmptySkipReasons;
exports.bumpSkipReason = bumpSkipReason;
function createEmptySkipReasons() {
    return {};
}
function bumpSkipReason(map, reason) {
    map[reason] = (map[reason] ?? 0) + 1;
}
