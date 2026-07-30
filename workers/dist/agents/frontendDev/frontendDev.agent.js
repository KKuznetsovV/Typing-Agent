"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.runFrontendDevAgent = runFrontendDevAgent;
const prepareDeveloperAgent_1 = require("../shared/prepareDeveloperAgent");
const runCodeGenerationAgent_1 = require("../shared/runCodeGenerationAgent");
const frontendDev_prompt_1 = require("./frontendDev.prompt");
async function runFrontendDevAgent(githubAccessToken, input) {
    const prepared = await (0, prepareDeveloperAgent_1.prepareDeveloperAgent)(githubAccessToken, 'frontend-dev', input);
    return (0, runCodeGenerationAgent_1.runCodeGenerationAgent)('FrontendDev', frontendDev_prompt_1.FRONTEND_DEV_SYSTEM_PROMPT, 'frontend_dev_code_generation', githubAccessToken, prepared);
}
