"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerWebhooksForUser = registerWebhooksForUser;
const config_1 = require("../config");
const logger_1 = require("../logger");
const repoRegistration_service_1 = require("./repoRegistration.service");
const githubApi_1 = require("./githubApi");
const TYPING_AGENT_WEBHOOK_EVENTS = ['issues', 'pull_request'];
async function listAdminRepos(accessToken) {
    const repos = [];
    let page = 1;
    while (true) {
        const batch = await (0, githubApi_1.githubApiFetch)(`/user/repos?per_page=100&page=${page}&affiliation=owner,collaborator,organization_member`, accessToken);
        if (batch.length === 0)
            break;
        repos.push(...batch.filter((repo) => repo.permissions?.admin));
        page += 1;
    }
    return repos;
}
async function ensureTypingAgentWebhook(accessToken, owner, repo) {
    const hooks = await (0, githubApi_1.githubApiFetch)(`/repos/${owner}/${repo}/hooks`, accessToken);
    const webhookUrl = config_1.appConfig.github.webhookUrl;
    const existing = hooks.find((hook) => hook.config.url === webhookUrl);
    if (existing) {
        const missingEvents = TYPING_AGENT_WEBHOOK_EVENTS.filter((event) => !existing.events.includes(event));
        if (missingEvents.length === 0)
            return;
        await (0, githubApi_1.githubApiFetch)(`/repos/${owner}/${repo}/hooks/${existing.id}`, accessToken, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                events: [...new Set([...existing.events, ...TYPING_AGENT_WEBHOOK_EVENTS])],
            }),
        });
        logger_1.logger.info(`Updated webhook events on ${owner}/${repo}: ${missingEvents.join(', ')}`);
        return;
    }
    await (0, githubApi_1.githubApiFetch)(`/repos/${owner}/${repo}/hooks`, accessToken, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            name: 'web',
            active: true,
            events: [...TYPING_AGENT_WEBHOOK_EVENTS],
            config: {
                url: webhookUrl,
                content_type: 'json',
                secret: config_1.appConfig.github.webhookSecret,
                insecure_ssl: '0',
            },
        }),
    });
    logger_1.logger.info(`Registered TypingAgent webhook on ${owner}/${repo}`);
}
async function registerWebhooksForUser(accessToken, userId) {
    const repos = await listAdminRepos(accessToken);
    for (const repo of repos) {
        try {
            await ensureTypingAgentWebhook(accessToken, repo.owner.login, repo.name);
            await (0, repoRegistration_service_1.upsertRepoRegistration)(userId, repo.owner.login, repo.name);
        }
        catch (error) {
            (0, logger_1.logError)(`Failed to register webhook for ${repo.owner.login}/${repo.name}`, error);
        }
    }
}
