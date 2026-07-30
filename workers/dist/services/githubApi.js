"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.githubApiFetch = githubApiFetch;
async function githubApiFetch(path, accessToken, options = {}) {
    const response = await fetch(`https://api.github.com${path}`, {
        ...options,
        headers: {
            Accept: 'application/vnd.github+json',
            Authorization: `Bearer ${accessToken}`,
            'X-GitHub-Api-Version': '2022-11-28',
            ...(options.headers ?? {}),
        },
    });
    if (!response.ok) {
        const text = await response.text();
        throw new Error(`GitHub API ${path} failed (${response.status}): ${text}`);
    }
    if (response.status === 204) {
        return undefined;
    }
    return response.json();
}
