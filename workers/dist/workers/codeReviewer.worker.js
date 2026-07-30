"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createCodeReviewerWorker = createCodeReviewerWorker;
const codeReviewer_1 = require("../agents/codeReviewer");
const config_1 = require("../config");
const logger_1 = require("../logger");
const createAgentWorker_1 = require("./createAgentWorker");
const developerWorker_utils_1 = require("./developerWorker.utils");
async function processCodeReviewJob(message) {
    const githubAccessToken = await (0, developerWorker_utils_1.resolveGithubAccessToken)(message.userId);
    const result = await (0, codeReviewer_1.runCodeReviewerAgent)(githubAccessToken, message);
    logger_1.logger.info(`[CodeReviewer] Decision: ${result.decision} for ` +
        `${message.repoOwner}/${message.repoName} PR #${message.pullRequestNumber}`);
}
function createCodeReviewerWorker() {
    return (0, createAgentWorker_1.createAgentWorker)({
        workerName: 'CodeReviewer',
        queueName: config_1.appConfig.sqs.queues.codeReviewer,
        processJob: processCodeReviewJob,
        describeJob: (m) => `${m.repoOwner}/${m.repoName} PR #${m.pullRequestNumber}`,
    });
}
