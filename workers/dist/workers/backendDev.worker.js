"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createBackendDevWorker = createBackendDevWorker;
const backendDev_1 = require("../agents/backendDev");
const config_1 = require("../config");
const logger_1 = require("../logger");
const createAgentWorker_1 = require("./createAgentWorker");
const developerWorker_utils_1 = require("./developerWorker.utils");
async function processBackendDevJob(message) {
    const githubAccessToken = await (0, developerWorker_utils_1.resolveGithubAccessToken)(message.userId);
    const branchName = (0, developerWorker_utils_1.requireFeatureBranch)(message);
    const result = await (0, backendDev_1.runBackendDevAgent)(githubAccessToken, {
        userId: message.userId,
        repoOwner: message.repoOwner,
        repoName: message.repoName,
        issueNumber: message.issueNumber,
        issueTitle: message.issueTitle,
        issueBody: message.issueBody,
        branchName,
    });
    logger_1.logger.info(`[BackendDev] Completed for ${message.repoOwner}/${message.repoName} issue #${message.issueNumber}` +
        (result.pullRequestUrl ? `: PR at ${result.pullRequestUrl}` : ' (no files changed)'));
}
function createBackendDevWorker() {
    return (0, createAgentWorker_1.createAgentWorker)({
        workerName: 'BackendDev',
        queueName: config_1.appConfig.sqs.queues.backendDev,
        processJob: processBackendDevJob,
    });
}
