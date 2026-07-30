"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAgentGitIdentity = getAgentGitIdentity;
exports.resolveAgentGithubAccessToken = resolveAgentGithubAccessToken;
exports.hasAgentGithubAccessToken = hasAgentGithubAccessToken;
const config_1 = require("../config");
const AGENT_NAME_TO_CONFIG_KEY = {
    BackendDev: 'backendDev',
    FrontendDev: 'frontendDev',
    DevOps: 'devOps',
    CodeReviewer: 'codeReviewer',
};
function toAgentSlug(agentName) {
    return agentName.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();
}
function getAgentConfigKey(agentName) {
    return AGENT_NAME_TO_CONFIG_KEY[agentName];
}
function getAgentGitIdentity(agentName) {
    const key = getAgentConfigKey(agentName);
    const agentConfig = key ? config_1.appConfig.github.agents[key] : undefined;
    return {
        name: agentConfig?.name || `TypingAgent-${agentName}`,
        email: agentConfig?.email || `${toAgentSlug(agentName)}@typing-agent.local`,
    };
}
function resolveAgentGithubAccessToken(agentName, userAccessToken) {
    const key = getAgentConfigKey(agentName);
    const agentToken = key ? config_1.appConfig.github.agents[key].accessToken : '';
    return agentToken || userAccessToken;
}
function hasAgentGithubAccessToken(agentName) {
    const key = getAgentConfigKey(agentName);
    if (!key)
        return false;
    return Boolean(config_1.appConfig.github.agents[key].accessToken);
}
