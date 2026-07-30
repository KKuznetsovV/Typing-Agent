"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolveGithubAccessToken = resolveGithubAccessToken;
exports.requireFeatureBranch = requireFeatureBranch;
const authClient_service_1 = require("../services/authClient.service");
async function resolveGithubAccessToken(userId) {
    const user = await (0, authClient_service_1.fetchUserById)(userId);
    if (!user?.githubAccessToken) {
        throw new Error(`GitHub access token not found for user ${userId}`);
    }
    return user.githubAccessToken;
}
function requireFeatureBranch(message) {
    if (!message.branchName) {
        throw new Error(`Job for issue "${message.issueTitle}" is missing branchName`);
    }
    return message.branchName;
}
