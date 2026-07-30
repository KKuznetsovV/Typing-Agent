"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ensureQueueExists = ensureQueueExists;
exports.receiveMessages = receiveMessages;
exports.deleteMessage = deleteMessage;
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
        await getQueueUrl(queueName);
        logger_1.logger.info(`Queue ready: ${queueName}`);
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
async function receiveMessages(queueName, maxMessages) {
    const queueUrl = await getQueueUrl(queueName);
    const result = await sqsClient.send(new client_sqs_1.ReceiveMessageCommand({
        QueueUrl: queueUrl,
        MaxNumberOfMessages: maxMessages,
        WaitTimeSeconds: config_1.appConfig.sqs.waitTimeSeconds,
    }));
    return result.Messages ?? [];
}
async function deleteMessage(queueName, receiptHandle) {
    const queueUrl = await getQueueUrl(queueName);
    await sqsClient.send(new client_sqs_1.DeleteMessageCommand({ QueueUrl: queueUrl, ReceiptHandle: receiptHandle }));
}
