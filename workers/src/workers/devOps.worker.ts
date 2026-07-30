import { runDevOpsAgent } from '../agents/devOps';
import { appConfig } from '../config';
import { logger } from '../logger';
import { AgentJobMessage } from '../queues/agentJob.types';
import { createAgentWorker } from './createAgentWorker';
import { resolveGithubAccessToken, requireFeatureBranch } from './developerWorker.utils';

async function processDevOpsJob(message: AgentJobMessage): Promise<void> {
  const githubAccessToken = await resolveGithubAccessToken(message.userId);
  const branchName = requireFeatureBranch(message);

  const result = await runDevOpsAgent(githubAccessToken, {
    userId: message.userId,
    repoOwner: message.repoOwner,
    repoName: message.repoName,
    issueNumber: message.issueNumber,
    issueTitle: message.issueTitle,
    issueBody: message.issueBody,
    branchName,
  });

  logger.info(
    `[DevOps] Completed for ${message.repoOwner}/${message.repoName} issue #${message.issueNumber}` +
      (result.pullRequestUrl ? `: PR at ${result.pullRequestUrl}` : ' (no files changed)')
  );
}

export function createDevOpsWorker(): { start: () => void; stop: () => void } {
  return createAgentWorker({
    workerName: 'DevOps',
    queueName: appConfig.sqs.queues.devOps,
    processJob: processDevOpsJob,
  });
}
