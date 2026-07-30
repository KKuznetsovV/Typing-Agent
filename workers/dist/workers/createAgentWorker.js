"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createAgentWorker = createAgentWorker;
const sqs_connector_1 = require("../connectors/sqs.connector");
const config_1 = require("../config");
const logger_1 = require("../logger");
function jobLabel(message, describeJob) {
    if (describeJob)
        return describeJob(message);
    const record = message;
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
function createAgentWorker(options) {
    let running = false;
    async function pollOnce() {
        logger_1.logger.info(`[${options.workerName}] Polling ${options.queueName}...`);
        const messages = await (0, sqs_connector_1.receiveMessages)(options.queueName, 1);
        if (messages.length === 0)
            return;
        for (const message of messages) {
            if (!message.Body || !message.ReceiptHandle)
                continue;
            let payload;
            try {
                payload = JSON.parse(message.Body);
            }
            catch {
                logger_1.logger.error(`[${options.workerName}] Invalid JSON message; skipping`);
                await (0, sqs_connector_1.deleteMessage)(options.queueName, message.ReceiptHandle);
                continue;
            }
            const label = jobLabel(payload, options.describeJob);
            logger_1.logger.info(`[${options.workerName}] Processing ${label} (sqsMessageId=${message.MessageId ?? 'unknown'})`);
            try {
                await options.processJob(payload);
                await (0, sqs_connector_1.deleteMessage)(options.queueName, message.ReceiptHandle);
                logger_1.logger.info(`[${options.workerName}] Done: ${label}`);
            }
            catch (error) {
                (0, logger_1.logError)(`[${options.workerName}] Failed: ${label}`, error);
            }
        }
    }
    async function pollLoop() {
        while (running) {
            try {
                await pollOnce();
            }
            catch (error) {
                (0, logger_1.logError)(`[${options.workerName}] Poll error`, error);
            }
            await new Promise((resolve) => setTimeout(resolve, config_1.appConfig.sqs.pollIntervalMs));
        }
    }
    return {
        start() {
            if (running)
                return;
            running = true;
            logger_1.logger.info(`[${options.workerName}] Worker started (queue: ${options.queueName})`);
            void pollLoop();
        },
        stop() {
            running = false;
            logger_1.logger.info(`[${options.workerName}] Worker stopped`);
        },
    };
}
