import { getOpenAIClient } from '../../connectors/openai.connector';
import { appConfig } from '../../config';
import { logger } from '../../logger';
import { commitFilesToBranch } from '../../services/githubCommit.service';
import { createPullRequest } from '../../services/githubPullRequest.service';
import { fetchRepositorySnapshot } from '../../services/repositoryContent.service';
import { RepositorySnapshot } from '../../types/repository.types';
import {
  CODE_GENERATION_RESPONSE_SCHEMA,
  CodeGenerationResult,
  GeneratedCodeFile,
} from './codeGeneration.schema';
import { DeveloperAgentInput } from './developerAgent.types';
import {
  getAgentGitIdentity,
  hasAgentGithubAccessToken,
  resolveAgentGithubAccessToken,
} from '../../utils/agentIdentity';
import { appendIssueClosingReference } from '../../utils/issueClosing';
import { formatCodeReviewerPullRequestTitle } from '../../utils/typingAgentMarkers';

const REPOSITORY_FILE_EXCERPT_CHARS = 400;

function excerptContent(content: string): string {
  if (content.length <= REPOSITORY_FILE_EXCERPT_CHARS) return content;
  return `${content.slice(0, REPOSITORY_FILE_EXCERPT_CHARS)}… (${content.length} chars total)`;
}

function logLoadedRepositoryFiles(
  agentName: string,
  branchName: string,
  repository: RepositorySnapshot
): void {
  const truncationNote = repository.truncated
    ? `; ${repository.skippedCount} additional file(s) omitted`
    : '';
  logger.info(
    `[${agentName}] Loaded ${repository.files.length} file(s) from ${branchName}${truncationNote}`
  );
  for (const file of repository.files) {
    logger.info(`[${agentName}]   - ${file.path}`);
    logger.info(excerptContent(file.content));
    logger.info(`[${agentName}]   --- end ${file.path} ---`);
  }
}

function buildUserMessage(input: DeveloperAgentInput, repository: RepositorySnapshot): string {
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

export async function runCodeGenerationAgent(
  agentName: string,
  systemPrompt: string,
  schemaName: string,
  githubAccessToken: string,
  input: DeveloperAgentInput
): Promise<CodeGenerationResult> {
  const repository = await fetchRepositorySnapshot(
    githubAccessToken,
    input.repoOwner,
    input.repoName,
    input.workBranchName
  );

  logLoadedRepositoryFiles(agentName, input.workBranchName, repository);

  const openai = getOpenAIClient();
  const response = await openai.responses.create({
    model: appConfig.openai.model,
    instructions: systemPrompt,
    input: buildUserMessage(input, repository),
    text: {
      format: {
        type: 'json_schema',
        name: schemaName,
        strict: true,
        schema: CODE_GENERATION_RESPONSE_SCHEMA,
      },
    },
  });

  const responseText = response.output_text;
  if (!responseText) throw new Error(`${agentName} received empty response from OpenAI`);

  const parsed = JSON.parse(responseText) as {
    commitMessage: string;
    prTitle: string;
    prBody: string;
    files: GeneratedCodeFile[];
  };

  logger.info(`[${agentName}] Commit: ${parsed.commitMessage}`);
  logger.info(`[${agentName}] PR title: ${parsed.prTitle}`);
  logger.info(`[${agentName}] Generated ${parsed.files.length} file(s)`);

  if (parsed.files.length === 0) {
    logger.info(`[${agentName}] No file changes; skipping commit and PR`);
    return { ...parsed, openaiResponseId: response.id };
  }

  const agentIdentity = getAgentGitIdentity(agentName);
  const agentToken = resolveAgentGithubAccessToken(agentName, githubAccessToken);

  if (!hasAgentGithubAccessToken(agentName)) {
    logger.warn(
      `[${agentName}] No agent GitHub token configured; commits will use the user's token`
    );
  }

  const { commitSha } = await commitFilesToBranch(
    agentToken,
    input.repoOwner,
    input.repoName,
    input.workBranchName,
    parsed.commitMessage,
    parsed.files,
    agentIdentity
  );

  logger.info(`[${agentName}] Committed ${commitSha} to ${input.workBranchName}`);

  const pullRequestBody = appendIssueClosingReference(parsed.prBody, input.issueNumber);

  const pullRequest = await createPullRequest(
    agentToken,
    input.repoOwner,
    input.repoName,
    input.workBranchName,
    input.branchName,
    formatCodeReviewerPullRequestTitle(parsed.prTitle),
    pullRequestBody
  );

  logger.info(
    `[${agentName}] Opened PR #${pullRequest.number} ` +
      `(${input.workBranchName} -> ${input.branchName}): ${pullRequest.html_url}`
  );

  return { ...parsed, openaiResponseId: response.id, commitSha, pullRequestUrl: pullRequest.html_url };
}
