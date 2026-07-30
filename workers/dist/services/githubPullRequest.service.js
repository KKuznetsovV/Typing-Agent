"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createPullRequest = createPullRequest;
const githubApi_1 = require("./githubApi");
async function createPullRequest(accessToken, owner, repo, headBranch, baseBranch, title, body) {
    try {
        const pr = await (0, githubApi_1.githubApiFetch)(`/repos/${owner}/${repo}/pulls`, accessToken, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ title, body, head: headBranch, base: baseBranch }),
        });
        return { number: pr.number, html_url: pr.html_url };
    }
    catch (error) {
        if (!(error instanceof Error) || !error.message.includes('422'))
            throw error;
        const existing = await findOpenPullRequest(accessToken, owner, repo, headBranch, baseBranch);
        if (existing)
            return existing;
        throw error;
    }
}
async function findOpenPullRequest(accessToken, owner, repo, headBranch, baseBranch) {
    const query = new URLSearchParams({ state: 'open', head: `${owner}:${headBranch}`, base: baseBranch });
    const pulls = await (0, githubApi_1.githubApiFetch)(`/repos/${owner}/${repo}/pulls?${query.toString()}`, accessToken);
    const match = pulls[0];
    return match ? { number: match.number, html_url: match.html_url } : null;
}
