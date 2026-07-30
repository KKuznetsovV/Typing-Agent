"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.runBackendDevAgent = runBackendDevAgent;
const prepareDeveloperAgent_1 = require("../shared/prepareDeveloperAgent");
const runCodeGenerationAgent_1 = require("../shared/runCodeGenerationAgent");
const backendDev_prompt_1 = require("./backendDev.prompt");
async function runBackendDevAgent(githubAccessToken, input) {
    const prepared = await (0, prepareDeveloperAgent_1.prepareDeveloperAgent)(githubAccessToken, 'backend-dev', input);
    return (0, runCodeGenerationAgent_1.runCodeGenerationAgent)('BackendDev', backendDev_prompt_1.BACKEND_DEV_SYSTEM_PROMPT, 'backend_dev_code_generation', githubAccessToken, prepared);
}
