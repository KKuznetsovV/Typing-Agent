"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createIssue = createIssue;
exports.closeIssue = closeIssue;
exports.createBranchFromBase = createBranchFromBase;
exports.createFeatureBranch = createFeatureBranch;
exports.getDefaultBranch = getDefaultBranch;
exports.listOpenDevSubIssuesForParent = listOpenDevSubIssuesForParent;
const githubApi_1 = require("./githubApi");
const devSubIssue_1 = require("../utils/devSubIssue");
async function createIssue(accessToken, owner, repo, title, body) {
    return (0, githubApi_1.githubApiFetch)(`/repos/${owner}/${repo}/issues`, accessToken, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, body }),
    });
}
async function closeIssue(accessToken, owner, repo, issueNumber) {
    await (0, githubApi_1.githubApiFetch)(`/repos/${owner}/${repo}/issues/${issueNumber}`, accessToken, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ state: 'closed', state_reason: 'completed' }),
    });
}
async function createBranchFromBase(accessToken, owner, repo, branchName, baseBranchName) {
    const baseRef = await (0, githubApi_1.githubApiFetch)(`/repos/${owner}/${repo}/git/ref/heads/${encodeURIComponent(baseBranchName)}`, accessToken);
    try {
        await (0, githubApi_1.githubApiFetch)(`/repos/${owner}/${repo}/git/refs`, accessToken, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                ref: `refs/heads/${branchName}`,
                sha: baseRef.object.sha,
            }),
        });
    }
    catch (error) {
        if (error instanceof Error &&
            error.message.includes('422') &&
            error.message.includes('Reference already exists')) {
            return;
        }
        throw error;
    }
}
async function createFeatureBranch(accessToken, owner, repo, branchName) {
    const repoDetails = await (0, githubApi_1.githubApiFetch)(`/repos/${owner}/${repo}`, accessToken);
    await createBranchFromBase(accessToken, owner, repo, branchName, repoDetails.default_branch);
}
async function getDefaultBranch(accessToken, owner, repo) {
    const repoDetails = await (0, githubApi_1.githubApiFetch)(`/repos/${owner}/${repo}`, accessToken);
    return repoDetails.default_branch;
}
async function listOpenDevSubIssuesForParent(accessToken, owner, repo, parentIssueNumber, excludeIssueNumbers = []) {
    const excluded = new Set(excludeIssueNumbers);
    const issues = await (0, githubApi_1.githubApiFetch)(`/repos/${owner}/${repo}/issues?state=open&per_page=100`, accessToken);
    return issues.filter((issue) => !excluded.has(issue.number) &&
        !issue.pull_request &&
        (0, devSubIssue_1.isDevAgentSubIssueForParent)(issue.title, issue.body, parentIssueNumber));
}
