"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.prepareDeveloperAgent = prepareDeveloperAgent;
const logger_1 = require("../../logger");
const github_service_1 = require("../../services/github.service");
const branchName_1 = require("../../utils/branchName");
async function prepareDeveloperAgent(githubAccessToken, agentRole, input) {
    const workBranchName = (0, branchName_1.buildDeveloperBranchName)(input.branchName, agentRole, input.issueNumber);
    await (0, github_service_1.createBranchFromBase)(githubAccessToken, input.repoOwner, input.repoName, workBranchName, input.branchName);
    logger_1.logger.info(`[${agentRole}] Created work branch ${workBranchName} from ${input.branchName}`);
    return { ...input, workBranchName };
}
