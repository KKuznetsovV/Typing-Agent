"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.slugifyIssueTitle = slugifyIssueTitle;
exports.buildFeatureBranchName = buildFeatureBranchName;
exports.isFeatureBranchName = isFeatureBranchName;
exports.parseFeatureBranchIssueNumber = parseFeatureBranchIssueNumber;
exports.buildDeveloperBranchName = buildDeveloperBranchName;
function slugifyIssueTitle(title) {
    const slug = title
        .replace(/\[TypingAgent[^\]]*\]/gi, '')
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .slice(0, 40);
    return slug || 'issue';
}
function buildFeatureBranchName(issueNumber, issueTitle) {
    return `feature-${issueNumber}-${slugifyIssueTitle(issueTitle)}`;
}
function isFeatureBranchName(branchName) {
    return /^feature-\d+-/.test(branchName);
}
function parseFeatureBranchIssueNumber(branchName) {
    const match = branchName.match(/^feature-(\d+)-/);
    if (!match)
        return null;
    const issueNumber = Number(match[1]);
    return Number.isFinite(issueNumber) ? issueNumber : null;
}
function buildDeveloperBranchName(featureBranchName, agentRole, issueNumber) {
    return `${featureBranchName}-${agentRole}-${issueNumber}`;
}
