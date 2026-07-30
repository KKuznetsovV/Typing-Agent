"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.enqueueCodeReviewJob = enqueueCodeReviewJob;
const sqs_connector_1 = require("../connectors/sqs.connector");
const logger_1 = require("../logger");
const config_1 = require("../config");
async function enqueueCodeReviewJob(message) {
    const queueName = config_1.appConfig.sqs.queues.codeReviewer;
    const messageId = await (0, sqs_connector_1.sendQueueMessage)(queueName, JSON.stringify(message));
    logger_1.logger.info(`[queue] Enqueued code-review job to ${queueName} (messageId=${messageId ?? 'unknown'}) ` +
        `for ${message.repoOwner}/${message.repoName} PR #${message.pullRequestNumber}`);
}
