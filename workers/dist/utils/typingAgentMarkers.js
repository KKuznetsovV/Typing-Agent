"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HUMAN_REVIEW_PR_TITLE_MARKER = exports.CODE_REVIEWER_PR_TITLE_MARKER = void 0;
exports.formatCodeReviewerPullRequestTitle = formatCodeReviewerPullRequestTitle;
exports.isCodeReviewerPullRequestTitle = isCodeReviewerPullRequestTitle;
exports.formatHumanReviewPullRequestTitle = formatHumanReviewPullRequestTitle;
exports.CODE_REVIEWER_PR_TITLE_MARKER = '[TypingAgent-CodeReviewer]';
exports.HUMAN_REVIEW_PR_TITLE_MARKER = '[TypingAgent]';
function formatCodeReviewerPullRequestTitle(title) {
    if (/\[TypingAgent-CodeReviewer\]/i.test(title))
        return title;
    return `${exports.CODE_REVIEWER_PR_TITLE_MARKER} ${title}`;
}
function isCodeReviewerPullRequestTitle(title) {
    return /\[TypingAgent-CodeReviewer\]/i.test(title);
}
function formatHumanReviewPullRequestTitle(title) {
    if (/\[TypingAgent\]/i.test(title))
        return title;
    return `${exports.HUMAN_REVIEW_PR_TITLE_MARKER} ${title}`;
}
