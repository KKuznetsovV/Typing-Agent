import { runTechLeadAgent } from '../agents/techLead';
import { appConfig } from '../config';
import { logger } from '../logger';
import { AgentJobMessage } from '../queues/agentJob.types';
import { createAgentWorker } from './createAgentWorker';
import { resolveGithubAccessToken } from './developerWorker.utils';

async function processTechLeadJob(message: AgentJobMessage): Promise<void> {
  const githubAccessToken = await resolveGithubAccessToken(message.userId);

  const result = await runTechLeadAgent({
    githubAccessToken,
    repoOwner: message.repoOwner,
    repoName: message.repoName,
    issueTitle: message.issueTitle,
    issueBody: message.issueBody,
    parentIssueNumber: message.issueNumber,
  });

  logger.info(
    `[TechLead] Created branch ${result.branchName} and ${result.createdIssues.length} sub-issue(s) ` +
      `for ${message.repoOwner}/${message.repoName} issue #${message.issueNumber}`
  );
  for (const issue of result.createdIssues) {
    logger.info(`[TechLead]   - ${issue.agent}: ${issue.title} (${issue.url})`);
  }
}

export function createTechLeadWorker(): { start: () => void; stop: () => void } {
  return createAgentWorker({
    workerName: 'TechLead',
    queueName: appConfig.sqs.queues.techLead,
    processJob: processTechLeadJob,
  });
}
