import {
  CreateQueueCommand,
  DeleteMessageCommand,
  GetQueueUrlCommand,
  Message,
  ReceiveMessageCommand,
  SQSClient,
} from '@aws-sdk/client-sqs';
import { appConfig } from '../config';
import { logger } from '../logger';

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

export async function ensureQueueExists(queueName: string): Promise<void> {
  try {
    await getQueueUrl(queueName);
    logger.info(`Queue ready: ${queueName}`);
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

export async function receiveMessages(
  queueName: string,
  maxMessages: number
): Promise<Message[]> {
  const queueUrl = await getQueueUrl(queueName);
  const result = await sqsClient.send(
    new ReceiveMessageCommand({
      QueueUrl: queueUrl,
      MaxNumberOfMessages: maxMessages,
      WaitTimeSeconds: appConfig.sqs.waitTimeSeconds,
    })
  );
  return result.Messages ?? [];
}

export async function deleteMessage(
  queueName: string,
  receiptHandle: string
): Promise<void> {
  const queueUrl = await getQueueUrl(queueName);
  await sqsClient.send(
    new DeleteMessageCommand({ QueueUrl: queueUrl, ReceiptHandle: receiptHandle })
  );
}
