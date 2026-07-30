"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createFrontendDevWorker = createFrontendDevWorker;
const frontendDev_1 = require("../agents/frontendDev");
const config_1 = require("../config");
const logger_1 = require("../logger");
const createAgentWorker_1 = require("./createAgentWorker");
const developerWorker_utils_1 = require("./developerWorker.utils");
async function processFrontendDevJob(message) {
    const githubAccessToken = await (0, developerWorker_utils_1.resolveGithubAccessToken)(message.userId);
    const branchName = (0, developerWorker_utils_1.requireFeatureBranch)(message);
    const result = await (0, frontendDev_1.runFrontendDevAgent)(githubAccessToken, {
        userId: message.userId,
        repoOwner: message.repoOwner,
        repoName: message.repoName,
        issueNumber: message.issueNumber,
        issueTitle: message.issueTitle,
        issueBody: message.issueBody,
        branchName,
    });
    logger_1.logger.info(`[FrontendDev] Completed for ${message.repoOwner}/${message.repoName} issue #${message.issueNumber}` +
        (result.pullRequestUrl ? `: PR at ${result.pullRequestUrl}` : ' (no files changed)'));
}
function createFrontendDevWorker() {
    return (0, createAgentWorker_1.createAgentWorker)({
        workerName: 'FrontendDev',
        queueName: config_1.appConfig.sqs.queues.frontendDev,
        processJob: processFrontendDevJob,
    });
}
