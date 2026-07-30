import { deleteMessage, receiveMessages } from '../connectors/sqs.connector';
import { appConfig } from '../config';
import { logError, logger } from '../logger';

type JobProcessor<T> = (message: T) => Promise<void>;

interface AgentWorkerOptions<T> {
  workerName: string;
  queueName: string;
  processJob: JobProcessor<T>;
  describeJob?: (message: T) => string;
}

function jobLabel<T>(message: T, describeJob?: (m: T) => string): string {
  if (describeJob) return describeJob(message);

  const record = message as Record<string, unknown>;
  if (typeof record.repoOwner === 'string' && typeof record.repoName === 'string') {
    if (typeof record.pullRequestNumber === 'number') {
      return `${record.repoOwner}/${record.repoName} PR #${record.pullRequestNumber}`;
    }
    if (typeof record.issueNumber === 'number') {
      return `${record.repoOwner}/${record.repoName} issue #${record.issueNumber}`;
    }
  }
  return JSON.stringify(message);
}

export function createAgentWorker<T>(options: AgentWorkerOptions<T>): {
  start: () => void;
  stop: () => void;
} {
  let running = false;

  async function pollOnce(): Promise<void> {
    logger.info(`[${options.workerName}] Polling ${options.queueName}...`);
    const messages = await receiveMessages(options.queueName, 1);
    if (messages.length === 0) return;

    for (const message of messages) {
      if (!message.Body || !message.ReceiptHandle) continue;

      let payload: T;
      try {
        payload = JSON.parse(message.Body) as T;
      } catch {
        logger.error(`[${options.workerName}] Invalid JSON message; skipping`);
        await deleteMessage(options.queueName, message.ReceiptHandle);
        continue;
      }

      const label = jobLabel(payload, options.describeJob);
      logger.info(
        `[${options.workerName}] Processing ${label} (sqsMessageId=${message.MessageId ?? 'unknown'})`
      );

      try {
        await options.processJob(payload);
        await deleteMessage(options.queueName, message.ReceiptHandle);
        logger.info(`[${options.workerName}] Done: ${label}`);
      } catch (error) {
        logError(`[${options.workerName}] Failed: ${label}`, error);
      }
    }
  }

  async function pollLoop(): Promise<void> {
    while (running) {
      try {
        await pollOnce();
      } catch (error) {
        logError(`[${options.workerName}] Poll error`, error);
      }
      await new Promise<void>((resolve) => setTimeout(resolve, appConfig.sqs.pollIntervalMs));
    }
  }

  return {
    start(): void {
      if (running) return;
      running = true;
      logger.info(`[${options.workerName}] Worker started (queue: ${options.queueName})`);
      void pollLoop();
    },
    stop(): void {
      running = false;
      logger.info(`[${options.workerName}] Worker stopped`);
    },
  };
}
