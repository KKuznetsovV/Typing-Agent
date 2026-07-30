"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.runCodeReviewerAgent = runCodeReviewerAgent;
const openai_connector_1 = require("../../connectors/openai.connector");
const config_1 = require("../../config");
const logger_1 = require("../../logger");
const githubPullRequest_service_1 = require("../../services/githubPullRequest.service");
const github_service_1 = require("../../services/github.service");
const githubPullRequestReview_service_1 = require("../../services/githubPullRequestReview.service");
const branchName_1 = require("../../utils/branchName");
const issueClosing_1 = require("../../utils/issueClosing");
const pullRequestContent_service_1 = require("../../services/pullRequestContent.service");
const agentIdentity_1 = require("../../utils/agentIdentity");
const typingAgentMarkers_1 = require("../../utils/typingAgentMarkers");
const codeReviewer_prompt_1 = require("./codeReviewer.prompt");
const PATCH_EXCERPT_CHARS = 400;
function excerptPatch(patch) {
    if (!patch)
        return '(no patch available)';
    if (patch.length <= PATCH_EXCERPT_CHARS)
        return patch;
    return `${patch.slice(0, PATCH_EXCERPT_CHARS)}… (${patch.length} chars total)`;
}
function buildUserMessage(snapshot) {
    const truncationNote = snapshot.truncated ? `Additional files omitted: ${snapshot.skippedCount}` : null;
    const fileSummaries = snapshot.files.map((f) => ({ path: f.path, status: f.status, patch: f.patch }));
    return [
        `Pull request #${snapshot.number}: ${snapshot.title}`,
        `URL: ${snapshot.htmlUrl}`,
        `Head branch: ${snapshot.headRef}`,
        `Base branch: ${snapshot.baseRef}`,
        'PR description:',
        snapshot.body || '(empty)',
        truncationNote,
        `Changed files (${snapshot.files.length}):`,
        JSON.stringify(fileSummaries, null, 2),
    ]
        .filter(Boolean)
        .join('\n');
}
async function maybeOpenHumanReviewPR(accessToken, input, snapshot, justClosedIssueNumber) {
    const featureBranch = snapshot.baseRef;
    if (!(0, branchName_1.isFeatureBranchName)(featureBranch))
        return;
    const parentIssueNumber = (0, branchName_1.parseFeatureBranchIssueNumber)(featureBranch);
    if (!parentIssueNumber) {
        logger_1.logger.warn(`[CodeReviewer] Could not parse parent issue number from ${featureBranch}; skipping human review PR`);
        return;
    }
    const openDevSubIssues = await (0, github_service_1.listOpenDevSubIssuesForParent)(accessToken, input.repoOwner, input.repoName, parentIssueNumber, justClosedIssueNumber ? [justClosedIssueNumber] : []);
    if (openDevSubIssues.length > 0) {
        logger_1.logger.info(`[CodeReviewer] ${openDevSubIssues.length} open dev sub-issue(s) remain for #${parentIssueNumber}; skipping human review PR`);
        return;
    }
    const defaultBranch = await (0, github_service_1.getDefaultBranch)(accessToken, input.repoOwner, input.repoName);
    if (defaultBranch === featureBranch)
        return;
    const pullRequestBody = [
        `Human-in-the-loop aggregation PR for \`${featureBranch}\`.`,
        '',
        'All TechLead developer sub-issues for the parent task are now closed.',
        `fixes #${parentIssueNumber}`,
    ].join('\n');
    const pullRequest = await (0, githubPullRequest_service_1.createPullRequest)(accessToken, input.repoOwner, input.repoName, featureBranch, defaultBranch, (0, typingAgentMarkers_1.formatHumanReviewPullRequestTitle)(`Human review: merge ${featureBranch} into ${defaultBranch}`), pullRequestBody);
    logger_1.logger.info(`[CodeReviewer] Opened human review PR #${pullRequest.number} (${featureBranch} -> ${defaultBranch}): ${pullRequest.html_url}`);
}
async function runCodeReviewerAgent(githubAccessToken, input) {
    const agentName = 'CodeReviewer';
    const agentToken = (0, agentIdentity_1.resolveAgentGithubAccessToken)(agentName, githubAccessToken);
    const snapshot = await (0, pullRequestContent_service_1.fetchPullRequestSnapshot)(agentToken, input.repoOwner, input.repoName, input.pullRequestNumber);
    logger_1.logger.info(`[${agentName}] Loaded ${snapshot.files.length} changed file(s) from PR #${snapshot.number}`);
    for (const file of snapshot.files) {
        logger_1.logger.info(`[${agentName}]   - ${file.path} (${file.status})`);
        logger_1.logger.info(excerptPatch(file.patch));
    }
    const openai = (0, openai_connector_1.getOpenAIClient)();
    const response = await openai.responses.create({
        model: config_1.appConfig.openai.model,
        instructions: codeReviewer_prompt_1.CODE_REVIEWER_SYSTEM_PROMPT,
        input: buildUserMessage(snapshot),
        text: {
            format: {
                type: 'json_schema',
                name: 'code_reviewer_decision',
                strict: true,
                schema: codeReviewer_prompt_1.CODE_REVIEW_RESPONSE_SCHEMA,
            },
        },
    });
    const responseText = response.output_text;
    if (!responseText)
        throw new Error('CodeReviewer received empty response from OpenAI');
    const parsed = JSON.parse(responseText);
    logger_1.logger.info(`[${agentName}] Decision: ${parsed.decision}`);
    logger_1.logger.info(`[${agentName}] Review body: ${parsed.reviewBody}`);
    if (parsed.decision === 'approve') {
        await (0, githubPullRequestReview_service_1.addPullRequestComment)(agentToken, input.repoOwner, input.repoName, input.pullRequestNumber, `**TypingAgent CodeReviewer — approved**\n\n${parsed.reviewBody}`);
        await (0, githubPullRequestReview_service_1.mergePullRequest)(agentToken, input.repoOwner, input.repoName, input.pullRequestNumber, parsed.mergeCommitTitle.trim() || `Merge PR #${input.pullRequestNumber}`);
        logger_1.logger.info(`[${agentName}] Merged PR #${input.pullRequestNumber} (${snapshot.headRef} -> ${snapshot.baseRef})`);
        const issueToClose = (0, issueClosing_1.parseClosingIssueNumber)(snapshot.body);
        if (issueToClose) {
            await (0, github_service_1.closeIssue)(agentToken, input.repoOwner, input.repoName, issueToClose);
            logger_1.logger.info(`[${agentName}] Closed issue #${issueToClose}`);
        }
        else {
            logger_1.logger.warn(`[${agentName}] No fixes/closes/resolves #N reference in PR body; issue left open`);
        }
        await maybeOpenHumanReviewPR(agentToken, input, snapshot, issueToClose ?? undefined);
        return { decision: 'approve', reviewBody: parsed.reviewBody, merged: true, openaiResponseId: response.id };
    }
    await (0, githubPullRequestReview_service_1.addPullRequestComment)(agentToken, input.repoOwner, input.repoName, input.pullRequestNumber, `**TypingAgent CodeReviewer — changes requested**\n\n${parsed.reviewBody}`);
    logger_1.logger.info(`[${agentName}] Declined PR #${input.pullRequestNumber}`);
    return { decision: 'decline', reviewBody: parsed.reviewBody, merged: false, openaiResponseId: response.id };
}
