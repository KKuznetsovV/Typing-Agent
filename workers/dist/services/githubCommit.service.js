"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.commitFilesToBranch = commitFilesToBranch;
const githubApi_1 = require("./githubApi");
async function commitFilesToBranch(accessToken, owner, repo, branchName, commitMessage, files, agentIdentity) {
    if (files.length === 0)
        throw new Error('Cannot commit without file changes');
    const branchRef = await (0, githubApi_1.githubApiFetch)(`/repos/${owner}/${repo}/git/ref/heads/${encodeURIComponent(branchName)}`, accessToken);
    const currentCommit = await (0, githubApi_1.githubApiFetch)(`/repos/${owner}/${repo}/git/commits/${branchRef.object.sha}`, accessToken);
    const treeEntries = [];
    for (const file of files) {
        const blob = await (0, githubApi_1.githubApiFetch)(`/repos/${owner}/${repo}/git/blobs`, accessToken, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ content: file.content, encoding: 'utf-8' }),
        });
        treeEntries.push({ path: file.path, mode: '100644', type: 'blob', sha: blob.sha });
    }
    const tree = await (0, githubApi_1.githubApiFetch)(`/repos/${owner}/${repo}/git/trees`, accessToken, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ base_tree: currentCommit.tree.sha, tree: treeEntries }),
    });
    const committedAt = new Date().toISOString();
    const commit = await (0, githubApi_1.githubApiFetch)(`/repos/${owner}/${repo}/git/commits`, accessToken, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            message: commitMessage,
            tree: tree.sha,
            parents: [branchRef.object.sha],
            author: { name: agentIdentity.name, email: agentIdentity.email, date: committedAt },
            committer: { name: agentIdentity.name, email: agentIdentity.email, date: committedAt },
        }),
    });
    await (0, githubApi_1.githubApiFetch)(`/repos/${owner}/${repo}/git/refs/heads/${encodeURIComponent(branchName)}`, accessToken, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sha: commit.sha }),
    });
    return { commitSha: commit.sha };
}
