import { runCodeReviewerAgent } from '../agents/codeReviewer';
import { appConfig } from '../config';
import { logger } from '../logger';
import { CodeReviewJobMessage } from '../queues/codeReviewJob.types';
import { createAgentWorker } from './createAgentWorker';
import { resolveGithubAccessToken } from './developerWorker.utils';

async function processCodeReviewJob(message: CodeReviewJobMessage): Promise<void> {
  const githubAccessToken = await resolveGithubAccessToken(message.userId);

  const result = await runCodeReviewerAgent(githubAccessToken, message);

  logger.info(
    `[CodeReviewer] Decision: ${result.decision} for ` +
      `${message.repoOwner}/${message.repoName} PR #${message.pullRequestNumber}`
  );
}

export function createCodeReviewerWorker(): { start: () => void; stop: () => void } {
  return createAgentWorker({
    workerName: 'CodeReviewer',
    queueName: appConfig.sqs.queues.codeReviewer,
    processJob: processCodeReviewJob,
    describeJob: (m) => `${m.repoOwner}/${m.repoName} PR #${m.pullRequestNumber}`,
  });
}
