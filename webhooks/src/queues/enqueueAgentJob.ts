import { sendQueueMessage } from '../connectors/sqs.connector';
import { logger } from '../logger';
import { AgentJobMessage } from './agentJob.types';
import { appConfig } from '../config';
import { TypingAgentRoute } from './routing';

function getQueueName(route: TypingAgentRoute): string {
  return appConfig.sqs.queues[route];
}

export async function enqueueAgentJob(
  route: TypingAgentRoute,
  message: AgentJobMessage
): Promise<void> {
  const queueName = getQueueName(route);
  const messageId = await sendQueueMessage(queueName, JSON.stringify(message));

  logger.info(
    `[queue] Enqueued ${route} job to ${queueName} (messageId=${messageId ?? 'unknown'}) ` +
      `for ${message.repoOwner}/${message.repoName} issue #${message.issueNumber}`
  );
}
