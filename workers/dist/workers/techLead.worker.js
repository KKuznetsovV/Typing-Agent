"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createTechLeadWorker = createTechLeadWorker;
const techLead_1 = require("../agents/techLead");
const config_1 = require("../config");
const logger_1 = require("../logger");
const createAgentWorker_1 = require("./createAgentWorker");
const developerWorker_utils_1 = require("./developerWorker.utils");
async function processTechLeadJob(message) {
    const githubAccessToken = await (0, developerWorker_utils_1.resolveGithubAccessToken)(message.userId);
    const result = await (0, techLead_1.runTechLeadAgent)({
        githubAccessToken,
        repoOwner: message.repoOwner,
        repoName: message.repoName,
        issueTitle: message.issueTitle,
        issueBody: message.issueBody,
        parentIssueNumber: message.issueNumber,
    });
    logger_1.logger.info(`[TechLead] Created branch ${result.branchName} and ${result.createdIssues.length} sub-issue(s) ` +
        `for ${message.repoOwner}/${message.repoName} issue #${message.issueNumber}`);
    for (const issue of result.createdIssues) {
        logger_1.logger.info(`[TechLead]   - ${issue.agent}: ${issue.title} (${issue.url})`);
    }
}
function createTechLeadWorker() {
    return (0, createAgentWorker_1.createAgentWorker)({
        workerName: 'TechLead',
        queueName: config_1.appConfig.sqs.queues.techLead,
        processJob: processTechLeadJob,
    });
}
