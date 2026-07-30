import {
  CreateQueueCommand,
  GetQueueUrlCommand,
  SendMessageCommand,
  SQSClient,
} from '@aws-sdk/client-sqs';
import { appConfig } from '../config';
import { logError, logger } from '../logger';

const sqsClient = new SQSClient({
  region: appConfig.sqs.region,
  endpoint: appConfig.sqs.endpoint || undefined,
  credentials: {
    accessKeyId: appConfig.sqs.accessKeyId,
    secretAccessKey: appConfig.sqs.secretAccessKey,
  },
});

const queueUrlCache = new Map<string, string>();

async function getQueueUrl(queueName: string): Promise<string> {
  const cached = queueUrlCache.get(queueName);
  if (cached) return cached;

  const result = await sqsClient.send(new GetQueueUrlCommand({ QueueName: queueName }));
  const url = result.QueueUrl;
  if (!url) throw new Error(`No URL returned for queue ${queueName}`);

  queueUrlCache.set(queueName, url);
  return url;
}

async function ensureQueueExists(queueName: string): Promise<void> {
  try {
    const url = await getQueueUrl(queueName);
    logger.info(`Queue ready: ${queueName} (${url})`);
  } catch {
    await sqsClient.send(
      new CreateQueueCommand({
        QueueName: queueName,
        Attributes: {
          VisibilityTimeout: String(appConfig.sqs.visibilityTimeoutSeconds),
        },
      })
    );
    queueUrlCache.delete(queueName);
    logger.info(`Queue created: ${queueName}`);
  }
}

export async function ensureAllQueuesExist(): Promise<void> {
  const queues = Object.values(appConfig.sqs.queues);
  await Promise.all(queues.map((q) => ensureQueueExists(q)));
}

export async function sendQueueMessage(
  queueName: string,
  body: string
): Promise<string | undefined> {
  const queueUrl = await getQueueUrl(queueName);
  const result = await sqsClient.send(
    new SendMessageCommand({ QueueUrl: queueUrl, MessageBody: body })
  );
  return result.MessageId;
}
