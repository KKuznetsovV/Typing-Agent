"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleGithubWebhook = handleGithubWebhook;
const logger_1 = require("../logger");
const enqueueAgentJob_1 = require("../queues/enqueueAgentJob");
const enqueueCodeReviewJob_1 = require("../queues/enqueueCodeReviewJob");
const routing_1 = require("../queues/routing");
const issueBody_1 = require("../utils/issueBody");
const authClient_service_1 = require("../services/authClient.service");
async function handlePullRequestEvent(payload, res) {
    if (payload.action !== 'opened' || !payload.pull_request || !payload.repository) {
        return false;
    }
    const { pull_request: pr, repository } = payload;
    if (!(0, routing_1.isCodeReviewerPullRequestTitle)(pr.title)) {
        logger_1.logger.info('Ignoring PR without CodeReviewer marker', { title: pr.title });
        res.status(200).send('OK');
        return true;
    }
    logger_1.logger.info('[webhook] TypingAgent code review PR', { title: pr.title });
    const userId = await (0, authClient_service_1.fetchUserIdByRepo)(repository.owner.login, repository.name);
    if (!userId) {
        logger_1.logger.warn('No registered user found for repository', {
            repoOwner: repository.owner.login,
            repoName: repository.name,
        });
        res.status(200).send('OK');
        return true;
    }
    await (0, enqueueCodeReviewJob_1.enqueueCodeReviewJob)({
        userId,
        repoOwner: repository.owner.login,
        repoName: repository.name,
        pullRequestNumber: pr.number,
        pullRequestTitle: pr.title,
        pullRequestBody: pr.body ?? '',
        headBranch: pr.head.ref,
        baseBranch: pr.base.ref,
    });
    res.status(200).send('OK');
    return true;
}
async function handleGithubWebhook(req, res) {
    const event = req.get('x-github-event');
    const rawPayload = JSON.parse(req.body.toString());
    if (event === 'ping') {
        res.status(200).json({ message: 'pong' });
        return;
    }
    if (event === 'pull_request') {
        const handled = await handlePullRequestEvent(rawPayload, res);
        if (handled)
            return;
    }
    if (event !== 'issues') {
        res.status(200).send('OK');
        return;
    }
    const payload = rawPayload;
    if (payload.action !== 'opened' || !payload.issue || !payload.repository) {
        res.status(200).send('OK');
        return;
    }
    const { issue, repository } = payload;
    const route = (0, routing_1.resolveTypingAgentRoute)(issue.title);
    if (!route) {
        logger_1.logger.info('Ignoring irrelevant issue', { title: issue.title });
        res.status(200).send('OK');
        return;
    }
    logger_1.logger.info(`[webhook] TypingAgent issue (${route})`, { title: issue.title });
    const userId = await (0, authClient_service_1.fetchUserIdByRepo)(repository.owner.login, repository.name);
    if (!userId) {
        logger_1.logger.warn('No registered user found for repository', {
            repoOwner: repository.owner.login,
            repoName: repository.name,
        });
        res.status(200).send('OK');
        return;
    }
    let branchName;
    if (route !== 'techLead') {
        const parsed = (0, issueBody_1.parseTargetBranchFromIssueBody)(issue.body ?? '');
        if (!parsed) {
            logger_1.logger.error('[webhook] No target branch in sub-agent issue body', {
                route,
                issueNumber: issue.number,
            });
            res.status(200).send('OK');
            return;
        }
        branchName = parsed;
    }
    try {
        await (0, enqueueAgentJob_1.enqueueAgentJob)(route, {
            userId,
            repoOwner: repository.owner.login,
            repoName: repository.name,
            issueNumber: issue.number,
            issueTitle: issue.title,
            issueBody: issue.body ?? '',
            branchName,
        });
    }
    catch (error) {
        (0, logger_1.logError)(`Failed to enqueue ${route} job`, error);
        res.status(500).json({ message: 'Failed to enqueue job' });
        return;
    }
    res.status(200).send('OK');
}
