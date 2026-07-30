"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseClosingIssueNumber = parseClosingIssueNumber;
exports.appendIssueClosingReference = appendIssueClosingReference;
const CLOSING_KEYWORD_PATTERN = /\b(?:fixes|closes|resolves)\s+#(\d+)\b/i;
function parseClosingIssueNumber(text) {
    const match = text.match(CLOSING_KEYWORD_PATTERN);
    if (!match)
        return null;
    const issueNumber = Number(match[1]);
    return Number.isFinite(issueNumber) ? issueNumber : null;
}
function appendIssueClosingReference(body, issueNumber) {
    if (new RegExp(`\\b(?:fixes|closes|resolves)\\s+#${issueNumber}\\b`, 'i').test(body)) {
        return body;
    }
    const trimmed = body.trimEnd();
    return trimmed ? `${trimmed}\n\nfixes #${issueNumber}` : `fixes #${issueNumber}`;
}
