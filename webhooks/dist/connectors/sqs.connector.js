"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ensureAllQueuesExist = ensureAllQueuesExist;
exports.sendQueueMessage = sendQueueMessage;
const client_sqs_1 = require("@aws-sdk/client-sqs");
const config_1 = require("../config");
const logger_1 = require("../logger");
const sqsClient = new client_sqs_1.SQSClient({
    region: config_1.appConfig.sqs.region,
    endpoint: config_1.appConfig.sqs.endpoint || undefined,
    credentials: {
        accessKeyId: config_1.appConfig.sqs.accessKeyId,
        secretAccessKey: config_1.appConfig.sqs.secretAccessKey,
    },
});
const queueUrlCache = new Map();
async function getQueueUrl(queueName) {
    const cached = queueUrlCache.get(queueName);
    if (cached)
        return cached;
    const result = await sqsClient.send(new client_sqs_1.GetQueueUrlCommand({ QueueName: queueName }));
    const url = result.QueueUrl;
    if (!url)
        throw new Error(`No URL returned for queue ${queueName}`);
    queueUrlCache.set(queueName, url);
    return url;
}
async function ensureQueueExists(queueName) {
    try {
        const url = await getQueueUrl(queueName);
        logger_1.logger.info(`Queue ready: ${queueName} (${url})`);
    }
    catch {
        await sqsClient.send(new client_sqs_1.CreateQueueCommand({
            QueueName: queueName,
            Attributes: {
                VisibilityTimeout: String(config_1.appConfig.sqs.visibilityTimeoutSeconds),
            },
        }));
        queueUrlCache.delete(queueName);
        logger_1.logger.info(`Queue created: ${queueName}`);
    }
}
async function ensureAllQueuesExist() {
    const queues = Object.values(config_1.appConfig.sqs.queues);
    await Promise.all(queues.map((q) => ensureQueueExists(q)));
}
async function sendQueueMessage(queueName, body) {
    const queueUrl = await getQueueUrl(queueName);
    const result = await sqsClient.send(new client_sqs_1.SendMessageCommand({ QueueUrl: queueUrl, MessageBody: body }));
    return result.MessageId;
}
