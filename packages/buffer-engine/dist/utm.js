"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.appendUtm = appendUtm;
function appendUtm(url, params) {
    try {
        const u = new URL(url);
        u.searchParams.set('utm_source', params.source);
        u.searchParams.set('utm_medium', params.medium);
        u.searchParams.set('utm_campaign', params.campaign);
        if (params.content)
            u.searchParams.set('utm_content', params.content);
        if (params.term)
            u.searchParams.set('utm_term', params.term);
        return u.toString();
    }
    catch {
        return url;
    }
}
