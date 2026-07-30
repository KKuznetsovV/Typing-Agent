"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.runCodeGenerationAgent = runCodeGenerationAgent;
const openai_connector_1 = require("../../connectors/openai.connector");
const config_1 = require("../../config");
const logger_1 = require("../../logger");
const githubCommit_service_1 = require("../../services/githubCommit.service");
const githubPullRequest_service_1 = require("../../services/githubPullRequest.service");
const repositoryContent_service_1 = require("../../services/repositoryContent.service");
const codeGeneration_schema_1 = require("./codeGeneration.schema");
const agentIdentity_1 = require("../../utils/agentIdentity");
const issueClosing_1 = require("../../utils/issueClosing");
const typingAgentMarkers_1 = require("../../utils/typingAgentMarkers");
const REPOSITORY_FILE_EXCERPT_CHARS = 400;
function excerptContent(content) {
    if (content.length <= REPOSITORY_FILE_EXCERPT_CHARS)
        return content;
    return `${content.slice(0, REPOSITORY_FILE_EXCERPT_CHARS)}… (${content.length} chars total)`;
}
function logLoadedRepositoryFiles(agentName, branchName, repository) {
    const truncationNote = repository.truncated
        ? `; ${repository.skippedCount} additional file(s) omitted`
        : '';
    logger_1.logger.info(`[${agentName}] Loaded ${repository.files.length} file(s) from ${branchName}${truncationNote}`);
    for (const file of repository.files) {
        logger_1.logger.info(`[${agentName}]   - ${file.path}`);
        logger_1.logger.info(excerptContent(file.content));
        logger_1.logger.info(`[${agentName}]   --- end ${file.path} ---`);
    }
}
function buildUserMessage(input, repository) {
    const repositoryNote = repository.truncated
        ? `Repository files (${repository.files.length} included; ${repository.skippedCount} additional files omitted):`
        : `Repository files (${repository.files.length}):`;
    return [
        `Repository: ${input.repoOwner}/${input.repoName}`,
        `Issue number: #${input.issueNumber}`,
        `Issue title: ${input.issueTitle}`,
        `Work branch: ${input.workBranchName}`,
        `Target branch for PRs: ${input.branchName}`,
        'Issue body:',
        input.issueBody || '(empty)',
        '',
        repositoryNote,
        JSON.stringify(repository.files),
    ].join('\n');
}
async function runCodeGenerationAgent(agentName, systemPrompt, schemaName, githubAccessToken, input) {
    const repository = await (0, repositoryContent_service_1.fetchRepositorySnapshot)(githubAccessToken, input.repoOwner, input.repoName, input.workBranchName);
    logLoadedRepositoryFiles(agentName, input.workBranchName, repository);
    const openai = (0, openai_connector_1.getOpenAIClient)();
    const response = await openai.responses.create({
        model: config_1.appConfig.openai.model,
        instructions: systemPrompt,
        input: buildUserMessage(input, repository),
        text: {
            format: {
                type: 'json_schema',
                name: schemaName,
                strict: true,
                schema: codeGeneration_schema_1.CODE_GENERATION_RESPONSE_SCHEMA,
            },
        },
    });
    const responseText = response.output_text;
    if (!responseText)
        throw new Error(`${agentName} received empty response from OpenAI`);
    const parsed = JSON.parse(responseText);
    logger_1.logger.info(`[${agentName}] Commit: ${parsed.commitMessage}`);
    logger_1.logger.info(`[${agentName}] PR title: ${parsed.prTitle}`);
    logger_1.logger.info(`[${agentName}] Generated ${parsed.files.length} file(s)`);
    if (parsed.files.length === 0) {
        logger_1.logger.info(`[${agentName}] No file changes; skipping commit and PR`);
        return { ...parsed, openaiResponseId: response.id };
    }
    const agentIdentity = (0, agentIdentity_1.getAgentGitIdentity)(agentName);
    const agentToken = (0, agentIdentity_1.resolveAgentGithubAccessToken)(agentName, githubAccessToken);
    if (!(0, agentIdentity_1.hasAgentGithubAccessToken)(agentName)) {
        logger_1.logger.warn(`[${agentName}] No agent GitHub token configured; commits will use the user's token`);
    }
    const { commitSha } = await (0, githubCommit_service_1.commitFilesToBranch)(agentToken, input.repoOwner, input.repoName, input.workBranchName, parsed.commitMessage, parsed.files, agentIdentity);
    logger_1.logger.info(`[${agentName}] Committed ${commitSha} to ${input.workBranchName}`);
    const pullRequestBody = (0, issueClosing_1.appendIssueClosingReference)(parsed.prBody, input.issueNumber);
    const pullRequest = await (0, githubPullRequest_service_1.createPullRequest)(agentToken, input.repoOwner, input.repoName, input.workBranchName, input.branchName, (0, typingAgentMarkers_1.formatCodeReviewerPullRequestTitle)(parsed.prTitle), pullRequestBody);
    logger_1.logger.info(`[${agentName}] Opened PR #${pullRequest.number} ` +
        `(${input.workBranchName} -> ${input.branchName}): ${pullRequest.html_url}`);
    return { ...parsed, openaiResponseId: response.id, commitSha, pullRequestUrl: pullRequest.html_url };
}
