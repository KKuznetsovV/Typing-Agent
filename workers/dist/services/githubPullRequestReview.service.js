"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.mergePullRequest = mergePullRequest;
exports.addPullRequestComment = addPullRequestComment;
const githubApi_1 = require("./githubApi");
async function mergePullRequest(accessToken, owner, repo, pullNumber, commitTitle) {
    await (0, githubApi_1.githubApiFetch)(`/repos/${owner}/${repo}/pulls/${pullNumber}/merge`, accessToken, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            merge_method: 'squash',
            ...(commitTitle ? { commit_title: commitTitle } : {}),
        }),
    });
}
async function addPullRequestComment(accessToken, owner, repo, pullNumber, body) {
    await (0, githubApi_1.githubApiFetch)(`/repos/${owner}/${repo}/issues/${pullNumber}/comments`, accessToken, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ body }),
    });
}
