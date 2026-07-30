"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.runDevOpsAgent = runDevOpsAgent;
const prepareDeveloperAgent_1 = require("../shared/prepareDeveloperAgent");
const runCodeGenerationAgent_1 = require("../shared/runCodeGenerationAgent");
const devOps_prompt_1 = require("./devOps.prompt");
async function runDevOpsAgent(githubAccessToken, input) {
    const prepared = await (0, prepareDeveloperAgent_1.prepareDeveloperAgent)(githubAccessToken, 'devops', input);
    return (0, runCodeGenerationAgent_1.runCodeGenerationAgent)('DevOps', devOps_prompt_1.DEVOPS_SYSTEM_PROMPT, 'devops_code_generation', githubAccessToken, prepared);
}
