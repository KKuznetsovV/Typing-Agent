import { getOpenAIClient } from '../../connectors/openai.connector';
import { appConfig } from '../../config';
import { logger } from '../../logger';
import { CodeReviewJobMessage } from '../../queues/codeReviewJob.types';
import { createPullRequest } from '../../services/githubPullRequest.service';
import {
  closeIssue,
  getDefaultBranch,
  listOpenDevSubIssuesForParent,
} from '../../services/github.service';
import {
  addPullRequestComment,
  mergePullRequest,
} from '../../services/githubPullRequestReview.service';
import {
  parseFeatureBranchIssueNumber,
  isFeatureBranchName,
} from '../../utils/branchName';
import { parseClosingIssueNumber } from '../../utils/issueClosing';
import { fetchPullRequestSnapshot } from '../../services/pullRequestContent.service';
import { PullRequestSnapshot } from '../../types/pullRequest.types';
import { resolveAgentGithubAccessToken } from '../../utils/agentIdentity';
import { formatHumanReviewPullRequestTitle } from '../../utils/typingAgentMarkers';
import {
  CODE_REVIEW_RESPONSE_SCHEMA,
  CODE_REVIEWER_SYSTEM_PROMPT,
  CodeReviewAgentResult,
  CodeReviewDecision,
} from './codeReviewer.prompt';

const PATCH_EXCERPT_CHARS = 400;

function excerptPatch(patch: string | null): string {
  if (!patch) return '(no patch available)';
  if (patch.length <= PATCH_EXCERPT_CHARS) return patch;
  return `${patch.slice(0, PATCH_EXCERPT_CHARS)}… (${patch.length} chars total)`;
}

function buildUserMessage(snapshot: PullRequestSnapshot): string {
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

async function maybeOpenHumanReviewPR(
  accessToken: string,
  input: CodeReviewJobMessage,
  snapshot: PullRequestSnapshot,
  justClosedIssueNumber?: number
): Promise<void> {
  const featureBranch = snapshot.baseRef;
  if (!isFeatureBranchName(featureBranch)) return;

  const parentIssueNumber = parseFeatureBranchIssueNumber(featureBranch);
  if (!parentIssueNumber) {
    logger.warn(`[CodeReviewer] Could not parse parent issue number from ${featureBranch}; skipping human review PR`);
    return;
  }

  const openDevSubIssues = await listOpenDevSubIssuesForParent(
    accessToken,
    input.repoOwner,
    input.repoName,
    parentIssueNumber,
    justClosedIssueNumber ? [justClosedIssueNumber] : []
  );

  if (openDevSubIssues.length > 0) {
    logger.info(
      `[CodeReviewer] ${openDevSubIssues.length} open dev sub-issue(s) remain for #${parentIssueNumber}; skipping human review PR`
    );
    return;
  }

  const defaultBranch = await getDefaultBranch(accessToken, input.repoOwner, input.repoName);
  if (defaultBranch === featureBranch) return;

  const pullRequestBody = [
    `Human-in-the-loop aggregation PR for \`${featureBranch}\`.`,
    '',
    'All TechLead developer sub-issues for the parent task are now closed.',
    `fixes #${parentIssueNumber}`,
  ].join('\n');

  const pullRequest = await createPullRequest(
    accessToken,
    input.repoOwner,
    input.repoName,
    featureBranch,
    defaultBranch,
    formatHumanReviewPullRequestTitle(`Human review: merge ${featureBranch} into ${defaultBranch}`),
    pullRequestBody
  );

  logger.info(
    `[CodeReviewer] Opened human review PR #${pullRequest.number} (${featureBranch} -> ${defaultBranch}): ${pullRequest.html_url}`
  );
}

export async function runCodeReviewerAgent(
  githubAccessToken: string,
  input: CodeReviewJobMessage
): Promise<CodeReviewAgentResult> {
  const agentName = 'CodeReviewer';
  const agentToken = resolveAgentGithubAccessToken(agentName, githubAccessToken);

  const snapshot = await fetchPullRequestSnapshot(
    agentToken,
    input.repoOwner,
    input.repoName,
    input.pullRequestNumber
  );

  logger.info(`[${agentName}] Loaded ${snapshot.files.length} changed file(s) from PR #${snapshot.number}`);
  for (const file of snapshot.files) {
    logger.info(`[${agentName}]   - ${file.path} (${file.status})`);
    logger.info(excerptPatch(file.patch));
  }

  const openai = getOpenAIClient();
  const response = await openai.responses.create({
    model: appConfig.openai.model,
    instructions: CODE_REVIEWER_SYSTEM_PROMPT,
    input: buildUserMessage(snapshot),
    text: {
      format: {
        type: 'json_schema',
        name: 'code_reviewer_decision',
        strict: true,
        schema: CODE_REVIEW_RESPONSE_SCHEMA,
      },
    },
  });

  const responseText = response.output_text;
  if (!responseText) throw new Error('CodeReviewer received empty response from OpenAI');

  const parsed = JSON.parse(responseText) as CodeReviewDecision;
  logger.info(`[${agentName}] Decision: ${parsed.decision}`);
  logger.info(`[${agentName}] Review body: ${parsed.reviewBody}`);

  if (parsed.decision === 'approve') {
    await addPullRequestComment(
      agentToken,
      input.repoOwner,
      input.repoName,
      input.pullRequestNumber,
      `**TypingAgent CodeReviewer — approved**\n\n${parsed.reviewBody}`
    );

    await mergePullRequest(
      agentToken,
      input.repoOwner,
      input.repoName,
      input.pullRequestNumber,
      parsed.mergeCommitTitle.trim() || `Merge PR #${input.pullRequestNumber}`
    );

    logger.info(`[${agentName}] Merged PR #${input.pullRequestNumber} (${snapshot.headRef} -> ${snapshot.baseRef})`);

    const issueToClose = parseClosingIssueNumber(snapshot.body);
    if (issueToClose) {
      await closeIssue(agentToken, input.repoOwner, input.repoName, issueToClose);
      logger.info(`[${agentName}] Closed issue #${issueToClose}`);
    } else {
      logger.warn(`[${agentName}] No fixes/closes/resolves #N reference in PR body; issue left open`);
    }

    await maybeOpenHumanReviewPR(agentToken, input, snapshot, issueToClose ?? undefined);

    return { decision: 'approve', reviewBody: parsed.reviewBody, merged: true, openaiResponseId: response.id };
  }

  await addPullRequestComment(
    agentToken,
    input.repoOwner,
    input.repoName,
    input.pullRequestNumber,
    `**TypingAgent CodeReviewer — changes requested**\n\n${parsed.reviewBody}`
  );

  logger.info(`[${agentName}] Declined PR #${input.pullRequestNumber}`);

  return { decision: 'decline', reviewBody: parsed.reviewBody, merged: false, openaiResponseId: response.id };
}
