"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.fetchPullRequestSnapshot = fetchPullRequestSnapshot;
const githubApi_1 = require("./githubApi");
const MAX_PATCH_CHARS = 8_000;
const MAX_FILES = 100;
function truncatePatch(patch) {
    if (!patch)
        return null;
    if (patch.length <= MAX_PATCH_CHARS)
        return patch;
    return `${patch.slice(0, MAX_PATCH_CHARS)}… (${patch.length} chars total)`;
}
async function fetchPullRequestSnapshot(accessToken, owner, repo, pullNumber) {
    const pr = await (0, githubApi_1.githubApiFetch)(`/repos/${owner}/${repo}/pulls/${pullNumber}`, accessToken);
    const rawFiles = await (0, githubApi_1.githubApiFetch)(`/repos/${owner}/${repo}/pulls/${pullNumber}/files?per_page=${MAX_FILES}`, accessToken);
    const files = [];
    let skippedCount = 0;
    for (const file of rawFiles) {
        if (files.length >= MAX_FILES) {
            skippedCount++;
            continue;
        }
        files.push({ path: file.filename, status: file.status, patch: truncatePatch(file.patch) });
    }
    return {
        number: pr.number,
        title: pr.title,
        body: pr.body ?? '',
        headRef: pr.head.ref,
        baseRef: pr.base.ref,
        headSha: pr.head.sha,
        htmlUrl: pr.html_url,
        files,
        truncated: rawFiles.length > MAX_FILES,
        skippedCount,
    };
}
