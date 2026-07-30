import { sendQueueMessage } from '../connectors/sqs.connector';
import { logger } from '../logger';
import { CodeReviewJobMessage } from './codeReviewJob.types';
import { appConfig } from '../config';

export async function enqueueCodeReviewJob(message: CodeReviewJobMessage): Promise<void> {
  const queueName = appConfig.sqs.queues.codeReviewer;
  const messageId = await sendQueueMessage(queueName, JSON.stringify(message));

  logger.info(
    `[queue] Enqueued code-review job to ${queueName} (messageId=${messageId ?? 'unknown'}) ` +
      `for ${message.repoOwner}/${message.repoName} PR #${message.pullRequestNumber}`
  );
}
