import { runBackendDevAgent } from '../agents/backendDev';
import { appConfig } from '../config';
import { logger } from '../logger';
import { AgentJobMessage } from '../queues/agentJob.types';
import { createAgentWorker } from './createAgentWorker';
import { resolveGithubAccessToken, requireFeatureBranch } from './developerWorker.utils';

async function processBackendDevJob(message: AgentJobMessage): Promise<void> {
  const githubAccessToken = await resolveGithubAccessToken(message.userId);
  const branchName = requireFeatureBranch(message);

  const result = await runBackendDevAgent(githubAccessToken, {
    userId: message.userId,
    repoOwner: message.repoOwner,
    repoName: message.repoName,
    issueNumber: message.issueNumber,
    issueTitle: message.issueTitle,
    issueBody: message.issueBody,
    branchName,
  });

  logger.info(
    `[BackendDev] Completed for ${message.repoOwner}/${message.repoName} issue #${message.issueNumber}` +
      (result.pullRequestUrl ? `: PR at ${result.pullRequestUrl}` : ' (no files changed)')
  );
}

export function createBackendDevWorker(): { start: () => void; stop: () => void } {
  return createAgentWorker({
    workerName: 'BackendDev',
    queueName: appConfig.sqs.queues.backendDev,
    processJob: processBackendDevJob,
  });
}
