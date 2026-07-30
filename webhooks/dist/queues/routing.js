"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolveTypingAgentRoute = resolveTypingAgentRoute;
exports.isCodeReviewerPullRequestTitle = isCodeReviewerPullRequestTitle;
/** Maps issue title markers to their target agent queue. */
function resolveTypingAgentRoute(title) {
    if (/\[TypingAgent-BackendDev\]/i.test(title))
        return 'backendDev';
    if (/\[TypingAgent-FrontendDev\]/i.test(title))
        return 'frontendDev';
    if (/\[TypingAgent-DevOps\]/i.test(title))
        return 'devOps';
    if (/\[TypingAgent\]/.test(title))
        return 'techLead';
    return null;
}
function isCodeReviewerPullRequestTitle(title) {
    return /\[TypingAgent-CodeReviewer\]/i.test(title);
}
